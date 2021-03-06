import { byEva, byName, byPosition, byRl100, keys } from 'business-hub';
import { CacheDatabases, createNewCache } from 'server/cache';
import { getSingleStation } from 'server/iris/station';
import { manualNameOverrides } from 'server/StopPlace/manualNameOverrides';
import { StopPlaceKeyType } from 'business-hub/types/RisStations';
import type { GroupedStopPlace, StopPlaceIdentifier } from 'types/stopPlace';
import type {
  StopPlace,
  StopPlaceSearchResult,
} from 'business-hub/types/RisStations';

const ttl = 5 * 24 * 60 * 60;

const stopPlaceSearchCache = createNewCache<string, GroupedStopPlace[]>(
  ttl,
  CacheDatabases.StopPlaceSearch,
);
const stopPlaceGeoCache = createNewCache<string, GroupedStopPlace[]>(
  ttl,
  CacheDatabases.StopPlaceGeo,
);
const stopPlaceIdentifierCache = createNewCache<
  string,
  StopPlaceIdentifier | undefined
>(ttl, CacheDatabases.StopPlaceIdentifier);
const stopPlaceByRilCache = createNewCache<string, StopPlace>(
  ttl,
  CacheDatabases.StopPlaceByRil,
);
const stopPlaceByEvaCache = createNewCache<string, GroupedStopPlace>(
  ttl,
  CacheDatabases.StopPlaceByEva,
);

function mapToGroupedStopPlace(
  stopPlace: Pick<
    StopPlaceSearchResult,
    'evaNumber' | 'names' | 'availableTransports' | 'position'
  >,
): GroupedStopPlace {
  return {
    evaNumber: stopPlace.evaNumber,
    name: stopPlace.names.DE.nameLong,
    availableTransports: stopPlace.availableTransports,
    position: stopPlace.position,
  };
}

async function irisFilter(
  stopPlaces: GroupedStopPlace[],
): Promise<GroupedStopPlace[]> {
  return (
    await Promise.all(
      stopPlaces.map(async (stopPlace) => {
        try {
          await getSingleStation(stopPlace.evaNumber);
          return stopPlace;
        } catch {
          return undefined;
        }
      }),
    )
  ).filter(Boolean as unknown as ExcludesFalse);
}

export async function searchStopPlace(
  searchTerm?: string,
  max?: number,
  filterForIris?: boolean,
): Promise<GroupedStopPlace[]> {
  if (!searchTerm) return [];

  searchTerm = manualNameOverrides.get(searchTerm.toLowerCase()) || searchTerm;

  let groupedStopPlaces =
    (await stopPlaceSearchCache.get(searchTerm)) ||
    (await searchStopPlaceRemote(searchTerm));

  if (max) {
    groupedStopPlaces = groupedStopPlaces.splice(0, max);
  }

  if (filterForIris) {
    groupedStopPlaces = await irisFilter(groupedStopPlaces);
  }

  return groupedStopPlaces;
}

export async function getStopPlaceByEva(
  evaNumber: string,
): Promise<GroupedStopPlace | undefined> {
  const cached = await stopPlaceByEvaCache.get(evaNumber);
  if (cached) return cached;
  const risResult = await byEva(evaNumber);
  if (risResult) {
    const groupedStopPlace = mapToGroupedStopPlace(risResult);
    void stopPlaceByEvaCache.set(groupedStopPlace.evaNumber, groupedStopPlace);
    return groupedStopPlace;
  }
}

export async function geoSearchStopPlace(
  lat: number,
  lng: number,
  radius: number,
  max?: number,
  filterForIris?: boolean,
): Promise<GroupedStopPlace[]> {
  const cacheKey = `${lat}_${lng}_${radius}`;
  const cached = await stopPlaceGeoCache.get(cacheKey);
  if (cached) return cached;

  let groupedStopPlaces = (await byPosition(lat, lng, radius)).map(
    mapToGroupedStopPlace,
  );
  await addIdentifiers(groupedStopPlaces);
  void stopPlaceGeoCache.set(cacheKey, groupedStopPlaces);

  if (max) {
    groupedStopPlaces = groupedStopPlaces.splice(0, max);
  }

  if (filterForIris) {
    groupedStopPlaces = await irisFilter(groupedStopPlaces);
  }

  return groupedStopPlaces;
}

export async function byRl100WithSpaceHandling(
  rl100: string,
): Promise<StopPlace | undefined> {
  if (rl100.length > 5) {
    return Promise.resolve(undefined);
  }
  const cached = await stopPlaceByRilCache.get(rl100);
  if (cached) {
    return cached;
  }
  const rl100Promise = byRl100(rl100.toUpperCase());
  let rl100DoubleSpacePromise: typeof rl100Promise = Promise.resolve(undefined);
  if (rl100.length < 5 && rl100.includes(' ')) {
    rl100DoubleSpacePromise = byRl100(rl100.replace(/ /g, '  ').toUpperCase());
  }
  const result = (await rl100Promise) || (await rl100DoubleSpacePromise);
  if (result) {
    void stopPlaceByRilCache.set(rl100, result);
  }
  return result;
}

async function searchStopPlaceRemote(searchTerm: string) {
  const rl100Promise = byRl100WithSpaceHandling(searchTerm.toUpperCase());
  const risResultPromise = byName(searchTerm);
  const risResult = await risResultPromise;
  const rl100Result = await rl100Promise;
  const groupedStopPlaces = risResult.map(mapToGroupedStopPlace);
  if (rl100Result) {
    groupedStopPlaces.unshift(mapToGroupedStopPlace(rl100Result));
  }
  await addIdentifiers(groupedStopPlaces);

  void stopPlaceSearchCache.set(searchTerm, groupedStopPlaces);
  groupedStopPlaces.forEach((s) => {
    void stopPlaceByEvaCache.set(s.evaNumber, s);
  });
  return groupedStopPlaces;
}

async function addIdentifiers(stopPlaces: GroupedStopPlace[]): Promise<void> {
  await Promise.all(
    stopPlaces.map(async (stopPlace) => {
      stopPlace.identifier = await getIdentifiers(stopPlace.evaNumber);
    }),
  );
}

export async function getIdentifiers(
  evaNumber: string,
): Promise<StopPlaceIdentifier | undefined> {
  const cached = await stopPlaceIdentifierCache.get(evaNumber);
  if (cached) return Object.values(cached).length > 0 ? cached : undefined;
  const identifier: StopPlaceIdentifier = {};
  try {
    const stopPlaceKeys = await keys(evaNumber);
    stopPlaceKeys.forEach(({ type, key }) => {
      switch (type) {
        case StopPlaceKeyType.IFOPT:
          identifier.ifopt = key;
          break;
        case StopPlaceKeyType.RL100:
          identifier.ril100 = key;
          break;
        case StopPlaceKeyType.RL100ALTERNATIVE:
          if (!identifier.alternativeRil100) {
            identifier.alternativeRil100 = [];
          }
          identifier.alternativeRil100.push(key);
          break;
        case StopPlaceKeyType.STADA:
          identifier.stationId = key;
          break;
      }
    });
    void stopPlaceIdentifierCache.set(evaNumber, identifier);
    if (Object.keys(identifier).length > 0) {
      return identifier;
    }
  } catch {
    // Failed, guess no identifier
  }

  return undefined;
}
