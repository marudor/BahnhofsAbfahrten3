/* eslint-disable array-callback-return */
/* eslint-disable no-fallthrough */
import {
  AdditionalFahrzeugInfo,
  BRInfo,
  Fahrzeug,
  Fahrzeuggruppe,
  Formation,
  Wagenreihung,
  WagenreihungStation,
} from 'types/reihung';
import { convertToTimeZone } from 'date-fns-timezone';
import { format, isAfter, subDays } from 'date-fns';
import { getAbfahrten } from './Abfahrten';
import { getAP } from 'server/Wifi';
import { groupBy, maxBy, minBy } from 'lodash';
import axios from 'axios';

const getATBR = (
  code: string,
  _serial: string,
  _fahrzeugTypes: string[]
): undefined | BRInfo => {
  switch (code) {
    case '4011':
      return {
        name: 'ICE T',
        BR: '411',
        serie: '1',
      };
  }
};
const getDEBR = (
  code: string,
  uicOrdnungsnummer: string,
  fahrzeugTypes: string[]
): undefined | BRInfo => {
  switch (code) {
    case '0812':
    case '1412':
    case '1812':
    case '2412':
    case '2812':
    case '3412':
    case '4812':
    case '5812':
    case '6412':
    case '6812':
    case '7412':
    case '7812':
    case '8812':
    case '9412':
    case '9812':
      return {
        name: 'ICE 4',
        BR: '412',
      };
    case '5401':
    case '5801':
    case '5802':
    case '5803':
    case '5804':
      return {
        name: 'ICE 1',
        BR: '401',
      };
    case '5402':
    case '5805':
    case '5806':
    case '5807':
    case '5808':
      return {
        name: 'ICE 2',
        BR: '402',
      };
    case '5403':
      return {
        name: 'ICE 3',
        BR: '403',
        serie:
          Number.parseInt(uicOrdnungsnummer.substr(1), 10) <= 37 ? '1' : '2',
        redesign: fahrzeugTypes.includes('WRmz'),
      };
    case '5406':
      return {
        name: 'ICE 3',
        BR: '406',
      };
    case '5407':
      return {
        name: 'ICE 3 Velaro',
        BR: '407',
      };
    case '5410':
      return {
        name: 'ICE S',
        BR: '410.1',
        noPdf: true,
      };
    case '5411':
      return {
        name: 'ICE T',
        BR: '411',
        serie: Number.parseInt(uicOrdnungsnummer, 10) <= 32 ? '1' : '2',
      };
    case '5415':
      return {
        name: 'ICE T',
        BR: '415',
      };
    case '5475':
      return {
        name: 'TGV',
        noPdf: true,
      };
  }
};
const getSpecificBR = (
  fahrzeugnummer: string,
  fahrzeugTypes: string[]
): undefined | BRInfo => {
  const country = fahrzeugnummer.substr(2, 2);
  const code = fahrzeugnummer.substr(4, 4);
  const serial = fahrzeugnummer.substr(8, 3);

  let info;

  switch (country) {
    case '80':
      info = getDEBR(code, serial, fahrzeugTypes);
      break;
    case '81':
      info = getATBR(code, serial, fahrzeugTypes);
      break;
  }

  return info;
};

