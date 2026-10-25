# Gold swarm results

Generated 2026-10-25T03:28:52+00:00 by `swarm/score.py report`. Support is scored 0-10 by glm-5.3-flash with the pre-registered prompt (`swarm/judge_prompt.txt`).

## Checks

| Check | Result | Detail |
|---|---|---|
| Placebo | **fail** | placebo moves no group beyond its band: **fail**. government +0.61 (band 0.07); land_industry +1.06 (band 0.16); land_community +0.06 (band 0.42); funds +0.29 (band 0.29); retail -0.22 (band 1.00)<br>mine_approved: **pass**. funds +0.21 (expected up; band 0.29, placebo 0.29); government -0.03 (expected up; band 0.07, placebo 0.61); land_community -0.52 (expected down; band 0.42, placebo 0.06) qualifies<br>tax_rise: **not run**. run missing or not judged<br>protest: **not run**. run missing or not judged<br>court_blocks_mine: **fail**. funds +1.11 (expected down; band 0.29, placebo 0.29)<br>gold_back_to_4000: **not run**. run missing or not judged |
| Mirrors | **fail** | funds move opposite ways after mine approved and court blocks, both beyond the band: **fail**. mine_approved +0.21, court_blocks_mine +1.11, band 0.29<br>funds and retail fall beyond their bands when gold drops back: **not run**. needs run 09 and the three baselines judged |
| Stability | **pass** | price: **pass**. up / up / up<br>policy: **pass**. weeks / weeks / weeks<br>leaning: **pass**. split / split / split |
| Grounding | **fail** | 20 sampled answers: **fail**. 8 of 20 grounded (needs 14) |

## Effects

Effect: a group's mean daily support over days 3-5 minus the seed-1 baseline's. Chance band: max minus min of that mean across the three baselines. Timing: the first day (3-5) whose daily difference from the baseline exceeds the band. Groups are ranked by the size of their effect within each scenario.

| Run | Scenario | Group | Effect | Chance band | Beyond band | Expected | Timing |
|---|---|---|---|---|---|---|---|
| 04 | placebo | land_industry | +1.06 | 0.16 | yes | no move | day 3 |
| 04 | placebo | government | +0.61 | 0.07 | yes | no move | day 3 |
| 04 | placebo | funds | +0.29 | 0.29 | no | no move | day 3 |
| 04 | placebo | retail | -0.22 | 1.00 | no | no move | none |
| 04 | placebo | land_community | +0.06 | 0.42 | no | no move | day 3 |
| 05 | mine_approved | land_industry | +0.80 | 0.16 | yes |  | day 3 |
| 05 | mine_approved | retail | -0.58 | 1.00 | no |  | none |
| 05 | mine_approved | land_community | -0.52 | 0.42 | yes | down | day 4 |
| 05 | mine_approved | funds | +0.21 | 0.29 | no | up | day 4 |
| 05 | mine_approved | government | -0.03 | 0.07 | no | up | day 3 |
| 06 | court_blocks_mine | funds | +1.11 | 0.29 | yes | down | day 4 |
| 06 | court_blocks_mine | land_industry | +1.03 | 0.16 | yes |  | day 3 |
| 06 | court_blocks_mine | government | +0.49 | 0.07 | yes |  | day 3 |
| 06 | court_blocks_mine | retail | -0.40 | 1.00 | no |  | day 3 |
| 06 | court_blocks_mine | land_community | +0.19 | 0.42 | no |  | day 5 |
| 07 | tax_rise | all | not run | | | | |
| 08 | protest | all | not run | | | | |
| 09 | gold_back_to_4000 | all | not run | | | | |

## Calls

The most common interview answer: price from the funds, policy timing from government, leaning from the land side. Counts are answers (each agent answers once per platform).

| Run | Scenario | Seed | Price (funds) | Policy timing (government) | Leaning (land side) |
|---|---|---|---|---|---|
| 01_baseline_s1 | baseline | 1 | up (up 6, flat 3; of 9), median move 1.65% | weeks (weeks 8; of 8) | split (split 7; of 7) |
| 02_baseline_s2 | baseline | 2 | up (up 11, flat 7; of 18), median move 3.5% | weeks (weeks 14, days 2; of 16) | split (split 14; of 14) |
| 03_baseline_s3 | baseline | 3 | up (up 12, flat 6; of 18), median move 2.5% | weeks (weeks 11, days 5; of 16) | split (split 14; of 14) |
| 04_placebo_s1 | placebo | 1 | no majority (no valid answers; of 18) | no majority (no valid answers; of 16) | no majority (no valid answers; of 14) |
| 05_mine_approved_s1 | mine_approved | 1 | no majority (no valid answers; of 18) | no majority (no valid answers; of 16) | no majority (no valid answers; of 14) |
| 06_court_blocks_mine_s1 | court_blocks_mine | 1 | no majority (no valid answers; of 18) | weeks (weeks 8; of 16) | split (split 2; of 14) |

