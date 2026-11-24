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

   Use ** to bold short phrases in card paragraphs.
   Marked "unconfirmed" or "waiting": not checked with Ajitha yet.  These show on the page as written. */
window.EXPERIENCE = {
  title: 'Experience',
  intro: 'Go down the stepwell to see what I built, from Optmyzr back to my time at NIT Trichy.',
  cue: 'Go down',

  // NOT CONFIRMED: how the years are grouped into levels was a first guess by the painter.
  unconfirmed: [
    'How the years are grouped into the levels.',
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
            'I helped take Sidekick **from zero to one**. We launched an AI assistant that helps PPC marketers analyze and optimize campaigns by calling tools across more than 10 internal services.',
            'I built the router that selects from **10 specialized tools**, added access controls for tool calls, and built an **eval suite** that reduced incorrect tool calls.',
            'I built a tool for product and engineering teams to inspect agent traces, replay conversations, time tool calls, and turn failures into new eval cases. That work **improved accuracy by 26%** and reduced hallucinations.',
            'I built a model router that **cut costs by 18%** and added a custom memory layer for each user.'
          ],
          links: [{ text: 'Sidekick user guide', href: 'https://help.optmyzr.com/en/articles/12505157-optmyzr-sidekick-about-user-guide' }]
        },
        {
          obj: 'rule-builder', title: 'AI Rule Builder', thing: 'the loom',
          lines: [
            'I built a system that turns **plain-English requests into ad optimization rules**. It gives advertisers a plan to edit before compiling it into the language used by the Optmyzr Rule Engine.',
            'I used Pinecone to find relevant examples. I also built a **DSL validator** that checks the code the agent generates and returns errors in a format the agent can use to fix its output.',
            'I raised accuracy from **35% to 82%** and cut generation time from **over 200 seconds to 45–60 seconds** by reducing the number of agents from three to two and refining their prompts. I tracked quality across releases with evals scored by an LLM.'
          ],
          links: [{ text: 'Rule Engine user guide', href: 'https://help.optmyzr.com/en/articles/3076017-what-is-the-rule-engine' }]
        }
      ]
    },
    {
      id: 'y2023', label: '2023–24', years: '2023–24',
      role: 'Software Engineer at Optmyzr', link: { text: 'Optmyzr', href: 'https://www.optmyzr.com/' },
      miles: [
        { obj: 'joined', kind: 'sindoor', text: 'I joined Optmyzr in June 2023.' },
        { kind: 'plain', text: 'I graduated from NIT Trichy in 2023.' }
      ],
      blocks: [
        {
          obj: 'portfolio', title: 'Portfolio Management Platform', thing: 'six spouts into one tank',
          lines: [
            'I designed the platform and built the pipeline that brings live data from **six ad networks** into one dashboard: Google Ads, Microsoft Ads, Amazon DSP, Facebook Ads, LinkedIn and Yahoo Gemini.',
            'The platform covered **1,000+ portfolios, 3,000+ accounts and $2B+ in ad spend** and was a primary revenue driver from Q4 2024 to Q2 2025.',
            'I built the GraphQL API and React dashboard on MongoDB and DuckDB, so users could run interactive queries across **more than a million data points**.'
          ],
          links: [{ text: 'Optmyzr Portfolio View', href: 'https://help.optmyzr.com/en/articles/11313715-all-accounts-dashboard-portfolio-view' }],
          // the résumé says it was a main revenue driver from Q4 2024 to Q2 2025: it may belong on the level above
          unconfirmed: 'level'
        }
      ],
      also: [{
        text: 'Elsewhere at Optmyzr, I shipped a support bot backed by a knowledge base of more than 1,000 documents. I took part in the on-call rotation, handled multiple production incidents, and built custom solutions for enterprise clients.'
      }]
    },
    {
      id: 'y2022', label: '2022', years: '2022',
      role: 'Head of Web Ops at Pragyan, 2022–23',
      blocks: [
        {
          obj: 'pragyan', title: 'Pragyan', thing: 'the lanterns',
          lines: [
            'I led the **60-person web team** for Pragyan, the tech festival at NIT Trichy. The ISO 20121-certified festival drew **more than 40,000 visitors**.',
            'I built the **registration and accommodation booking system**, including the web interface attendees used to sign up and book a place to stay.'
          ],
          links: [{ text: 'Pragyan 2023 report', href: 'https://nitt.edu/home/students/clubsnassocs/techclubs/Technical%20Term%20Report%202022-2023.pdf' }]
        }
      ],
      also: [
        {
          text: 'In 2022, I won the Shaastra Web Crawler Hackathon at IIT Madras and the Tri-NIT Hackathon. See the Delta Force results.',
          link: { text: 'Delta Force results', href: 'https://www.nitt.edu/home/students/clubsnassocs/techclubs/delta/Delta%20Force%20Term%20Report%202022.pdf' }
        }
      ]
    },
    {
      // (on the gauge this level runs from 2019 up to 2021, so its label says so; Delta Force, from 2020, is told in it)
      id: 'y2019', label: '2019–21', years: '2019–21',
      role: 'Student at NIT Trichy',
      miles: [
        { obj: 'nit-trichy', kind: 'soft', text: 'I started my B.Tech in 2019.' }
      ],
      blocks: [
        {
          obj: 'nit-trichy', title: 'NIT Trichy', thing: 'the lotus kund',
          lines: ['I earned my **B.Tech at NIT Trichy** in 2023. While I was there, I built software for students with Delta Force.'],
          parts: [
            {
              obj: 'delta-force', title: 'Delta Force', thing: 'the cranes',
              text: 'I joined Delta Force, the campus programming club, as a full-stack developer in 2020. I built campus platforms used by **more than 10,000 students** and worked on the Go backend for Dalal Street, the stock market game at Pragyan.',
              links: [
                { text: 'Delta Force', href: 'https://delta.nitt.edu/' },
                { text: 'My Dalal Street work', href: 'projects.html#dalal-street' }
              ]
            }
          ],
          links: [{ text: 'NIT Trichy', href: 'https://www.nitt.edu/home/' }]
        }
      ]
    }
  ],

  // things to hover, not stops: by the thing's id in the manifest's "hot", and the year it belongs to
  hover: [
    { obj: 'hackathons', year: 'y2022', text: 'I won the Shaastra Web Crawler Hackathon at IIT Madras and the Tri-NIT Hackathon in 2022.' }
  ],

  // WAITING FOR AJITHA: the water stands for the years before college.
  water: {
    id: 'before', label: 'Before', years: 'Before', role: 'Before college',
    lines: ['My timeline starts in 2019, when I began my B.Tech at NIT Trichy.'],
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