const countryMapping: any = {
  80: 'DE',
  81: 'AT',
  83: 'IT',
  84: 'NL',
  85: 'CH',
  86: 'DK',
  87: 'FR',
};
const CHICWagons = ['Apmz', 'WRmz', 'Bpmz'];
const getCountry = (fahrzeuge: Fahrzeug[], fahrzeugTypes: string[]) => {
  const countries = fahrzeuge.map(f => {
    const countryCode = Number.parseInt(f.fahrzeugnummer.substr(2, 2), 10);

    if (countryCode) {
      return countryMapping[countryCode] || countryCode;
    }
  });

  const firstCountry = countries.filter(Boolean)[0];

  if (firstCountry) {
    return firstCountry;
  }

  const wagenOrdnungsNummern = fahrzeuge.map(f =>
    Number.parseInt(f.wagenordnungsnummer, 10)
  );
  const minOrdnungsnummer = minBy(wagenOrdnungsNummern) as number;
  const maxOrdnungsnummer = maxBy(wagenOrdnungsNummern) as number;
  const groupedFahrzeugTypes = groupBy(fahrzeugTypes);

  if (
    fahrzeuge.length > 10 &&
    minOrdnungsnummer >= 253 &&
    maxOrdnungsnummer <= 264 &&
    fahrzeuge.every(f => CHICWagons.includes(f.fahrzeugtyp))
  ) {
    return 'CH';
  } else if (
    minOrdnungsnummer >= 255 &&
    maxOrdnungsnummer <= 263 &&
    groupedFahrzeugTypes.Bdmpz &&
    groupedFahrzeugTypes.Bdmpz.length === 1 &&
    groupedFahrzeugTypes.Bhmpz &&
    groupedFahrzeugTypes.Bhmpz.length === 1
  ) {
    return 'CZ';
  } else if (minOrdnungsnummer === 81 && maxOrdnungsnummer === 82) {
    return 'DK';
  }
};

// Reihenfolge wichtig! Wenn nicht eines der oberen DANN sind die unteren "unique"
const ICETspecific = ['ABpmz', 'Bpmkz'];
const ICE4specific = ['Bpmdz', 'Bpmdzf'];
const ICE3Velarospecific = ['ARmz'];
const ICE3specific = ['Apmzf', 'Bpmbz', 'BRmz'];
const METspecific = ['Apmbzf'];
const ICE2specific = ['Apmz', 'Bpmz'];
const ICE1specific = ['Avmz', 'Bvmbz', 'Bvmz'];
// Rausfinden was für ein ICE es genau ist

function brByFahrzeuge(fahrzeuge: Fahrzeug[]): undefined | BRInfo {
  const wagenTypes = fahrzeuge.map(f => f.fahrzeugtyp);

  if (wagenTypes.some(t => ICETspecific.includes(t))) {
    return {
      name: 'ICE T',
      BR: fahrzeuge.length === 5 ? '415' : '411',
    };
  }

  if (fahrzeuge.length > 10 && wagenTypes.some(t => ICE4specific.includes(t))) {
    return {
      name: 'ICE 4',
      BR: '412',
    };
  }

  if (wagenTypes.some(t => ICE3Velarospecific.includes(t))) {
    return {
      name: 'ICE 3 Velaro',
      BR: '406',
    };
  }

  const triebboepfe = fahrzeuge.filter(
    f => f.kategorie === 'LOK' || f.kategorie === 'TRIEBKOPF'
  );

  if (triebboepfe.length === 1) {
    return {
      name: 'ICE 2',
      BR: '403',
    };
  }
  if (triebboepfe.length === 2) {
    return {
      name: 'ICE 1',
      BR: '401',
    };
  }

  if (wagenTypes.some(t => METspecific.includes(t))) {
    return {
      name: 'MET',
      pdf: 'MET',
    };
  }

  if (wagenTypes.some(t => ICE3specific.includes(t))) {
    const BR = wagenTypes.some(t => t === 'Apmz') ? '407' : '403';
    const redesign = wagenTypes.some(t => t === 'WRmz');

    return {
      name: 'ICE 3',
      BR,
      redesign,
      noPdf: BR === '403' && !redesign,
    };
  }
  if (wagenTypes.some(t => ICE2specific.includes(t))) {
    return {
      name: 'ICE 2',
      BR: '403',
    };
  }
  if (wagenTypes.some(t => ICE1specific.includes(t))) {
    return {
      name: 'ICE 1',
      BR: '401',
    };
  }
}

const specificBR = (
  fahrzeuge: Fahrzeug[],
  fahrzeugTypes: string[],
  formation: Formation
): BRInfo => {
  for (const f of fahrzeuge) {
    const br = getSpecificBR(f.fahrzeugnummer, fahrzeugTypes);

    if (br) return br;
  }

  if (fahrzeuge.find(f => f.fahrzeugtyp === 'Apmbzf')) {
    return {
      name: 'MET',
      pdf: 'MET',
    };
  } else if (fahrzeuge.find(f => f.fahrzeugtyp === 'DBpbzfa')) {
    return {
      name: 'IC 2',
      pdf: 'IC2',
    };
  }

  if (formation.zuggattung === 'ICE') {
    const br = brByFahrzeuge(fahrzeuge);

    if (br) {
      return br;
    }
  }

  const fallback: BRInfo = { name: formation.zuggattung, noPdf: true };

  return fallback;
};

