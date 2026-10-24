# Proposal verification

24 October 2026. These checks cover the proposed documents and hypothetical fixture. They do not establish empirical valuation or prediction performance.

## Independent review

A separate reviewer read the proposal, both research notes and JSON fixture. It independently recomputed the cash-flow outcomes, expected values, required funding and boundary cases.

| Check | Result |
| --- | --- |
| Purchase outcomes and assumed mean | USD 25,500 / -14,500; mean USD 9,500 |
| Option outcomes and assumed mean | USD 23,000 / -3,000; mean USD 12,600 |
| Pre-receipt funding | Purchase USD 102,500; option USD 105,000 |
| Premium increased to USD 16,000 | Option expected NPV -400; budget/loss constraints fail; selected action SKIP |
| One-day option settlement delay | Misses the fixed day-five closing deadline; selected action SKIP |
| Budget reduced to USD 104,000 | Option cannot be funded; purchase still fails loss constraint; SKIP |
| Information at exercise | Firm bid is observed before the only permitted exercise date, so the fixture's maximum is legitimate |
| Scope and claims | Hypothetical rights, probabilities, bids and guaranteed settlement are disclosed; implementation and empirical calibration remain separate |

One finding was corrected: returning to baseline return dynamics from a shifted day-five gold price can preserve a price-level shock. The evaluation note now explicitly requires a retention, decay or reversion mapping and leaves longer-horizon swarm effects unknown without one. The reviewer checked the revised paragraph and confirmed the finding resolved.

The reviewer independently checked the SEC-hosted Trench terms. Its web tool could not retrieve the Legal Tender release, so that second example relies on the contract-research lane's successful primary-source read. This is disclosed rather than described as two independent source confirmations. Not every cited paper or market assertion from the original strategy was re-audited.

## Parent checks

- Parsed `decision-fixture.json` with Python's standard library.
- Recomputed purchase and option values using exact rational scenario probabilities; expected values and worst scenario losses match the recorded outputs.
- Checked nonnegative probabilities summing exactly to one and document trailing whitespace/final newlines.
- Checked local document links and the tracked whitespace diff after the final edits.
- Checked the live strategy branch once at completion: it remained `3a84a2ce77644521229bd1f4d61fea03c7ee1635`, the reviewed baseline. No updated source was available to reconcile at that check.

No forecast model, production solver, application test or historical investment backtest was run. The next source-dependent step is to compare Salman's revised strategy with amendments A1–A8 and produce a combined draft.
