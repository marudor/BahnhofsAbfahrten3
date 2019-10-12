import { AllowedHafasProfile } from 'types/HAFAS';
import { SearchOnTripRequest } from 'types/HAFAS/SearchOnTrip';
import auslastungHafas from 'server/Auslastung/Hafas';
import detail from 'server/HAFAS/Detail';
import geoStation from 'server/HAFAS/LocGeoPos';
import journeyDetails from 'server/HAFAS/JourneyDetails';
import journeyMatch from 'server/HAFAS/JourneyMatch';
import KoaRouter from 'koa-router';
import LocMatch from 'server/HAFAS/LocMatch';
import makeRequest from 'server/HAFAS/Request';
import routing from 'server/HAFAS/TripSearch';
import searchOnTrip from 'server/HAFAS/SearchOnTrip';
import stationBoard from 'server/HAFAS/StationBoard';
import trainSearch from 'server/HAFAS/TrainSearch';

const router = new KoaRouter();
const getCurrent = () =>
  new KoaRouter<
    any,
    {
      hafasProfile?: AllowedHafasProfile;
    }
  >()
    .get('/journeyDetails/:jid', async ctx => {
      const { jid }: { jid: string } = ctx.params;

      ctx.body = await journeyDetails(jid, ctx.hafasProfile);
    })
    .post('/SearchOnTrip', async ctx => {
      const {
        sotMode,
        id,
      }: {
        sotMode: SearchOnTripRequest['req']['sotMode'];
        id: string;
      } = ctx.request.body;

      let req;

      if (sotMode === 'RC') {
        req = {
          sotMode,
          ctxRecon: id,
        };
      } else {
        req = {
          sotMode,
          jid: id,
        };
      }

      ctx.body = await searchOnTrip(req, ctx.hafasProfile);
    })
    .get('/details/:trainName/:date?', async ctx => {
      const { date, trainName } = ctx.params;
      const { stop } = ctx.query;

      ctx.body = await detail(
        trainName,
        stop,
        date ? Number.parseInt(date, 10) : undefined,
        ctx.hafasProfile
      );
      if (!ctx.body) {
        ctx.status = 404;
      }
    })
    .get('/auslastung/:start/:dest/:trainNumber/:time', async ctx => {
      const { start, dest, time, trainNumber } = ctx.params;

      ctx.body = await auslastungHafas(
        start,
        dest,
        trainNumber,
        Number.parseInt(time, 10)
      );
    })
    .get('/ArrStationBoard', async ctx => {
      const { date, station } = ctx.query;

      ctx.body = await stationBoard(
        {
          type: 'ARR',
          station,
          date: Number.parseInt(date, 10) || undefined,
        },
        ctx.hafasProfile
      );
    })
    .get('/DepStationBoard', async ctx => {
      const { date, station, direction } = ctx.query;

      // if (ctx.hafasProfile === 'all') {
      //   const prod = global.PROD;

      //   global.PROD = true;
      //   const promises: any[] = [];

      //   Object.keys(AllowedHafasProfile).forEach(p => {
      //     // @ts-ignore
      //     promises.push(
      //       stationBoard(
      //         {
      //           type: 'DEP',
      //           station,
      //           date: Number.parseInt(date, 10) || undefined,
      //         },
      //         p
      //       ).then(r => [p, r])
      //     );
      //   });
      //   const results = await Promise.all(promises);

      //   global.PROD = prod;

      //   ctx.body = results.reduce((agg, [p, r]) => {
      //     agg[p] = r;

      //     return agg;
      //   }, {});

      //   return;
      // }
      ctx.body = await stationBoard(
        {
          type: 'DEP',
          station,
          direction,
          date: Number.parseInt(date, 10) || undefined,
        },
        ctx.hafasProfile
      );
    })
    .get('/trainSearch/:trainName/:date?', async ctx => {
      const { date, trainName } = ctx.params;

      ctx.body = await trainSearch(
        trainName,
        date ? Number.parseInt(date, 10) : undefined,
        ctx.hafasProfile
      );
    })
    .get('/journeyMatch/:trainName/:date?', async ctx => {
      const { date, trainName } = ctx.params;

      ctx.body = await journeyMatch(
        trainName,
        date ? Number.parseInt(date, 10) : undefined,
        ctx.hafasProfile
      );
    })
    .get('/geoStation', async ctx => {
      const { x, y, lat, lng, maxDist = 1000 } = ctx.query;

      const realY = lat ? Number.parseFloat(lat) * 1000000 : y;
      const realX = lng ? Number.parseFloat(lng) * 1000000 : x;

      ctx.body = await geoStation(realX, realY, maxDist);
    })
    .get('/station/:searchTerm', async ctx => {
      const { searchTerm } = ctx.params;

      ctx.body = await LocMatch(searchTerm, undefined, ctx.hafasProfile);
    })
    .post('/rawHafas', async ctx => {
      ctx.body = await makeRequest(
        ctx.request.body,
        undefined,
        ctx.hafasProfile
      );
    })
    .post('/route', async ctx => {
      ctx.body = await routing(
        {
          ...ctx.request.body,
          time: Number.parseInt(ctx.request.body.time, 10),
        },
        ctx.query.profile
      );
    });

router
  .prefix('/hafas')
  .use((ctx, next) => {
    const hafasProfile = ctx.query.profile;

    if (
      !hafasProfile ||
      // hafasProfile === 'all' ||
      // @ts-ignore 7053
      AllowedHafasProfile[hafasProfile]
    ) {
      ctx.hafasProfile = hafasProfile;
    } else {
      throw `${hafasProfile} is not a valid profile`;
    }

    return next();
  })
  .use('/current', getCurrent().routes())
  .use('/v1', getCurrent().routes());

export default router;
export const versions = ['v1'];
