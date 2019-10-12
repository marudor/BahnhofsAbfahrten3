import { Abfahrt } from 'types/api/iris';
import { AxiosInstance } from 'axios';
import { compareAsc } from 'date-fns';
import { getStation } from './station';
import { noncdAxios } from './helper';
import Timetable, { Result } from './Timetable';

type AbfahrtenOptions = {
  lookahead?: number;
  lookbehind?: number;
  currentDate?: Date;
  skipLageplan?: boolean;
};
const defaultOptions = {
  lookahead: 150,
  lookbehind: 0,
};

const baseResult: Result = {
  departures: [],
  lookbehind: [],
  wings: {},
  lageplan: undefined,
};

export function reduceResults(agg: Result, r: Result): Result {
  return {
    departures: [...agg.departures, ...r.departures],
    lookbehind: [...agg.lookbehind, ...r.lookbehind],
    wings: {
      ...agg.wings,
      ...r.wings,
    },
    // eslint-disable-next-line no-nested-ternary
    lageplan: r.lageplan
      ? r.lageplan
      : agg.lageplan !== undefined
      ? agg.lageplan
      : r.lageplan,
  };
}

const timeByScheduled = (a: Abfahrt) => {
  const onlyDepartureCancelled =
    !a.cancelled && a.departure && a.departure.cancelled;
  const arrivalScheduledTime = a.arrival && a.arrival.scheduledTime;
  const departureScheduledTime = a.departure && a.departure.scheduledTime;

  return onlyDepartureCancelled
    ? arrivalScheduledTime || departureScheduledTime
    : departureScheduledTime || arrivalScheduledTime;
};

const timeByReal = (a: Abfahrt) => {
  const onlyDepartureCancelled =
    !a.cancelled && a.departure && a.departure.cancelled;
  const arrivalTime = a.arrival && a.arrival.time;
  const departureTime = a.departure && a.departure.time;

  return onlyDepartureCancelled
    ? arrivalTime || departureTime
    : departureTime || arrivalTime;
};

const sortAbfahrt = (timeFn: typeof timeByReal) => (a: Abfahrt, b: Abfahrt) => {
  const timeA = timeFn(a);
  const timeB = timeFn(b);
  // @ts-ignore - either arrival or departure always exists
  const sort = compareAsc(timeA, timeB);

  if (!sort) {
    const splittedA = a.rawId.split('-');
    const splittedB = b.rawId.split('-');

    return splittedA[splittedA.length - 2] > splittedB[splittedB.length - 2]
      ? 1
      : -1;
  }

  return sort;
};

export async function getAbfahrten(
  evaId: string,
  withRelated: boolean = true,
  options: AbfahrtenOptions = {},
  axios: AxiosInstance = noncdAxios
): Promise<Result> {
  const lookahead = options.lookahead || defaultOptions.lookahead;
  const lookbehind = options.lookbehind || defaultOptions.lookbehind;

  const { station, relatedStations } = await getStation(evaId, 1, axios);
  let relatedAbfahrten = Promise.resolve(baseResult);

  if (withRelated) {
    relatedAbfahrten = Promise.all(
      relatedStations.map(s => getAbfahrten(s.eva, false, options, axios))
    ).then(r => r.reduce(reduceResults, baseResult));
  }

  const timetable = new Timetable(
    evaId,
    station.name,
    {
      lookahead,
      lookbehind,
      currentDate: options.currentDate,
    },
    axios
  );
  const result = (await Promise.all([
    timetable.start(options.skipLageplan),
    relatedAbfahrten,
  ])).reduce(reduceResults, baseResult);

  result.departures.sort(sortAbfahrt(timeByScheduled));
  result.lookbehind.sort(sortAbfahrt(timeByReal));

  return result;
}