function fahrtrichtung(fahrzeuge: Fahrzeug[]) {
  const first = fahrzeuge[0];
  const last = fahrzeuge[fahrzeuge.length - 1];

  // "Algorithmus" so bei der DB im Code gefunden
  return (
    Number.parseInt(last.positionamhalt.startprozent, 10) >
    Number.parseInt(first.positionamhalt.startprozent, 10)
  );
}

const getComfortSeats = (br: BRInfo, klasse: 1 | 2) => {
  switch (br.BR) {
    case '401':
      return klasse === 1 ? '11-36' : '11-57';
    case '402':
      return klasse === 1 ? '11-16, 21, 22' : '81-108';
    case '403':
    case '406':
      if (klasse === 1) return '12-26';

      return br.redesign ? '11-37' : '11-38';
    case '407':
      return klasse === 1 ? '21-26, 31, 33, 35' : '31-55, 57';
    case '411':
      return klasse === 1 ? '41, 46, 52, 54-56' : '92, 94, 96, 98, 101-118';
    case '412':
      return klasse === 1 ? '11-46' : '11-68';
    case '415':
      return klasse === 1 ? '52, 54, 56' : '81-88, 91-98';
  }

  switch (br.name) {
    case 'MET':
      return klasse === 1 ? '61-66' : '91-106';
    case 'IC 2':
      return klasse === 1 ? '73, 75, 83-86' : '31-38, 41-45, 47';
  }
};

const getDisabledSeats = (
  br: BRInfo,
  klasse: 1 | 2,
  wagenordnungsnummer: string
) => {
  switch (br.BR) {
    case '401':
      return klasse === 1 ? '51, 52, 53, 55' : '111-116';
    case '402':
      return klasse === 1 ? '12, 21' : '81, 85-88';
    case '403':
    case '406':
      if (klasse === 1) return '64, 66';
      if (wagenordnungsnummer === '25' || wagenordnungsnummer === '35') {
        return br.redesign ? '61, 63, 65-67' : '61, 63, 65, 67';
      }

      return '106, 108';
    case '407':
      return klasse === 1 ? '13, 15' : '11, 13, 15, 17';
    case '411':
      return klasse === 1 ? '21, 22' : '15-18';
    case '412':
      if (klasse === 1)
        return wagenordnungsnummer === '10' ? '12, 13' : '11, 14, 21';

      return wagenordnungsnummer === '1' ? '11-24' : '41, 45, 46';
    case '415':
      return klasse === 1 ? '21' : '15, 17';
  }
};

