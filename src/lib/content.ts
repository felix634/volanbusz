// TAGOK ADATAI
export const members = [
  { name: 'Árpi', imgNormal: '/arpi.jpg', imgFunny: '/arpi_funny.jpg', desc: 'A sofőrök réme.' },
  { name: 'Félix', imgNormal: '/felix.jpg', imgFunny: '/felix_funny.jpg', desc: 'Csak egy megállót akartam...' },
  { name: 'Zalán', imgNormal: '/zalan.jpg', imgFunny: '/zalan_funny.jpg', desc: 'Mikor indulunk már?' },
  { name: 'Bence', imgNormal: '/bence.jpg', imgFunny: '/bence_funny.jpg', desc: 'Bérletet felmutatni!' },
  { name: 'Dani', imgNormal: '/dani.jpg', imgFunny: '/dani_funny.jpg', desc: 'Az igazi kalauz.' },
  { name: 'Boti', imgNormal: '/boti.jpg', imgFunny: '/boti_funny.jpg', desc: 'A hátsó ülés császára.' },
];

export type MissionStatus = 'Failed' | 'Success';

// MISSION IMPOSSIBLE ADATOK
export const missions: { title: string; status: MissionStatus; img: string }[] = [
  { title: 'Snüsszről leszokás', status: 'Failed', img: '/snussz.jpg' },
  { title: 'Ivás mértékkel', status: 'Failed', img: '/ivas.jpg' },
  { title: 'Államtitkárhelyettest nem megsérteni', status: 'Failed', img: '/allamtitkar.jpg' },
  { title: 'Szobába visszajutni', status: 'Failed', img: '/szoba.jpg' },
  { title: 'Józannak tűnni', status: 'Failed', img: '/arc.jpg' },
  { title: 'Varsóba eljutni', status: 'Failed', img: '/varso.png' },
  { title: 'Danit berizzelni', status: 'Success', img: '/rizz.jpg' },
];

// Megállók a futószalaghoz (az 1-es járat vonala a szimulátorból)
export const stops = [
  'Telephely',
  'Petőfi utca',
  'Kossuth tér',
  'Városi Kórház',
  'Gimnázium',
  'Ipari Park',
  'Nagyállomás',
  'Végállomás',
];

// Az oldal szakaszai = a járat megállói (a felső útvonal-csíkhoz)
export const sections = [
  { id: 'telephely', label: 'Telephely' },
  { id: 'csapatkep', label: 'Csapat' },
  { id: 'csapat', label: 'Munkatársak' },
  { id: 'missions', label: 'Küldetések' },
  { id: 'vegallomas', label: 'Végállomás' },
];
