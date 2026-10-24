# Working split and current dataset decision

24 October 2026. Owner: Amit. Coordination note. US soil data is selected; the named assignments are agreed and exact area boundaries remain pending. See [the current build plan](us-soil-build-plan.md).

> Execution update: Amit has completed both Site A and Site B using the shared method while Arjin was unavailable. Arjin can review B and continue the display work on return. See [Site A results](site-a-evidence-results.md) and [Site B results](site-b-evidence-results.md). MiroFish remains a separate workstream.

| Person | Responsibility | Handoff |
|---|---|---|
| Amit: Site A and local MiroFish | Extract Site A evidence; bootstrap and run MiroFish locally after both packs and prompts are ready | Site A pack, then saved local swarm run |
| Arjin: Site B | Extract Site B from the same chosen dataset and format | Site B pack |
| Muhd: prompts and agent information | Prepare agent roles, instructions, evidence packaging and structured output expectations | Versioned prompts; no requirement to host MiroFish |
| Salman: decision algorithm | Build the numerical decision component against explicit fixtures while evidence is prepared | Solver accepting agreed scenario fields and producing an explained decision |

Two site packs plus prompts feed Amit’s local MiroFish run. Structured swarm output is reviewed and handed to the decision algorithm; the team then examines the prediction and decision together. Agent statements and scenario probabilities remain distinct from recorded measurements. No installation, agent run or interface build has started. Presentation is shared integration work after the first complete run, not a fifth person's role.

Both site owners should return the same small pack: source file/version and record IDs, area definition and coordinates, selected observations with units, a short evidence summary, known gaps, and a separately labelled assumptions section. Keep unknown values unknown. Freeze these fields with the prompt and algorithm owners before splitting extraction work.

## Dataset selected: US soil chemistry

Existing local files include the earlier Australian WAMEX drilling and the USGS 2007–2011 soil survey, published in 2013. The checked project folders do not contain a US MRDS occurrence or land-claims extract. This does not establish that no such file exists elsewhere on the laptop.

US soil samples are simpler for a single-table regional chemistry demonstration. The C-horizon table has 4,857 sites nationwide, with 4,766 numeric copper results, 14 below detection and 77 missing/insufficient samples in the previous audit. Nominal survey density is one site per 1,600 square kilometres. It supports broad soil-anomaly context rather than identifying mineral deposits beneath individual parcels. Two broadly defined study areas and copper are a practical proposed scope, not a chosen pair of sites or a validated model.

Australian drilling gives local measurements at depth and is closer to an exploration story, but requires interval and detection-flag handling. The existing narrow shallow-gold spatial and external-feature models did not establish reliable targeting skill. Choosing US data does not make that scientific validation problem disappear; it changes the demo target.

Amit has selected America and the existing US soil samples. The proposed implementation uses one C-horizon table, copper and two regional areas in Arizona. These narrower choices and the working schedule await review in the build plan. Do not extract A/B or implement the runtime until that review is complete.
