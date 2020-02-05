/*
 ** Initially this file is copied from https://github.com/derf/Travel-Status-DE-IRIS
 ** Thanks for finding these!
 */
export default {
  '2': 'Polizeiliche Ermittlung',
  '3': 'Feuerwehreinsatz neben der Strecke',
  '4': 'Kurzfristiger Personalausfall',
  '5': 'Ärztliche Versorgung eines Fahrgastes',
  '6': 'Betätigen der Notbremse',
  '7': 'Personen im Gleis',
  '8': 'Notarzteinsatz am Gleis',
  '9': 'Streikauswirkungen',
  '10': 'Ausgebrochene Tiere im Gleis',
  '11': 'Unwetter',
  '12': 'Warten auf ein verspätetes Schiff',
  '13': 'Pass- und Zollkontrolle',
  '14': 'Technische Störung am Bahnhof',
  '15': 'Beeinträchtigung durch Vandalismus',
  '16': 'Entschärfung einer Fliegerbombe',
  '17': 'Beschädigung einer Brücke',
  '18': 'Umgestürzter Baum im Gleis',
  '19': 'Unfall an einem Bahnübergang',
  '20': 'Tiere im Gleis',
  '21': 'Warten auf weitere Reisende',
  '22': 'Witterungsbedingte Störung',
  '23': 'Feuerwehreinsatz auf Bahngelände',
  '24': 'Verspätung aus dem Ausland',
  '25': 'Warten auf verspätete Zugteile',
  '28': 'Gegenstände im Gleis',
  '29': 'Ersatzverkehr mit Bus ist eingerichtet',
  '31': 'Bauarbeiten',
  '32': 'Verzögerung beim Ein-/Ausstieg',
  '33': 'Oberleitungsstörung',
  '34': 'Signalstörung',
  '35': 'Streckensperrung',
  '36': 'Technische Störung am Zug',
  '37': 'Technische Störung am Wagen',
  '38': 'Technische Störung an der Strecke',
  '39': 'Anhängen von zusätzlichen Wagen',
  '40': 'Stellwerksstörung/-ausfall',
  '41': 'Störung an einem Bahnübergang',
  '42': 'Außerplanmäßige Geschwindigkeitsbeschränkung',
  '43': 'Verspätung eines vorausfahrenden Zuges',
  '44': 'Warten auf einen entgegenkommenden Zug',
  '45': 'Überholung durch anderen Zug',
  '46': 'Warten auf freie Einfahrt',
  '47': 'Verspätete Bereitstellung',
  '48': 'Verspätung aus vorheriger Fahrt',
  '55': 'Technische Störung an einem anderen Zug',
  '56': 'Warten auf Fahrgäste aus einem Bus',
  '57': 'Zusätzlicher Halt',
  '58': 'Umleitung',
  '59': 'Schnee und Eis',
  '60': 'Reduzierte Geschwindigkeit wegen Sturm',
  '61': 'Türstörung',
  '62': 'Behobene technische Störung am Zug',
  '63': 'Technische Untersuchung am Zug',
  '64': 'Weichenstörung',
  '65': 'Erdrutsch',
  '66': 'Hochwasser',
  '70': 'Kein WLAN',
  '71': 'WLAN in einzelnen Wagen nicht verfügbar',
  '72': 'Info-/Entertainment nicht verfügbar',
  '73': 'Mehrzweckabteil vorne',
  '74': 'Mehrzweckabteil hinten',
  '75': '1. Klasse vorne',
  '76': '1. Klasse hinten',
  '77': 'Ohne 1. Klasse',
  '79': 'Ohne Mehrzweckabteil',
  '80': 'Abweichende Wagenreihung',
  '82': 'Mehrere Wagen fehlen',
  '83': 'Störung fahrzeuggebundene Einstiegshilfe',
  '84': 'Zug verkehrt richtig gereiht', // r 80 82 83 85,
  '85': 'Ein Wagen fehlt',
  '86': 'Keine Reservierungsanzeige',
  '87': 'Einzelne Wagen ohne Reservierungsanzeige',
  '88': 'Keine Qualitätsmängel', // r 80 82 83 85 86 87 90 91 92 93 96 97 98,
  '89': 'Reservierungen sind wieder vorhanden',
  '90': 'Kein Bordrestaurant/Bordbistro',
  '91': 'Fehlende Fahrradbeförderung',
  '92': 'Eingeschränkte Fahrradbeförderung',
  '93': 'Fehlende oder gestörte behindertengerechte Einrichtung',
  '94': 'Ersatzbewirtschaftung',
  '95': 'Ohne behindertengerechtes WC',
  '96': 'Der Zug ist stark überbesetzt', // r 97,
  '97': 'Der Zug ist überbesetzt', // r 96,
  '98': 'Sonstige Qualitätsmängel',
  '99': 'Verzögerungen im Betriebsablauf',
  '900': 'Anschlussbus wartet(?)',
  // Generic Message - real message is freitext
  '1000': 'Kundentext',
};

export const messageTypeLookup = {
  d: 'delay',
  // f: 'freeText',
  f: 'qos',
  q: 'qos',
  h: 'him', // 'HIM (Hafas Information Manager)',
  i: 'IBIS (Generated IRIS-AP)',
  u: 'IBIS (Generated IRIS-AP, not yet assigned to train)',
  r: 'disruption',
  c: 'connection',
};

export const supersededMessages = {
  '84': [80, 82, 85],
  '88': [83, 90, 91, 92, 93, 94, 96, 97, 98],
  '89': [86, 87],
  '96': [97],
  '97': [96],
};
