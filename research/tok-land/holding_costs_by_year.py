#!/usr/bin/env python3
"""Yearly cost of holding a mining claim: Alaska state rent and the BLM federal fee.

Expands the cited fee schedules below into alaska_holding_costs_by_year.csv, one row per
mining year (which starts on 1 September). Each value comes from the source on its schedule
row. Years with no verified rate are left blank, never interpolated. Standard library only.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

FIRST_YEAR, LAST_YEAR = 1989, 2026

# Alaska state rent per claim, by years since the claim was first located (AS 38.05.211).
# (first mining year, 40-acre rent for ages 0-5 / 6-10 / 11+, 160-acre rent for the same, source)
STATE_RENT = [
    (1989, (20, 40, 100), None,
     "Alaska session law 1989 ch. 101 sec. 4 (AS 38.05.211); first rent for the year beginning 1 Sep 1989; "
     "rates are per claim or leasehold location (no 160-acre MTRSC claims yet)",
     "https://www.akleg.gov/pdf/16/Bills/Final/CH%20101%20SLA%201989.pdf"),
    (2000, (20, 40, 100), (80, 160, 400),
     "Alaska session law 2000 ch. 74 sec. 3 (effective 20 Aug 2000): same rate per quarter-quarter section; "
     "a quarter-section MTRSC claim pays four times that",
     "https://www.akleg.gov/pdf/21/Bills/final/CH%2074%20SLA%202000.pdf"),
    (2019, (40, 85, 205), (165, 330, 825),
     "DNR fact sheet 'Annual Rent' (July 2021), 11 AAC 86.221(b); new rates from the 2020 mining year, "
     "which began 1 Sep 2019",
     "https://dnr.alaska.gov/mlw/cdn/pdf/factsheets/annual-rent.pdf"),
]

# BLM annual maintenance fee per federal claim, by the September in which it is due.
# (first September due, fee or None if unverified, source)
BLM_FEE = [
    (1993, 100, "Fee set by the 1993 Act at $100; unchanged until the 2004 rule (69 FR 40294)",
     "https://www.federalregister.gov/documents/2004/07/01/04-15158/location-recording-and-maintenance-of-mining-claims-or-sites"),
    (2004, None, "69 FR 40294 raised the fee to $125, then PL 108-447 rolled it back; the restored "
     "amount and date for 2004-2008 are not verified here",
     "https://www.federalregister.gov/documents/2005/09/01/05-17534/mining-claim-and-site-maintenance-and-location-fees-fee-adjustment"),
    (2009, 140, "74 FR 30959 (CPI adjustment; due 1 Sep 2009 for the 2010 assessment year)",
     "https://www.federalregister.gov/citation/74-FR-30959"),
    (2014, 155, "79 FR 36662, 30 Jun 2014 (due 1 Sep 2014 for the 2015 assessment year)",
     "https://regulations.justia.com/regulations/fedreg/2014/06/30/2014-15259.html"),
    (2019, 165, "84 FR 31219, 1 Jul 2019 (due 1 Sep 2019 for the 2020 assessment year)",
     "https://regulations.justia.com/regulations/fedreg/2019/07/01/2019-13963.html"),
    (2024, 200, "Federal Register 2024-14301, 1 Jul 2024 (due 1 Sep 2024)",
     "https://www.federalregister.gov/documents/2024/07/01/2024-14301/required-fees-for-mining-claims-or-sites"),
]


def in_force(schedule, year):
    """The latest schedule row starting on or before this year, or None."""
    rows = [r for r in schedule if r[0] <= year]
    return rows[-1] if rows else None


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parent)
    args = parser.parse_args(argv)
    fields = ["mining_year_starting_sep_1", "ak_rent_40ac_age_0_5", "ak_rent_40ac_age_6_10", "ak_rent_40ac_age_11_plus",
              "ak_rent_160ac_age_0_5", "ak_rent_160ac_age_6_10", "ak_rent_160ac_age_11_plus",
              "ak_rent_160ac_per_acre_age_0_5", "ak_source", "ak_source_url",
              "blm_fee_per_claim", "blm_source", "blm_source_url"]
    with open(args.out / "alaska_holding_costs_by_year.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fields)
        w.writeheader()
        for year in range(FIRST_YEAR, LAST_YEAR + 1):
            row = {"mining_year_starting_sep_1": year}
            state = in_force(STATE_RENT, year)
            if state:
                _, small, big, note, url = state
                row.update(dict(zip(fields[1:4], small)), ak_source=note, ak_source_url=url)
                if big:
                    row.update(dict(zip(fields[4:7], big)), ak_rent_160ac_per_acre_age_0_5=round(big[0] / 160, 3))
            blm = in_force(BLM_FEE, year)
            if blm:
                row.update(blm_fee_per_claim=blm[1] if blm[1] is not None else "", blm_source=blm[2], blm_source_url=blm[3])
            w.writerow(row)
    print(f"wrote {LAST_YEAR - FIRST_YEAR + 1} years, {FIRST_YEAR}-{LAST_YEAR}")


if __name__ == "__main__":
    main()