<details><summary>01_baseline_s1: what government expects the state to do next</summary>

- Margaret Halloran (twitter, weeks): The Alaska state government will continue reviewing DOT/DNR inspection data, haul schedules, and public testimony before taking any further position on gold mining and hauling near Tok.
- Douglas Renfrew (twitter, weeks): DNR will continue building the administrative record, reviewing filings, inspection information, haul-road impacts, public comments, and applicable law before making or clarifying any permit decision near Tok.
- Evelyn Marchetti (twitter, weeks): The Alaska state government will continue its technical review of the submitted reclamation and permit materials, then request additional information or issue a formal notice based on the administrative record rather than making a public commitment early.
- Raymond Takahashi (twitter, weeks): The Alaska state government will likely continue its permitting review and public process, with agencies checking land status, access, water, and other documented impacts before any decision.
- Curtis Lindqvist (twitter, weeks): The state will keep reviewing DOT, DNR, and haul-route documentation, keep the project in conditional status, and avoid a final public commitment until it has clearer safety and maintenance findings.
- Naomi Crane (twitter, weeks): The state will likely keep collecting documents and technical inputs on the Tok/Manh Choh haul plan before taking any policy or tax action.
- Gordon Strand (twitter, weeks): The Alaska state government will keep reviewing permit conditions, haul-route impacts, and inspection or maintenance records before taking any formal action.
- Alicia Mendoza (twitter, weeks): The Alaska state government will continue documenting comments and reviewing the water-related permit and monitoring record before making any project-specific decision on mining near Tok.

</details>

<details><summary>02_baseline_s2: what government expects the state to do next</summary>

- Margaret Halloran (reddit, days): The Alaska state government will coordinate DOT&PF and DNR to make haul schedules, reporting contacts, permit/inspection materials, road safety information, and water-monitoring details easier for Tok-area residents to review.
- Douglas Renfrew (reddit, days): Alaska will likely direct agencies to make current DNR/DOT contacts, monitoring information, haul-related records, and reporting channels easier for Tok-area residents to find while reminding everyone that a price move is not a permit change.
- Evelyn Marchetti (reddit, weeks): The Alaska state government will keep the current review process moving, ask for any needed technical clarification through formal channels, and avoid any decision until the record, permits, and monitoring information are complete.
- Raymond Takahashi (reddit, weeks): The Alaska state government will keep the issue in the permitting and public-process lane, asking for the source, contract, and timestamp behind the price move and keeping hauling, monitoring, and permit details in writing before any operational change is treated as real.
- Curtis Lindqvist (reddit, weeks): The Alaska state government will likely keep the matter in review, ask for the exact market source and updated haul/monitoring details, and press for a written hauling schedule and road-safety plan before any change in activity.
- Naomi Crane (reddit, weeks): The state will keep asking for verified market data and likely publish or request a clearer hauling and monitoring plan before any operational ramp is treated as real policy.
- Gordon Strand (reddit, weeks): The state will likely keep the current haul and monitoring framework in place while asking for the market source, confirmed haul schedules, and any updated road and water-monitoring plans before making any operational changes.
- Alicia Mendoza (reddit, weeks): The state will likely keep the review process open, ask for the source and exact timestamp behind the price claim, and wait for documented haul, road, and water-monitoring details before saying anything about changing operations near Tok.
- Margaret Halloran (twitter, weeks): The Alaska state government will likely coordinate DOT&PF, DEC, DNR, the school district, local officials, and operators for a public meeting focused on haul-route safety, school-bus timing, road maintenance, water monitoring, and enforceable mitigation near Tok.
- Douglas Renfrew (twitter, weeks): DNR will continue reviewing Redpoll Ridge through the public record, including haul-route impacts, maintenance responsibilities, reclamation bonding, and enforceable permit conditions before any final decision.
- Evelyn Marchetti (twitter, weeks): The state will keep the Redpoll Ridge and related Tok-area mining issues in formal technical review, gathering comments and inspection documentation before making any permitting recommendation.
- Raymond Takahashi (twitter, weeks): The Alaska state government will continue permitting review and coordination, likely asking for additional documentation and public input before any final decision on mining near Tok.
- Curtis Lindqvist (twitter, weeks): The Alaska state government will likely keep reviewing the permitting record, inspection findings, and public testimony before making any conditional decision on mining near Tok.
- Naomi Crane (twitter, weeks): The state will likely keep the current process moving with technical review and public comment rather than announce any immediate policy change on gold mining near Tok.
- Gordon Strand (twitter, weeks): The state will likely keep reviewing haul-road, permitting, and reclamation-bond details while asking for more inspection and maintenance data before making any new enforcement or permit changes.
- Alicia Mendoza (twitter, weeks): The Alaska state government will likely continue its formal review and request or publish additional permit, inspection, or monitoring documentation before making any decision on Tok-area mining questions.

