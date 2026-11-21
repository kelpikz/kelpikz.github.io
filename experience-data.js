/* Experience: every word on the page, in one table.  Change it here; experience.js lays it out.

   The well is one painting (assets/well8k/, its tiles and manifest.js), and the years go down it, from the top:
     2025-26   2023-24   2022   2019-21 (NIT Trichy, with Delta Force in it)   then the water.
   "obj" ties a line or a block to a thing painted in the well (its rect is in the manifest's "hot"), so that the
   thing and its part of the card light up together, and the block's small picture is cut from the painting there:
   sidekick, rule-builder, joined, portfolio, pragyan, delta-force, nit-trichy.  A block's "parts" are smaller things
   told of inside it, each with a small picture of its own (Delta Force, the cranes, inside NIT Trichy).

   The camera stops once at each thing in "stops", in this order, after the whole well and before the water.  (The
   manifest's own stops win when it gives them; this list is for a manifest with one stop for each level.)

   "hover" are things in the painting that are not stops and not in the card: hover one (or tap it) and its words
   show by it.

   Marked "unconfirmed" or "waiting": not checked with Ajitha yet.  These show on the page as written. */
window.EXPERIENCE = {
  title: 'Experience',
  intro: 'Going down this well is going back in time. Optmyzr is up in the sun, and college is down by the water.',
  cue: 'Go down',

  // NOT CONFIRMED: how the years are grouped into levels was a first guess by the painter.
  unconfirmed: [
    'How the years are grouped into the levels.',
    'The year of the Optmyzr internal hackathon (the résumé gives none).',
    'Whether the Portfolio platform belongs on 2023-24 or on 2025-26.',
    'The water: what came before college.'
  ],

  stops: ['sidekick', 'rule-builder', 'portfolio', 'pragyan', 'nit-trichy'],

  levels: [
    {
      id: 'y2025', label: '2025–26', years: '2025–26',
      role: 'Software Engineer at Optmyzr', link: { text: 'Optmyzr', href: 'https://www.optmyzr.com/' },
      blocks: [
        {
          obj: 'sidekick', title: 'Sidekick', thing: 'the dovecote',
          lines: [
            'A production AI agent for PPC marketers. It answers by calling tools across more than ten of our internal services.',
            'I built the LLM router that picks one of ten specialised tools, and an eval suite that cut wrong tool calls.',
            'I brought answers down from about 3 minutes to under 90 seconds.'
          ]
        },
        {
          obj: 'rule-builder', title: 'AI Rule Builder', thing: 'the loom',
          lines: [
            'A multi-agent system that turns a plain-English request into a program for the Optmyzr rule engine DSL.',
            'It finds examples with Pinecone retrieval. A compile-and-repair loop gives the compiler errors back to the agent.',
            'I took accuracy from 35% to 82%, and the time from over 200 s to 45–60 s.'
          ]
        }
      ],
      // the résumé gives no year for this one, so it has no flood mark
      also: [{ text: 'I also won the Optmyzr internal hackathon.', unconfirmed: 'year not known' }]
    },
    {
      id: 'y2023', label: '2023–24', years: '2023–24',
      role: 'Software Engineer at Optmyzr', link: { text: 'Optmyzr', href: 'https://www.optmyzr.com/' },
      miles: [
        { obj: 'joined', kind: 'sindoor', text: 'June 2023: I joined Optmyzr.' },
        { kind: 'plain', text: '2023: I finished my B.Tech at NIT Trichy.' }
      ],
      blocks: [
        {
          obj: 'portfolio', title: 'Portfolio Management Platform', thing: 'six spouts into one tank',
          lines: [
            'It pulls live data from six ad networks into one place: Google Ads, Microsoft Ads, Amazon DSP, Facebook Ads, LinkedIn and Yahoo Gemini.',
            'It covers more than 1,000 portfolios, 3,000 accounts and $2B in ad spend.',
            'It has a GraphQL API and a React dashboard over MongoDB and DuckDB, and a RAG support bot over more than 10,000 documents.'
          ],
          // the résumé says it was a main revenue driver from Q4 2024 to Q2 2025: it may belong on the level above
          unconfirmed: 'level'
        }
      ]
    },
    {
      id: 'y2022', label: '2022', years: '2022',
      role: 'Head of Web Ops at Pragyan, 2022–23',
      blocks: [
        {
          obj: 'pragyan', title: 'Pragyan', thing: 'the lanterns',
          lines: [
            'Pragyan is the tech fest of NIT Trichy, certified to ISO 20121.',
            'As Head of Web Ops I led a team of 60 for a fest with more than 40,000 visitors.'
          ],
          links: [{ text: 'Pragyan', href: 'https://www.pragyan.org/' }]
        }
      ]
    },
    {
      // (on the gauge this level runs from 2019 up to 2021, so its label says so; Delta Force, from 2020, is told in it)
      id: 'y2019', label: '2019–21', years: '2019–21',
      role: 'Student at NIT Trichy',
      miles: [
        { obj: 'nit-trichy', kind: 'soft', text: '2019: I started a B.Tech at NIT Trichy.' }
      ],
      blocks: [
        {
          obj: 'nit-trichy', title: 'NIT Trichy', thing: 'the lotus kund',
          lines: ['I studied for a B.Tech at NIT Trichy from 2019 to 2023.'],
          parts: [
            {
              obj: 'delta-force', title: 'Delta Force', thing: 'the cranes',
              text: 'In September 2020 I joined Delta Force, the coding club of NIT Trichy, and built the web platforms the college runs on, used by more than 10,000 students.',
              links: [{ text: 'Dalal Street, a stock market game', href: 'projects.html#dalal-street' }]
            }
          ],
          links: [{ text: 'NIT Trichy', href: 'https://www.nitt.edu/' }]
        }
      ]
    }
  ],

  // things to hover, not stops: by the thing's id in the manifest's "hot", and the year it belongs to
  hover: [
    { obj: 'hackathons', year: 'y2022', text: '2022: won the Shaastra Web Crawler Hackathon at IIT Madras and the Tri-NIT Hackathon' }
  ],

  // WAITING FOR AJITHA: the water stands for the years before college.
  water: {
    id: 'before', label: 'Before', years: 'Before', role: 'Where it started',
    lines: ['Under the water are the years before college. This part is still to be written.'],
    waiting: true
  },

  // the words on the blank plaques by the flood marks (two short lines each), by milestone id in assets/well.js
  plaques: {
    'joined-optmyzr': ['June 2023', 'Joined Optmyzr'],
    'nit-trichy': ['2019', 'NIT Trichy']
  },

  // what the painting shows, for people who cannot see it
  alt: {
    hero: 'The whole stepwell from its rim, in pastel in the manner of Mewar painting: a white chhatri and a long wall of arches at the top, then five levels of crossing stairs going down from noon gold to night blue, a lit lamp in an alcove on each level, and one lamp floating on the dark water at the bottom.',
    frames: [
      'The rim of the stepwell at noon: hills of trees, a long ochre wall of arches and jali windows, and a white domed chhatri.',
      'The top level, in the noon sun: flights of steps crossing in V shapes, painted panels, a white dovecote on a post, a lamp alcove and a loom with a red pattern begun.',
      'The second level, in the afternoon: a toran of leaves over the lamp alcove, and six spouts pouring into one stone tank.',
      'The middle level, at dusk: strings of bunting, paper lanterns and marigolds, and two small gold cups by the alcove.',
      'A level in the evening, the stone stained and mossy: a drum and a pole with a red pennant, and white cranes flying in a V.',
      'The lowest level, at night, wet and green with moss: a lamp alcove and a small stepped kund with a lotus.',
      'The dark green water at the bottom of the well, with lily pads, a few fish and a lamp floating on it.'
    ]
  }
};