function enrichFahrzeug(fahrzeug: Fahrzeug, gruppe: Fahrzeuggruppe) {
  const data: AdditionalFahrzeugInfo = {
    klasse: 0,
    icons: {},
  };

  switch (fahrzeug.kategorie) {
    case 'DOPPELSTOCKSTEUERWAGENZWEITEKLASSE':
    case 'DOPPELSTOCKWAGENZWEITEKLASSE':
    case 'REISEZUGWAGENZWEITEKLASSE':
    case 'STEUERWAGENZWEITEKLASSE':
      data.klasse = 2;
      break;
    case 'HALBSPEISEWAGENZWEITEKLASSE':
    case 'SPEISEWAGEN':
      data.klasse = 2;
      data.icons.dining = true;
      break;
    default:
      break;
    case 'DOPPELSTOCKWAGENERSTEZWEITEKLASSE':
    case 'DOPPELSTOCKSTEUERWAGENERSTEZWEITEKLASSE':
    case 'STEUERWAGENERSTEZWEITEKLASSE':
    case 'REISEZUGWAGENERSTEZWEITEKLASSE':
      data.klasse = 3;
      break;
    case 'HALBSPEISEWAGENERSTEKLASSE':
      data.klasse = 1;
      data.icons.dining = true;
      break;
    case 'DOPPELSTOCKWAGENERSTEKLASSE':
    case 'REISEZUGWAGENERSTEKLASSE':
    case 'STEUERWAGENERSTEKLASSE':
      data.klasse = 1;
      break;
    case 'TRIEBKOPF':
    case 'LOK':
      data.klasse = 4;
  }

  fahrzeug.allFahrzeugausstattung.forEach(ausstattung => {
    switch (ausstattung.ausstattungsart) {
      case 'PLAETZEROLLSTUHL':
        data.icons.wheelchair = true;
        break;
      case 'PLAETZEFAHRRAD':
        data.icons.bike = true;
        break;
      case 'BISTRO':
        data.icons.dining = true;
        break;
      case 'RUHE':
        data.icons.quiet = true;
        break;
      case 'FAMILIE':
        data.icons.family = true;
        break;
      case 'PLAETZEBAHNCOMFORT':
        data.comfort = true;
        break;
      case 'PLAETZESCHWERBEH':
        data.icons.disabled = true;
        break;
      case 'INFO':
        data.icons.info = true;
        break;
      case 'ABTEILKLEINKIND':
        data.icons.toddler = true;
        break;
    }
  });

  if (gruppe.goesToFrance) {
    data.comfort = false;
    data.icons.disabled = false;
    data.icons.family = false;
  }

  const ap = getAP(fahrzeug.fahrzeugnummer);

  if (ap) {
    if (ap.online && isAfter(ap.trainTimestamp, subDays(new Date(), 1))) {
      data.icons.wifi = true;
    } else {
      data.icons.wifiOff = true;
    }

    if (gruppe.br && ap.trainBR.endsWith('RD')) {
      gruppe.br.redesign = true;
    }
  }

  if (gruppe.br) {
    if (data.comfort) {
      data.comfortSeats = getComfortSeats(gruppe.br, data.klasse === 1 ? 1 : 2);
    }
    if (data.icons.disabled) {
      data.disabledSeats = getDisabledSeats(
        gruppe.br,
        data.klasse === 1 ? 1 : 2,
        fahrzeug.wagenordnungsnummer
      );
    }
  }

  fahrzeug.additionalInfo = data;
}