</details>

<details><summary>03_baseline_s3: what government expects the state to do next</summary>

- Margaret Halloran (reddit, days): Alaska will have DOT&PF and DNR identify the proper contacts for the Tok briefing and clarify expectations for written haul schedules, school-district coordination, road-safety measures, dust, creek crossings, pavement wear, and complaint follow-up before any material change in haul activity.
- Douglas Renfrew (reddit, days): The state will verify whether there is any actual operational change, coordinate DNR and DOT&PF contacts for the Tok briefing request, and ask that any haul-schedule, road-safety, dust, creek-crossing, and complaint-response commitments be put in writing.
- Evelyn Marchetti (reddit, weeks): The state will continue the technical review process, request any needed additional information from the applicant, and keep public comments in the administrative record before making any decision.
- Raymond Takahashi (reddit, days): The Alaska state government will likely wait for a verified exchange quote and then keep the focus on haul schedules, permits, road safety, and community notice before treating any higher gold price as an operating change.
- Curtis Lindqvist (reddit, weeks): The Alaska state government will keep it procedural for now: verify the tape, demand written haul schedules and a named local contact, and push any decision through the briefing and official notice process before changing operations near Tok.
- Naomi Crane (reddit, days): The state will likely keep asking for verified market quotes and written haul-schedule/mitigation plans before any operational or policy response, and will treat the price chatter as unverified until the record is confirmed.
- Gordon Strand (reddit, days): The Alaska state government will ask for a verified exchange quote and then push for written haul schedules, named contacts, and documented road-safety and community-notice commitments before any operational change near Tok.
- Alicia Mendoza (reddit, weeks): The state will likely ask for a verified exchange source and then continue with written review and community notice expectations before any operational changes are treated as real.
- Margaret Halloran (twitter, weeks): The Alaska state government will continue agency review of transportation safety data, community testimony, fiscal impacts, and enforceable mitigation conditions for gold mining and ore hauling near Tok.
- Douglas Renfrew (twitter, weeks): DNR will continue reviewing the Tok-area mining record, including public comments, inspection information, reclamation obligations, and any transportation or land-use concerns before making a decision.
- Evelyn Marchetti (twitter, weeks): The Alaska state government will continue the formal review and public-record process for the relevant mining matter, asking for additional factual input if needed before making any determination.
- Raymond Takahashi (twitter, weeks): The Alaska state government will likely continue permit review, request or publish supporting documentation, and hold the decision until the record on haul routes, water monitoring, and local impacts is complete.
- Curtis Lindqvist (twitter, weeks): The Alaska state government will keep reviewing the record, ask for more permit and road-impact details, and avoid a final public commitment until the agency findings and community testimony are reconciled.
- Naomi Crane (twitter, weeks): The state will likely continue collecting public comments and technical information on permits, haul routes, monitoring, and reclamation before any policy or tax change is considered.
- Gordon Strand (twitter, weeks): The Alaska state government will keep the project under review, asking for measurable haul-route, maintenance, safety, and permitting details before making any further commitments.
- Alicia Mendoza (twitter, weeks): The Alaska state government will likely continue its formal water-quality review, request or incorporate additional monitoring details if needed, and keep the record open until the permit or project docket is ready for a documented decision.

</details>

<details><summary>04_placebo_s1: what government expects the state to do next</summary>

