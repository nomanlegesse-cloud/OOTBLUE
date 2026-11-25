export type CountryId = 'ootblue' | 'japan' | 'france' | 'egypt' | 'brazil';

export interface CountryDestination {
  id: CountryId;
  name: string;
  city: string;
  airportName: string;
  airportCode: string;
  gate: string;
  flightDuration: string;
  distanceKm: number;
  localTempC: number;
  weatherCondition: string;
  currency: string;
  landmarkName: string;
  tagline: string;
  highlights: string[];
  flagLabel: string;
  accentHex: string;
  badgeClass: string;
  palette: {
    skyColor: number;
    fogColor: number;
    groundColor: number;
    waterColor: number;
    hillColor: number;
    accentColor: number;
    houseWalls: number[];
    houseRoofs: number[];
    treeKind: 'pine' | 'sakura' | 'cypress' | 'palm';
    landmarkKind: 'ootblue_tower' | 'torii_pagoda' | 'eiffel' | 'pyramids' | 'sugarloaf';
  };
}

export const COUNTRIES: CountryDestination[] = [
  {
    id: 'ootblue',
    name: 'Ootblue Republic',
    city: 'Ootblue City & Bay',
    airportName: 'Ootblue International Airport',
    airportCode: 'OBL',
    gate: 'Gate A1',
    flightDuration: 'Home Hub',
    distanceKm: 0,
    localTempC: 24,
    weatherCondition: 'Sunny Breeze',
    currency: 'OBL Credit',
    landmarkName: 'OOTBLUE Tower & Lighthouse',
    tagline: 'Sky-blue coastal metropolis, harbor marina, and flagship tech plaza.',
    highlights: ['OOTBLUE Flagship Plaza', 'Coastal Marina & Boats', 'Sunset Cottages'],
    flagLabel: 'OBL',
    accentHex: '#38bdf8',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    palette: {
      skyColor: 0x9bd2f2,
      fogColor: 0x9bd2f2,
      groundColor: 0x558b57,
      waterColor: 0x0ea5e9,
      hillColor: 0x4b7f52,
      accentColor: 0x38bdf8,
      houseWalls: [0xe0f2fe, 0xfef3c7, 0xd1fae5, 0xffe4e6, 0xf1f5f9, 0xbae6fd],
      houseRoofs: [0x0284c7, 0xb45309, 0x047857, 0xbe123c, 0x334155, 0x0369a1],
      treeKind: 'pine',
      landmarkKind: 'ootblue_tower',
    },
  },
  {
    id: 'japan',
    name: 'Japan',
    city: 'Neo-Tokyo Harbor',
    airportName: 'Haneda Bay International',
    airportCode: 'HND',
    gate: 'Gate B4',
    flightDuration: '9h 40m',
    distanceKm: 8280,
    localTempC: 19,
    weatherCondition: 'Sakura Blossom Clear',
    currency: 'JPY (¥)',
    landmarkName: 'Mt. Fuji, Torii & Pagoda',
    tagline: 'Snow-capped Mt. Fuji horizon, blossoming sakura avenues, waterfront Torii, and 5-tier pagoda.',
    highlights: ['Mount Fuji Peak', 'Crimson Torii Gate', '5-Tier Pier Pagoda'],
    flagLabel: 'JPN',
    accentHex: '#f472b6',
    badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-400/40',
    palette: {
      skyColor: 0xfadadd,
      fogColor: 0xf7d6e0,
      groundColor: 0x4b775a,
      waterColor: 0x0284c7,
      hillColor: 0x3f6b56,
      accentColor: 0xf472b6,
      houseWalls: [0xf8fafc, 0xfef2f2, 0xf1f5f9, 0xfff1f2, 0xe2e8f0, 0xfdf2f8],
      houseRoofs: [0x1e293b, 0x9f1239, 0x334155, 0xbe123c, 0x0f172a, 0x881337],
      treeKind: 'sakura',
      landmarkKind: 'torii_pagoda',
    },
  },
  {
    id: 'france',
    name: 'France',
    city: 'Paris Seine & Riviera',
    airportName: 'Charles de Gaulle Port',
    airportCode: 'CDG',
    gate: 'Gate C2',
    flightDuration: '7h 15m',
    distanceKm: 5840,
    localTempC: 21,
    weatherCondition: 'Crisp Riviera Sun',
    currency: 'EUR (€)',
    landmarkName: 'Eiffel Tower & Arc de Triomphe',
    tagline: 'Sandstone boulevards, Arc de Triomphe promenade, and the soaring Eiffel Tower.',
    highlights: ['Eiffel Tower Lattice', 'Arc de Triomphe Arch', 'Riviera Townhouses'],
    flagLabel: 'FRA',
    accentHex: '#818cf8',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
    palette: {
      skyColor: 0xc7d2fe,
      fogColor: 0xc7d2fe,
      groundColor: 0x5d8c5a,
      waterColor: 0x0369a1,
      hillColor: 0x4d7c58,
      accentColor: 0x818cf8,
      houseWalls: [0xfef3c7, 0xf5f5f4, 0xfde68a, 0xe7e5e4, 0xfef9c3, 0xf3f4f6],
      houseRoofs: [0x334155, 0x1e293b, 0x475569, 0x1e1b4b, 0x3f3f46, 0x312e81],
      treeKind: 'cypress',
      landmarkKind: 'eiffel',
    },
  },
  {
    id: 'egypt',
    name: 'Egypt',
    city: 'Cairo Nile Oasis',
    airportName: 'Cairo Desert International',
    airportCode: 'CAI',
    gate: 'Gate D7',
    flightDuration: '10h 55m',
    distanceKm: 9320,
    localTempC: 33,
    weatherCondition: 'Golden Desert Sun',
    currency: 'EGP (£)',
    landmarkName: 'Pyramids of Giza & Great Sphinx',
    tagline: 'Sunlit desert sands, Great Sphinx, Luxor obelisk, and the Great Pyramids of Giza.',
    highlights: ['Great Pyramids of Giza', 'Reclining Great Sphinx', 'Golden Luxor Obelisk'],
    flagLabel: 'EGY',
    accentHex: '#f59e0b',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    palette: {
      skyColor: 0xfde68a,
      fogColor: 0xfcd34d,
      groundColor: 0xd9b372,
      waterColor: 0x0d9488,
      hillColor: 0xc89d54,
      accentColor: 0xf59e0b,
      houseWalls: [0xfef3c7, 0xfde68a, 0xf5deb3, 0xffedd5, 0xfef9c3, 0xf3e5ab],
      houseRoofs: [0xb45309, 0x92400e, 0xd97706, 0x78350f, 0xa16207, 0xb45309],
      treeKind: 'palm',
      landmarkKind: 'pyramids',
    },
  },
  {
    id: 'brazil',
    name: 'Brazil',
    city: 'Rio Copacabana Bay',
    airportName: 'Galeão Coastal Hub',
    airportCode: 'GIG',
    gate: 'Gate E3',
    flightDuration: '8h 50m',
    distanceKm: 7740,
    localTempC: 29,
    weatherCondition: 'Tropical Trade Winds',
    currency: 'BRL (R$)',
    landmarkName: 'Christ the Redeemer & Sugarloaf',
    tagline: 'Turquoise Atlantic bays, Christ the Redeemer atop Corcovado, and Sugarloaf Peak.',
    highlights: ['Christ the Redeemer', 'Sugarloaf Granite Peak', 'Carnival Coast'],
    flagLabel: 'BRA',
    accentHex: '#10b981',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    palette: {
      skyColor: 0x7dd3fc,
      fogColor: 0x99e2ff,
      groundColor: 0x3b8c52,
      waterColor: 0x06b6d4,
      hillColor: 0x276749,
      accentColor: 0x10b981,
      houseWalls: [0xfef08a, 0xa7f3d0, 0xbae6fd, 0xfecdd3, 0xfed7aa, 0xe9d5ff],
      houseRoofs: [0x059669, 0xea580c, 0x0284c7, 0xd97706, 0x0d9488, 0x7c3aed],
      treeKind: 'palm',
      landmarkKind: 'sugarloaf',
    },
  },
];

export const COUNTRY_MAP: Record<CountryId, CountryDestination> = COUNTRIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<CountryId, CountryDestination>,
);
