export type WorldCountryId = 'ootblue' | 'japan' | 'france' | 'egypt' | 'brazil';

export interface NpcAppearanceSpec {
  pantsColor?: number;
  skinColor?: number;
  shoeColor?: number;
  eyeColor?: number;
  hairStyle?: 'short' | 'swept' | 'bob' | 'cap';
  capColor?: number;
  hasBackpack?: boolean;
  hasJacket?: boolean;
  jacketColor?: number;
  hasBadge?: boolean;
}

export interface NpcQuickLine {
  label: string;
  reply: string;
  sendToPhone?: string;
}

export interface NpcCatalogItem {
  id: string;
  name: string;
  role: string;
  homeX: number;
  homeZ: number;
  patrolRadius: number;
  shirtColor: number;
  hairColor: number;
  appearance: NpcAppearanceSpec;
  greeting: string;
  personaPrompt: string;
  lines: NpcQuickLine[];
}

export interface CountryContextSummary {
  id: WorldCountryId;
  name: string;
  city: string;
  airportName: string;
  airportCode: string;
  landmarkName: string;
  weatherCondition: string;
}

export const COUNTRY_CONTEXT_SUMMARIES: Record<WorldCountryId, CountryContextSummary> = {
  ootblue: {
    id: 'ootblue',
    name: 'Ootblue Republic',
    city: 'Ootblue City & Bay',
    airportName: 'Ootblue International Airport',
    airportCode: 'OBL',
    landmarkName: 'OOTBLUE Tower & Lighthouse',
    weatherCondition: 'Sunny Breeze',
  },
  japan: {
    id: 'japan',
    name: 'Japan',
    city: 'Neo-Tokyo Harbor',
    airportName: 'Haneda Bay International',
    airportCode: 'HND',
    landmarkName: 'Mt. Fuji, Torii & Pagoda',
    weatherCondition: 'Sakura Blossom Clear',
  },
  france: {
    id: 'france',
    name: 'France',
    city: 'Paris Seine & Riviera',
    airportName: 'Charles de Gaulle Port',
    airportCode: 'CDG',
    landmarkName: 'Eiffel Tower & Arc de Triomphe',
    weatherCondition: 'Crisp Riviera Sun',
  },
  egypt: {
    id: 'egypt',
    name: 'Egypt',
    city: 'Cairo Nile Oasis',
    airportName: 'Cairo Desert International',
    airportCode: 'CAI',
    landmarkName: 'Pyramids of Giza & Great Sphinx',
    weatherCondition: 'Golden Desert Sun',
  },
  brazil: {
    id: 'brazil',
    name: 'Brazil',
    city: 'Rio Copacabana Bay',
    airportName: 'Galeão Coastal Hub',
    airportCode: 'GIG',
    landmarkName: 'Christ the Redeemer & Sugarloaf',
    weatherCondition: 'Tropical Trade Winds',
  },
};