- Margaret Halloran (reddit, no timing): (no parseable answer)
- Douglas Renfrew (reddit, no timing): (no parseable answer)
- Evelyn Marchetti (reddit, no timing): (no parseable answer)
- Raymond Takahashi (reddit, no timing): (no parseable answer)
- Curtis Lindqvist (reddit, no timing): (no parseable answer)
- Naomi Crane (reddit, no timing): (no parseable answer)
- Gordon Strand (reddit, no timing): (no parseable answer)
- Alicia Mendoza (reddit, no timing): (no parseable answer)
- Margaret Halloran (twitter, no timing): (no parseable answer)
- Douglas Renfrew (twitter, no timing): (no parseable answer)
- Evelyn Marchetti (twitter, no timing): (no parseable answer)
- Raymond Takahashi (twitter, no timing): (no parseable answer)
- Curtis Lindqvist (twitter, no timing): (no parseable answer)
- Naomi Crane (twitter, no timing): (no parseable answer)
- Gordon Strand (twitter, no timing): (no parseable answer)
- Alicia Mendoza (twitter, no timing): (no parseable answer)

</details>

<details><summary>05_mine_approved_s1: what government expects the state to do next</summary>

- Margaret Halloran (reddit, no timing): (no parseable answer)
- Douglas Renfrew (reddit, no timing): (no parseable answer)
- Evelyn Marchetti (reddit, no timing): (no parseable answer)
- Raymond Takahashi (reddit, no timing): (no parseable answer)
- Curtis Lindqvist (reddit, no timing): (no parseable answer)
- Naomi Crane (reddit, no timing): (no parseable answer)
- Gordon Strand (reddit, no timing): (no parseable answer)
- Alicia Mendoza (reddit, no timing): (no parseable answer)
- Margaret Halloran (twitter, no timing): (no parseable answer)
- Douglas Renfrew (twitter, no timing): (no parseable answer)
- Evelyn Marchetti (twitter, no timing): (no parseable answer)
- Raymond Takahashi (twitter, no timing): (no parseable answer)
- Curtis Lindqvist (twitter, no timing): (no parseable answer)
- Naomi Crane (twitter, no timing): (no parseable answer)
- Gordon Strand (twitter, no timing): (no parseable answer)
- Alicia Mendoza (twitter, no timing): (no parseable answer)

</details>

<details><summary>06_court_blocks_mine_s1: what government expects the state to do next</summary>

- Margaret Halloran (reddit, no timing): (no parseable answer)
- Douglas Renfrew (reddit, no timing): (no parseable answer)
- Evelyn Marchetti (reddit, no timing): (no parseable answer)
- Raymond Takahashi (reddit, no timing): (no parseable answer)
- Curtis Lindqvist (reddit, no timing): (no parseable answer)
- Naomi Crane (reddit, no timing): (no parseable answer)
- Gordon Strand (reddit, no timing): (no parseable answer)
- Alicia Mendoza (reddit, no timing): (no parseable answer)
- Margaret Halloran (twitter, weeks): DNR and DOT&PF will complete and release agency safety and traffic data on the Manh Choh haul route alongside the Redpoll Ridge permitting review before any final decision is announced.
- Douglas Renfrew (twitter, weeks): DNR will continue compiling public comments, inspection findings, and haul-route safety documentation before issuing any permitting decision on Redpoll Ridge.
- Evelyn Marchetti (twitter, weeks): The DNR mining division will continue technical review of the Redpoll Ridge Project application against submitted plans and applicable requirements, pending public input and interagency coordination.
- Raymond Takahashi (twitter, weeks): Alaska state government will continue permit review for Redpoll Ridge while gathering additional operational compliance data and community input before issuing a final decision.
- Curtis Lindqvist (twitter, weeks): DNR will review whether current permit language for mining haul corridors includes binding compliance monitoring requirements, as I've requested.
- Naomi Crane (twitter, weeks): The state will convene permitting and safety agencies to establish enforceable haul-route protocols before any further project advancement, driven by documented spacing violations and resident safety concerns on the corridor.
- Gordon Strand (twitter, weeks): DOT will issue clarified permit conditions specifying enforceable truck spacing, real-time monitoring protocols, and winter emergency procedures for the Manh Choh haul corridor before expanding operations.
- Alicia Mendoza (twitter, weeks): DEC will continue water-quality review of pending permits and project applications, with focus on baseline data, monitoring networks, and enforceable conditions before any decisions are finalized.

</details>

## Daily support

Mean score per day, with heat (on-topic posts that day) in brackets.

### 01_baseline_s1 (baseline, seed 1)