// https://www.apps-bahn.de/wr/wagenreihung/1.0/6/201802021930
export async function wagenreihung(trainNumber: string, date: number) {
  const parsedDate = format(
    convertToTimeZone(new Date(date), { timeZone: 'Europe/Berlin' }),
    'yyyyMMddHHmm'
  );

  let info: Wagenreihung;

  try {
    info = (
      await axios.get(
        `https://www.apps-bahn.de/wr/wagenreihung/1.0/${trainNumber}/${parsedDate}`
      )
    ).data;
  } catch (e) {
    throw {
      response: {
        status: 404,
        statusText: 'Not Found',
        data: 404,
      },
    };
  }

  // @ts-ignore - We're enriching information now.
  const enrichedFormation: Formation = info.data.istformation;

  let startPercentage = 100;
  let endPercentage = 0;

  const reallyHasReihung = enrichedFormation.allFahrzeuggruppe.every(g =>
    g.allFahrzeug.every(f => {
      const start = Number.parseInt(f.positionamhalt.startprozent, 10);
      const end = Number.parseInt(f.positionamhalt.endeprozent, 10);

      if (!start && !end) return false;

      if (start < startPercentage) {
        startPercentage = start;
      }
      if (end > endPercentage) {
        endPercentage = end;
      }

      return true;
    })
  );

  if (!reallyHasReihung) {
    throw { status: 404 };
  }

  const isActuallyIC =
    enrichedFormation.zuggattung === 'ICE' &&
    enrichedFormation.allFahrzeuggruppe.some(
      g => g.allFahrzeug.length === 1 && g.allFahrzeug[0].fahrzeugtyp === 'E'
    );

  if (isActuallyIC) {
    enrichedFormation.reportedZuggattung = enrichedFormation.zuggattung;
    enrichedFormation.zuggattung = 'IC';
  }

  const fahrzeuge: Fahrzeug[] = [];

  enrichedFormation.differentDestination = false;
  enrichedFormation.differentZugnummer = false;
  enrichedFormation.allFahrzeuggruppe.forEach((g, index, gruppen) => {
    if (index > 0) {
      const previousGruppe = gruppen[index - 1];

      if (previousGruppe.verkehrlichezugnummer !== g.verkehrlichezugnummer) {
        enrichedFormation.differentZugnummer = true;
      }
      if (previousGruppe.zielbetriebsstellename !== g.zielbetriebsstellename) {
        enrichedFormation.differentDestination = true;
      }
    }
    if (['IC', 'EC', 'ICE', 'ECE'].includes(enrichedFormation.zuggattung)) {
      const gruppenFahrzeugTypes = g.allFahrzeug.map(f => f.fahrzeugtyp);

      g.br = specificBR(g.allFahrzeug, gruppenFahrzeugTypes, enrichedFormation);
      if (g.br) {
        g.br.country = getCountry(g.allFahrzeug, gruppenFahrzeugTypes);
        g.br.showBRInfo = Boolean(
          g.br.BR || !g.br.noPdf || (g.br.country && g.br.country !== 'DE')
        );
      }
    }

    // https://inside.bahn.de/entstehung-zugnummern/?dbkanal_006=L01_S01_D088_KTL0006_INSIDE-BAHN-2019_Zugnummern_LZ01
    const trainNumberAsNumber = Number.parseInt(g.verkehrlichezugnummer, 10);

    g.goesToFrance = trainNumberAsNumber >= 9550 && trainNumberAsNumber <= 9599;
    g.allFahrzeug.forEach(fahrzeug => {
      enrichFahrzeug(fahrzeug, g);
      fahrzeuge.push(fahrzeug);
    });

    const minFahrzeug = minBy(g.allFahrzeug, f =>
      Number.parseInt(f.positionamhalt.startprozent, 10)
    );
    const maxFahrzeug = maxBy(g.allFahrzeug, f =>
      Number.parseInt(f.positionamhalt.endeprozent, 10)
    );

    if (minFahrzeug) {
      g.startPercentage = Number.parseInt(
        minFahrzeug.positionamhalt.startprozent,
        10
      );
    }
    if (maxFahrzeug) {
      g.endPercentage = Number.parseInt(
        maxFahrzeug.positionamhalt.endeprozent,
        10
      );
    }
  });

  enrichedFormation.realFahrtrichtung = fahrtrichtung(fahrzeuge);

  enrichedFormation.scale = 100 / (endPercentage - startPercentage);
  enrichedFormation.startPercentage = startPercentage;
  enrichedFormation.endPercentage = endPercentage;

  return enrichedFormation;
}

// https://ws.favendo.de/wagon-order/rest/v1/si/1401
export async function wagenreihungStation(
  trainNumbers: string[],
  station: string
) {
  const info: WagenreihungStation = (
    await axios.post(
      `https://ws.favendo.de/wagon-order/rest/v1/si/${station}`,
      trainNumbers.map(trainNumber => ({
        trainNumber,
      }))
    )
  ).data;

  return info;
}

function wagenReihungSpecificMonitoring(id: string, departure: number) {
  return wagenreihung(id, departure);
}

export async function wagenReihungMonitoring() {
  const abfahrten = await getAbfahrten('8002549', false, {
    lookahead: 300,
  });
  const maybeDepartures = abfahrten.departures.filter(
    d => d.reihung && d.departure
  );

  let departure = maybeDepartures.shift();

  while (departure) {
    const departureTime =
      departure.departure && departure.departure.scheduledTime;

    if (!departureTime) {
      departure = maybeDepartures.shift();
    } else {
      try {
        // eslint-disable-next-line no-await-in-loop
        const wr = await wagenReihungSpecificMonitoring(
          departure.train.number,
          departureTime
        );

        if (wr) return wr;
        departure = maybeDepartures.shift();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(
          'Failed to get WR for Monitoring!',
          e,
          departure && departure.train
        );
        departure = maybeDepartures.shift();
      }
    }
  }
}
