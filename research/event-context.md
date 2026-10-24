# OxHack 2026 event context

24 October 2026. Compiled by Ahmed from two sources: the official opening ceremony slide deck (90 slides, PDF) and a phone audio transcript of the ceremony plus the team's first brainstorm. It adds to [the Granola notes](opening-ceremony-notes.md) and corrects some of their transcription gaps. Where the slides and the audio disagree, the slides win.

## Deadlines and schedule

Times are UK local. Clocks go back overnight (01:00 GMT on Sunday 25 October), which gives the 25 hours of hacking.

| When | What | Where |
| --- | --- | --- |
| Sat 12:00 | Hacking begins | Open hacking spaces |
| Sat 15:00–16:00 | HRT talk, Matt Godbolt: "What 25 days of optimizations taught me about compilers" | L1 |
| Sat 17:30–18:00 | MLH workshop 1: Intro to Google AI Studio | C1 |
| Sat 19:00–19:30 | MLH workshop 2: Hacking with GitHub Copilot | C1 |
| Sat 20:30–21:00 | Hackathons UK mini event (cup stacking) | C1 |
| Sun 00:00–00:30 | HRT midnight pizza | Food collection point |
| Sun 09:00–10:00 | Devpost submission workshop | C1 |
| **Sun 12:00** | **Hacking finishes** | |
| Sun 13:00–15:45 | Judging | All hacking spaces |
| Sun 16:00–16:45 | Closing ceremony | L1 |

The slides do not give a separate Devpost submission deadline. Treat **Sunday 12:00 as the hard cutoff** for code and the Devpost entry until an organiser confirms otherwise. Organisers asked every team to submit on Devpost and to demo, whatever state the project is in.

## Theme

**TIME** is mandatory for every project. The main judge, Tom 7, said he will look for "the essence of the hack, the poetry in it", and that this feeds into both the top prize and the handmade prize.

## Prize tracks worth targeting

### HRT (platinum): best use of data for predictions and decision-making

- Open-ended. It does not have to involve financial markets.
- Prize: a £1,000 voucher per team member, plus lunch with HRT engineers in London.
- HRT has a dedicated room (L4) and will help with brainstorming.
- The skills they named: Python or C++, statistics, ML, and clean, well-extracted data. A demo that shows clean data handling and a measured prediction suits them.

### Zed: built with Delta

- At least two team members must work in Delta. Use it from ideation through building and testing, then share the Delta threads as evidence of collaboration. The Zed rep said they can see all conversations and code through the shared link.
- Judging weights from the slides:
  - Speed and performance, 30%: does it feel fast, is the UX snappy?
  - Technical implementation, 25%: clean code, smart architecture, good use of collaboration features.
  - Innovation, 25%: fresh idea, real problem, new angle.
  - Polish and usability, 20%: would you actually use it?
- "Not a demo. Something you'd actually open tomorrow."
- Setup: download from https://delta.dev/download. Tokens come through OpenRouter (https://delta.dev/docs/agents/models-and-providers#add-an-api-key). Quickstart: https://delta.dev/docs/getting-started/quick-start.

### Best handmade project (Citadel)

- AI is not banned, but judges care how it was made. "Giving a good idea to Claude and saying yes" will not win. Visible human effort in code, UI or pitch will.
- This sits awkwardly with an agent-heavy workflow. Only target it if we can show substantial hand-built parts.

### MLH prizes (corrected names from the slides)

All at mlh.link/oxhack.

| Prize | Win | Possible fit |
| --- | --- | --- |
| Best use of Gemini API | MLH + DEV swag bags | LLM sentiment or extraction step |
| Best use of ElevenLabs | Beats Solo earbuds | Voice output |
| Best use of Tiger Data (scalable Postgres) | Stream Deck Mini | Time-series storage. Strong match for the TIME theme |
| Best use of Snowflake API | Arduino kits | Data warehouse |
| Best use of Solana | Assorted | Unlikely |
| Best use of Presage (camera biometrics) | Fitbit Inspire | Unlikely |
| Best use of Vultr (cloud) | Portable screens | Hosting the demo |
| DEV writing challenge | $100 | Write up the build on dev.to afterwards |

The Granola notes' "Tart data" and "Tiny data" are **Tiger Data**. "Dev voicing" is the **DEV writing challenge**.

### Hackathons UK: Hackiest Hack

For projects that went sideways. Prize: four IKEA plush sharks.

## Other sponsors present

Citadel and Entangl (gold), Jane Street, Oxford Asset Management and Zed (silver), Talos (bronze). Partners: MLH, Hackathons UK, GitHub Education. Only HRT, Zed/Delta, Citadel (handmade), MLH and Hackathons UK announced challenges.

## Venue

| Room | Use |
| --- | --- |
| L1 | Ceremonies and talks |
| C1 | Workshops and mini events |
| C2, C3, L6, café area | Hacking |
| L4 | HRT room |
| L5 | Quiet hacking |
| C4, C5 | Sleeping and resting only |

No food in rooms. Don't use the AV systems. The fire assembly point is by Core 1 and Core 2, following the organisers in OxHack fleeces. Codes of conduct: MLH and Hackathons UK. MLH incident line: incidents@mlh.io, +44 800 808 5675.

## Team brainstorm so far (from the audio)

These are leanings, not decisions.

- **Core idea:** find an unconventional, untouched dataset first, then match it to a traded commodity or market where it might give an edge. Examples raised: social media sentiment, in-app purchases, game skin sales (CS skins was judged too well-known). Swarm or agent-based simulation of a population, such as MiroFish, came up as a modelling option.
- **Framing:** it could be gamified or playful, but there must be a real, demonstrable edge. "Monetisation is secondary to finding the edge."
- **Language and performance:** C++ or Rust was raised for latency. One teammate has OpenAI credits.
- **Zed and Delta:** one teammate likes Zed. Another was sceptical of Delta because nobody has used it yet. The Zed track's rubric is clear-cut, which makes it attractive.
- **Repo and harness:** one shared repo with skills hosted on GitHub and a progress log, as used at the IBM hackathon. This is now covered by the existing repo setup and the open team kit proposal (branch `ahmed/team-kit-proposal`).

## What this means for our choices

- The HRT and Delta tracks fit together. HRT rewards measured prediction and decision value. Delta rewards speed, clean architecture and a tool people would really use. A fast, time-series prediction app built collaboratively in Delta can target both.
- Tiger Data is a cheap extra MLH entry if we store timestamped observations in Postgres.
- Plan the build backwards from **Sunday 12:00**. Leave the last two hours for the Devpost entry, the demo and the Delta thread links.

## Open questions

- Is Sunday 12:00 also the Devpost deadline? Ask an organiser.
- Team size limit and repository rules (public repo, commit history) for judging.
- Does Delta's two-person requirement mean the main development happens in Delta, or just that it's used?
- Which two teammates onboard to Delta?