| Group | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 |
|---|---|---|---|---|---|
| government | 5.00 (9) | 4.60 (10) | 4.89 (9) | 4.89 (9) | 4.75 (4) |
| land_industry | 5.11 (36) | 5.59 (37) | 5.45 (29) | 5.33 (21) | 5.21 (28) |
| land_community | 4.47 (17) | 4.24 (17) | 3.95 (20) | 4.54 (13) | 4.13 (15) |
| funds | 5.19 (48) | 5.39 (61) | 5.52 (56) | 5.30 (53) | 5.41 (46) |
| retail | 5.44 (9) | 5.21 (14) | 6.50 (14) | 6.19 (16) | 6.57 (14) |

### 02_baseline_s2 (baseline, seed 2)

| Group | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 |
|---|---|---|---|---|---|
| government | 4.73 (11) | 4.90 (10) | 5.00 (10) | 4.86 (7) | 4.89 (9) |
| land_industry | 5.62 (37) | 5.28 (25) | 5.43 (37) | 5.37 (27) | 5.64 (33) |
| land_community | 4.42 (24) | 4.36 (22) | 4.48 (23) | 4.84 (19) | 4.55 (20) |
| funds | 5.36 (47) | 5.55 (51) | 5.59 (51) | 5.67 (40) | 5.80 (40) |
| retail | 5.79 (14) | 5.71 (14) | 6.36 (14) | 5.75 (16) | 5.67 (12) |

### 03_baseline_s3 (baseline, seed 3)

| Group | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 |
|---|---|---|---|---|---|
| government | 5.00 (8) | 4.75 (8) | 4.62 (8) | 5.10 (10) | 5.00 (8) |
| land_industry | 5.67 (39) | 5.68 (31) | 5.74 (31) | 5.38 (34) | 5.36 (33) |
| land_community | 4.68 (22) | 4.56 (18) | 4.24 (17) | 4.31 (13) | 4.36 (14) |
| funds | 5.00 (45) | 5.62 (64) | 5.55 (42) | 5.27 (41) | 5.37 (49) |
| retail | 5.12 (24) | 6.75 (16) | 5.65 (17) | 5.21 (14) | 5.38 (13) |

### 04_placebo_s1 (placebo, seed 1)

| Group | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 |
|---|---|---|---|---|---|
| government | 4.91 (11) | 4.50 (10) | 5.25 (12) | 5.43 (7) | 5.67 (3) |
| land_industry | 5.84 (31) | 6.00 (28) | 6.32 (19) | 6.00 (13) | 6.86 (14) |
| land_community | 4.11 (18) | 4.31 (13) | 4.38 (16) | 4.22 (9) | 4.20 (10) |
| funds | 5.28 (47) | 5.90 (41) | 5.88 (40) | 5.57 (28) | 5.65 (23) |
| retail | 4.77 (13) | 6.29 (7) | 6.29 (7) | 6.31 (13) | 6.00 (3) |

### 05_mine_approved_s1 (mine_approved, seed 1)

| Group | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 |
|---|---|---|---|---|---|
| government | 5.18 (11) | 5.25 (12) | 4.78 (9) | 5.00 (9) | 4.67 (6) |
| land_industry | 6.00 (36) | 6.21 (24) | 6.14 (21) | 5.94 (16) | 6.31 (16) |
| land_community | 4.06 (16) | 3.82 (17) | 4.00 (16) | 3.50 (12) | 3.57 (7) |
| funds | 5.57 (42) | 6.03 (34) | 5.78 (32) | 5.63 (27) | 5.44 (16) |
| retail | 5.70 (10) | 6.22 (9) | 6.00 (8) | 5.80 (10) | 5.71 (7) |

### 06_court_blocks_mine_s1 (court_blocks_mine, seed 1)

| Group | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 |
|---|---|---|---|---|---|
| government | 4.75 (8) | 5.33 (12) | 5.00 (6) | 5.50 (6) | 5.50 (6) |
| land_industry | 5.57 (35) | 5.73 (22) | 6.06 (18) | 6.38 (16) | 6.64 (14) |
| land_community | 3.50 (18) | 3.75 (16) | 4.26 (19) | 4.33 (9) | 4.59 (17) |
| funds | 5.02 (47) | 5.92 (39) | 5.35 (34) | 6.83 (24) | 7.38 (16) |
| retail | 5.20 (10) | 5.71 (7) | 5.45 (11) | 7.11 (9) | 5.50 (6) |
