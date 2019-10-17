import { AllowedHafasProfile } from 'types/HAFAS';
import { formatToTimeZone } from 'date-fns-timezone';
import { TripSearchRequest } from 'types/HAFAS/TripSearch';
import makeRequest from '../Request';
import tripSearchParse from './parse';

export type Options = {
  start: string;
  destination: string;
  time: number;
  transferTime?: number;
  maxChanges?: number;
  getPasslist?: boolean;
  searchForDeparture?: boolean;
  economic?: boolean;
  getTariff?: boolean;
  ushrp?: boolean;
  getPolyline?: boolean;
  getIV?: boolean;
  numF?: number;
  ctxScr?: string;
};

function route(
  {
    start,
    destination,
    time,
    transferTime = -1,
    maxChanges = -1,
    searchForDeparture = true,
    // stops in between
    getPasslist = true,
    economic = false,
    getTariff = false,
    // Umgebung reicht als stationen?
    ushrp = false,
    // unknown data
    getPolyline = false,
    // unknown flag
    getIV = false,
    // Number of results to fetch
    numF = 6,
    ctxScr,
  }: Options,
  profile?: AllowedHafasProfile
) {
  let requestTypeSpecific;

  if (time) {
    requestTypeSpecific = {
      outDate: formatToTimeZone(time, 'YYYYMMDD', {
        timeZone: 'Europe/Berlin',
      }),
      outTime: formatToTimeZone(time, 'HHmmss', {
        timeZone: 'Europe/Berlin',
      }),
    };
  } else if (ctxScr) {
    requestTypeSpecific = {
      ctxScr,
    };
  } else {
    throw new Error('Either Time or Context required');
  }

  const req: TripSearchRequest = {
    req: {
      // jnyFltrL: [
      //   {
      //     // value: '1023',
      //     // mode: 'INC',
      //     type: 'PROD',
      //   },
      // ],
      // Always true!
      getPT: true,
      numF,
      ...requestTypeSpecific,
      maxChg: maxChanges,
      minChgTime: transferTime,
      // get stops in between
      getPasslist,
      economic,
      getTariff,
      ushrp,
      getPolyline,
      getIV,
      // arrival / departure
      outFrwd: searchForDeparture,
      arrLocL: [
        {
          lid: `A=1@L=${destination}`,
        },
      ],
      depLocL: [
        {
          lid: `A=1@L=${start}`,
        },
      ],
    },
    meth: 'TripSearch',
  };

  return makeRequest(req, tripSearchParse, profile);
}

export default route;
