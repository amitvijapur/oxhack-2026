# LODESTAR: buy the land before the miners do

**One line:** we predict where battery minerals are, find the open land above them before anyone else, and tell an investor exactly which land to buy and when to sell it to mining companies.

Revised pitch for [LODESTAR](lodestar.md).

## How it works

1. **Predict:** where lithium is likely in Nevada (geology + known mineral sites).
2. **Spot the gap:** high-chance land that nobody has claimed yet, using the US register of 4.4 million mining claims.
3. **Decide:** a ranked buy list, with the expected profit for each block:

   ```text
   expected profit = chance of minerals × what a mining company would pay − cost to claim and hold
   ```

4. **Sell signal:** when claims start rushing toward our land, its value peaks. That's the moment to sell or lease to a miner.

- **Proof (TIME):** freeze the clock in 2016, run the model, and show it pointed to where the real lithium rush went from 2016 to 2023. Then show today's buy list.
- **Citadel:** we hand-write the prediction model, the "rush" simulation and the buy/sell engine.

## Claim dates: what we found

- The online map service and the bulk download both lack dates, and the bulk download is switched off.
- Dates do exist in the government's official claim reports at [reports.blm.gov](https://reports.blm.gov) ("Mining Claims Geographic Report" and "Serial Register Page"). They export to CSV or Excel.
- That site is behind a bot check (Cloudflare), so an automated browser can't pull it. A person can, in a normal browser.

### Narrow scope

Don't do all of Nevada. Pick 2 lithium areas:

| Area | Deposit type |
|---|---|
| Clayton Valley | Lithium brine |
| Thacker Pass / McDermitt | Lithium clay |

Run the Geographic Report for those townships, export to CSV, and check that a location date column is there. About 15 minutes of clicking.

### Backup if the reports don't show dates

Older claim numbers (`NMC…`) and newer ones (`NV10…`) are issued in order, so we can still split "before 2016" from "after 2016" roughly.

## Do now (in parallel)

| Owner | Task |
|---|---|
| Person | Open reports.blm.gov → "Mining Claims Geographic Report" → Nevada → the Clayton Valley townships → export CSV. Record which columns it has. |
| Agent | Pull the map shapes for every active and closed claim in the two areas from the map service, plus the USGS lithium sites, so everything is ready to join when the CSV arrives. |
