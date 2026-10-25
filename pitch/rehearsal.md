# Five-minute pitch rehearsal

Team rehearsal guide, 25 October 2026. The project is named **Orecast**.

## What the judges should remember

The prototype connects mineral evidence, recorded simulated reactions and the time available to exit an assumed option, with an explanation for each result.

## The five-minute run

Use these as talking points. Keep your own wording and leave time to point at the visuals.

| Slide | Time | Cumulative | Speaking and visual cue |
| --- | --- | --- | --- |
| 1. Orecast | 20 seconds | 0:20 | Introduce Tok River and the question of finding a buyer before time runs out. The ring cover introduces the project name; geography appears later. |
| 2. Three clocks | 35 seconds | 0:55 | Explain evidence availability, changing conditions and time to exit. Say that we assume an option we can transfer to a future buyer before expiry. |
| 3. Observed evidence | 35 seconds | 1:30 | Point to one sample and the 67-record source. Separate sediment evidence from the recoverable ounces assumed in the economics. |
| 4. Algorithm | 55 seconds | 2:25 | Read the layers from top to bottom: evidence, assumed option, scenario and exit calculation. Explain that the final output includes reasons and a skip state. |
| 5. Recorded simulations | 50 seconds | 3:15 | Introduce the five stakeholder groups. Show the actual signs, explain the matching sports-placebo reference and preserve failed research checks. |
| 6. Holding period and cash | 60 seconds | 4:15 | Show −$410, +$7.60 and +$369.89 at 30/90/180 days. Pause at the 90-day case: positive expected cash coexists with 51.2% no sale. |
| 7. Traceable decision | 45 seconds | 5:00 | Use up to 20 seconds for the premium change if rehearsed. End on traceability and the next empirical validation step. Invite questions. |

The two appendix slides are for questions and do not belong in the five-minute run.

## Short opening

“We are investigating Tok River, Alaska. We built a way to investigate a mineral opportunity and test what could change before you find a buyer. The prototype brings geological evidence, simulated stakeholder reactions and exit timing into one decision you can inspect.”

## The memorable reveal

At the same assumed sale price, the 30-day case has expected net cash of −$410. At 90 days it reaches +$7.60. There is still a 51.2% chance of no sale by day 90. The timing assumptions explain both results.

Keep **total expected cash** separate from **change versus baseline**. The recorded approval what-if gives +$6.31 total expected cash, a −$1.29 change from +$7.60. That negative change does not make the total negative. The court-blockage what-if gives +$9.17 total cash, a +$1.57 change.

## Live click path

The team application uses <http://127.0.0.1:3000/> by default. Follow the repository [setup instructions](../README.md#application-setup) to run it on your machine. This address is local to each presenter.

**Current-main demo caveat:** the approved deck captures and browser verification came from a newer local prototype. That version opens directly in hypothetical mode and exposes the premium input and optional recorded-result comparison described below. Current `main` can have different controls, wording or scenario readiness. The default hypothetical arithmetic is shared, but the captured UI and optional financial what-if workflow are not a promise of current-main behavior. Rehearse the exact revision you will present. If the steps or values do not match, use the approved PDF and screenshots instead of changing application code during the pitch.

Before presenting:

1. Open the explorer, select **Explore the land**, then the **Decision** tab.
2. Use **Reset assumptions**. Confirm Area A, 90 days and **Baseline reference**, with **Use existing swarm results** unchecked.
3. Confirm the result is **$7.60 expected net cash** and the premium is $650. The premium input lives under **Contract economics**.
4. Keep the cash table visible. At the demonstration beat, change the premium to **$660**. Confirm **−$2.40** and **Skip this contract**. Restore $650 or use **Reset assumptions**.

The newer captured baseline UI and result table were inspected for this deck. The $660 outcome was reproduced through the shared engine, independently checked arithmetically and verified in the live browser. Changing $650 to $660 showed −$2.40 and **Skip this contract**; restoring $650 returned $7.60 and **Demo buy candidate**. Rehearse the pacing of this input edit at the chosen presentation resolution.