export const WORLD_NPCS: NpcCatalogItem[] = [
  {
    id: 'maya',
    name: 'Maya',
    role: 'OOTBLUE Store Specialist',
    homeX: -12,
    homeZ: -10,
    patrolRadius: 2.2,
    shirtColor: 0x38bdf8,
    hairColor: 0x1e293b,
    appearance: {
      skinColor: 0xf1c29b,
      pantsColor: 0x1e293b,
      shoeColor: 0xf8fafc,
      hairStyle: 'bob',
      hasJacket: true,
      jacketColor: 0x0f172a,
      hasBadge: true,
    },
    greeting:
      'Welcome to the OOTBLUE Flagship Plaza! Have you inspected the OOTBLUE 1 yet? Look north to see the Downtown Skyline and OOTBLUE Tower.',
    personaPrompt:
      'You are Maya, an enthusiastic and helpful OOTBLUE Store Specialist stationed near the OOTBLUE Flagship Pavilion in the central plaza. You know all about the OOTBLUE 1 smartphone, its built-in apps, App Store games, and nearby attractions.',
    lines: [
      {
        label: 'Tell me about OOTBLUE 1',
        reply:
          'OOTBLUE 1 runs a full OS with 18 built-in apps, an App Store with 7 playable games, and real camera capture. Click Phone anytime to use yours!',
      },
      {
        label: 'Send welcome message to my phone',
        reply: 'Done! Check Messages on your OOTBLUE 1.',
        sendToPhone:
          'Hey! Welcome to Ootblue City — hop into the Sky Roadster near the pavilion or cruise the bay by boat!',
      },
    ],
  },
  {
    id: 'leo',
    name: 'Leo',
    role: 'Coastal Photographer',
    homeX: 2.5,
    homeZ: 23,
    patrolRadius: 2.2,
    shirtColor: 0xf59e0b,
    hairColor: 0x451a03,
    appearance: {
      skinColor: 0xd99b72,
      pantsColor: 0x3f2e21,
      shoeColor: 0x1e293b,
      hairStyle: 'cap',
      capColor: 0xb45309,
      hasBackpack: true,
    },
    greeting:
      'The sailboats and harbor yachts look incredible out on the bay today! Walk down the marina slip to board our OOTBLUE Speedboat.',
    personaPrompt:
      'You are Leo, an adventurous coastal photographer patrolling the promenade near the wooden pier and marina. You love framing shots of sailboats, yachts, coastal boulders, lighthouses, and national landmarks, and sharing photo tips.',
    lines: [
      {
        label: 'Where are the tokens?',
        reply:
          'I spotted sky-blue OOTBLUE tokens near the Pier, the Fountain, the Café terrace, Downtown Avenue, and the West Neighborhood houses.',
      },
      {
        label: 'Send photo tip to my phone',
        reply: 'Sent a note to your Messages!',
        sendToPhone: 'Photography tip: Open Camera on your OOTBLUE 1 to capture live photos & video clips!',
      },
    ],
  },
  {
    id: 'kai',
    name: 'Kai',
    role: 'Arcade Champion',
    homeX: 16,
    homeZ: -8,
    patrolRadius: 2.0,
    shirtColor: 0x8b5cf6,
    hairColor: 0x0f172a,
    appearance: {
      skinColor: 0xe8b896,
      pantsColor: 0x0f172a,
      shoeColor: 0x7c3aed,
      hairStyle: 'swept',
      hasJacket: true,
      jacketColor: 0x312e81,
    },
    greeting:
      'Yo! Looking for speed? Hop in a parked car with F to race around the city ring road, or open App Store on your OOTBLUE 1 for Apex Velocity!',
    personaPrompt:
      'You are Kai, a high-energy Arcade Champion hanging out near the Neon Arcade Kiosk east of the central fountain. You love racing cars around the ring road, chasing high scores in Apex Velocity, Neon Serpent, 2048, and Grandmaster Chess.',
    lines: [
      {
        label: 'Which game is best?',
        reply:
          'Apex Velocity and Neon Serpent are super fast, and Grandmaster Chess has full legal moves with an AI bot.',
      },
      {
        label: 'Challenge me via text',
        reply: 'Sent! Beat my high score when you pull out your phone.',
        sendToPhone: 'Arcade Challenge: Download Neon Serpent or 2048 from the OOTBLUE 1 App Store!',
      },
    ],
  },
  {
    id: 'nora',
    name: 'Nora',
    role: 'Café Barista',
    homeX: -15,
    homeZ: 10,
    patrolRadius: 1.8,
    shirtColor: 0x10b981,
    hairColor: 0x7c2d12,
    appearance: {
      skinColor: 0xf4ccb0,
      pantsColor: 0x1e293b,
      shoeColor: 0x451a03,
      hairStyle: 'bob',
    },
    greeting:
      'Fresh espresso and matcha at the Terrace Café! Just across West Boulevard you can visit the colorful coastal houses.',
    personaPrompt:
      'You are Nora, a warm, welcoming Café Barista running the outdoor Terrace Café on the southwest plaza. You love talking about espresso, matcha, local neighborhood vibes, and watching the dynamic weather roll over the bay.',
    lines: [
      {
        label: 'How is the weather?',
        reply:
          'Check the sky! Use the Weather selector in the top-left HUD anytime to switch between clear sun, rain, thunderstorms, or snowfall.',
      },
      {
        label: 'Send café menu to my phone',
        reply: 'Sent our daily specials straight to your OOTBLUE 1.',
        sendToPhone: 'Terrace Café Specials: Iced Cortado · Matcha Cloud · Berry Croissant.',
      },
    ],
  },
  {
    id: 'sora',
    name: 'Dr. Sora',
    role: 'City & Harbor Architect',
    homeX: 14,
    homeZ: 10,
    patrolRadius: 2.4,
    shirtColor: 0xf43f5e,
    hairColor: 0x334155,
    appearance: {
      skinColor: 0xedc09c,
      pantsColor: 0x334155,
      shoeColor: 0x0f172a,
      hairStyle: 'swept',
      hasJacket: true,
      jacketColor: 0x475569,
    },
    greeting:
      'Notice how the Downtown skyscrapers north of the avenue, the West residential houses, and the marina pier all connect via the ring road?',
    personaPrompt:
      'You are Dr. Sora, an insightful urban and coastal architect who designed the city ring road, coastal seawall promenade, central tiered stone fountain, and international landmarks. Speak thoughtfully about design, skyline geometry, and city navigation.',
    lines: [
      {
        label: 'What can I explore?',
        reply:
          'Drive the Sky Roadster or Trail SUV around the city blocks, visit the neighborhood houses, or pilot the speedboat out past the lighthouse!',
      },
    ],
  },
  {
    id: 'finn',
    name: 'Captain Finn',
    role: 'Harbor Master',
    homeX: 0,
    homeZ: 34,
    patrolRadius: 1.6,
    shirtColor: 0x0ea5e9,
    hairColor: 0xe2e8f0,
    appearance: {
      skinColor: 0xdca57d,
      pantsColor: 0x1e3a8a,
      shoeColor: 0x3b2314,
      hairStyle: 'cap',
      capColor: 0x0f172a,
      hasJacket: true,
      jacketColor: 0x0369a1,
      hasBadge: true,
    },
    greeting:
      'Ahoy! Our OOTBLUE Speedboat is moored right on the east marina slip behind you. Step onto the slip and press F to take the helm!',
    personaPrompt:
      'You are Captain Finn, a seasoned and friendly Harbor Master standing out on the wooden coastal pier. You use light maritime warmth without overdoing stereotypes, and guide visitors on piloting the speedboat (W/S throttle, A/D steer, F to board/dock) and navigating around sailboats and yachts.',
    lines: [
      {
        label: 'Any tips for boating?',
        reply:
          'Use W/S for throttle and reverse, and A/D to steer around the sailboats and harbor yachts. Press F to disembark back at the marina!',
      },
    ],
  },
  {
    id: 'elena',
    name: 'Elena',
    role: 'Neighborhood Resident',
    homeX: -43,
    homeZ: -10,
    patrolRadius: 2.0,
    shirtColor: 0xec4899,
    hairColor: 0x431407,
    appearance: {
      skinColor: 0xc6885c,
      pantsColor: 0x263142,
      shoeColor: 0xf1f5f9,
      hairStyle: 'bob',
    },
    greeting:
      'Welcome to Sunset Cottages! We love living right by the bay and downtown skyline. Feel free to borrow the Coastal SUV parked down the street.',
    personaPrompt:
      'You are Elena, a friendly local resident of Sunset Cottages in the west neighborhood. You welcome travelers to the quiet residential street, mention the Coastal SUV parked nearby, and remind players they can also visit their own walk-in house on the east side.',
    lines: [
      {
        label: 'Where can I drive?',
        reply:
          'Take West Boulevard north to check out the downtown skyscrapers, or cruise east down North Avenue straight to the International Airport!',
      },
    ],
  },
  {
    id: 'aria',
    name: 'Captain Aria',
    role: 'International Flight Desk',
    homeX: 80.5,
    homeZ: -25,
    patrolRadius: 1.4,
    shirtColor: 0xf8fafc,
    hairColor: 0x0f172a,
    appearance: {
      skinColor: 0xb97c52,
      pantsColor: 0x0f172a,
      shoeColor: 0x0f172a,
      hairStyle: 'bob',
      hasJacket: true,
      jacketColor: 0x1e3a8a,
      hasBadge: true,
    },
    greeting:
      'Welcome to the International Terminal! Buy a flight ticket in the Airport app on your OOTBLUE 1, then see Officer Kenji at Passport Control to board.',
    personaPrompt:
      'You are Captain Aria, a poised airline captain at the International Airport terminal desk. You help travelers understand flight routes between Ootblue Republic, Japan, France, Egypt, and Brazil, reminding them to purchase a boarding pass in the Airport app on their OOTBLUE 1 before clearing Passport Control.',
    lines: [
      {
        label: 'Which countries can I visit?',
        reply:
          'We operate non-stop flights between Ootblue Republic, Japan, France, Egypt, and Brazil. Each country has iconic national landmarks!',
      },
      {
        label: 'Send flight guide to my phone',
        reply: 'Sent! Open your Airport app anytime to book a flight ticket and check your Passport.',
        sendToPhone:
          'OOTBLUE Air Flight Desk: Open Airport App to get a ticket, then clear Passport Control with Officer Kenji!',
      },
    ],
  },
  {
    id: 'kenji',
    name: 'Officer Kenji',
    role: 'Passport & Ticket Control',
    homeX: 78.2,
    homeZ: -14.6,
    patrolRadius: 0.25,
    shirtColor: 0xe0f2fe,
    hairColor: 0x0f172a,
    appearance: {
      skinColor: 0xebc09a,
      pantsColor: 0x0f172a,
      shoeColor: 0x0f172a,
      hairStyle: 'cap',
      capColor: 0x1e3a8a,
      hasJacket: true,
      jacketColor: 0x1e3a8a,
      hasBadge: true,
    },
    greeting:
      'Passport Control checkpoint! I verify your OOTBLUE Passport and Phone flight ticket before boarding.',
    personaPrompt:
      'You are Officer Kenji, the courteous yet thorough Passport & Ticket Control officer at the airport boarding gate. Players always carry a valid OOTBLUE Citizen Passport, and must have an active flight ticket booked in the Airport app on their OOTBLUE 1 phone before boarding.',
    lines: [],
  },
];