Only in a rehearsed version that exposes the illustrative comparison, an optional longer swarm walkthrough is for questions: select **Use existing swarm results**, choose **Mine approval**, then **Mine blocked**. Expected default 90-day totals are $6.31 and $9.17. These are illustrative transfers from the recorded simulations. Stop if the screen shows a missing scenario or a changed configuration; explain the displayed state.

## A shorter version

For a one-minute interruption, use slides 1, 4 and 6. Establish the question, point through the algorithm and reveal how the same assumed option changes with the holding period. Keep the word “hypothetical” attached to financial results.

For a three-minute version, use slides 1, 3, 4, 6 and 7. Explain the swarm in one sentence within slide 4. Keep the longer simulation discussion for questions.

## Judge questions

**Does the algorithm predict real returns?**

We have built an explainable scenario and decision prototype. The current financial numbers are assumptions. Dated option prices, completed assignments and unsold cases are needed to measure predictive performance and calibrate time-to-sale estimates.

**What does the sediment evidence tell you?**

It supplies measured assays and an explicit screening rule. It does not supply recoverable ounces or a geological success probability. Those are separately labelled assumptions in the option example.

**Why use simulated stakeholders?**

We want to test how different groups react to a shared event and inspect the differences. Mining support is not a buyer quote. Our recorded-run comparison preserves source identity and failed checks; the financial transfer is an assumed what-if policy.

**Why did approval lower the result and blockage raise it?**

Those are the recorded contrast directions against the same-provider sports-placebo reference. The research diagnostics fail, so the directions do not establish causal market effects. We expose the result rather than forcing the expected story into the output.

**Why can expected cash be positive when most cases do not sell?**

The sale branch yields $750 net cash with 48.8% probability. No sale yields −$700 cash with 51.2% probability. Their weighted average is $7.60. The median cash outcome remains −$700. An unsold option can still be held, so this cash shortfall is different from declaring a final realized loss.

**Is the 7% adjustment a risk limit?**

It caps the scenario's assumed price adjustment. It does not cap investment loss. The full upfront commitment can be lost, and unsold marks cannot fund another position.

**Can someone buy one of the areas shown on the map?**

The map provides checked source context. It does not establish an available contract, complete mineral title or assignment permission. A/B are comparison areas; some map squares are illustrative.

**What did you actually build?**

A local explorer connecting source samples, land context, historical market information, recorded stakeholder simulations and one shared assignment model. It recalculates hypothetical scenarios and shows cash outcomes, thresholds and reasons for candidate/skip decisions.

## Demo fallback

The deck and its PDF companion are saved presentation assets in this folder. Use the saved screenshots and editable diagrams if map imagery or localhost access fails. The horizon chart and cash branches do not depend on a live network call. Keep the slide open and explain the numbers rather than debugging a server in the judged slot.

## Sources and scope

- Assays: Alaska DGGS RDF 2016-10, <https://doi.org/10.14509/29688>.
- Claim records: Alaska DNR mining-claim service, <https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData/NaturalResource_StateMiningClaim/FeatureServer>.
- Land context: pinned team source at `34eaf1d6e87fedd54c46b04dec093b0cc2b18581`.
- Recorded swarm: pinned team source at `f2fe2971d9f041a819f7b7ff4a78e10f840884f5`.
- Financial arithmetic: the shared canonical `model/tok-option/` engine in the canonical model source. The default 20% interval hazard is assumed and zero growth holds the assignment price fixed. The 180-day horizon plus the required 15-day closing buffer fits within the assumed 365-day maturity.

No final algorithm name, validated market edge, available investment or hosted deployment is implied by this deck. The PDF preserves the rendered visual appearance. The PPTX keeps foreground text, diagrams and quantitative objects editable.
