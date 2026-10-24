"""Build swarm/cast.json from seed/cast.md and the tier and temperament split in plan section 4."""

import json
import re
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent

# Entry number -> (tier, temperament). Numbers follow seed/cast.md; the counts are checked below.
SPLIT = {
    1: (1, "moderate"), 2: (1, "cautious"), 3: (2, "cautious"), 4: (2, "cautious"), 5: (2, "free"),
    6: (2, "cautious"), 7: (2, "moderate"), 8: (2, "cautious"), 9: (3, "cautious"), 10: (3, "moderate"),
    11: (1, "cautious"), 12: (1, "cautious"), 13: (2, "cautious"), 14: (2, "moderate"), 15: (3, "moderate"),
    16: (3, "moderate"), 17: (3, "moderate"), 18: (3, "moderate"), 19: (3, "free"), 20: (3, "moderate"),
    21: (3, "moderate"), 22: (3, "free"), 23: (3, "free"),
    24: (2, "cautious"), 25: (2, "free"), 26: (2, "free"), 27: (3, "cautious"), 28: (3, "free"),
    29: (3, "moderate"), 30: (3, "free"),
    31: (1, "moderate"), 32: (1, "moderate"), 33: (2, "moderate"), 34: (2, "moderate"), 35: (2, "cautious"),
    36: (2, "free"), 37: (2, "cautious"), 38: (2, "cautious"), 39: (2, "moderate"), 40: (3, "free"),
    41: (3, "free"), 42: (3, "free"), 43: (3, "cautious"), 44: (3, "cautious"), 45: (3, "cautious"),
    46: (3, "cautious"), 47: (3, "cautious"), 48: (3, "moderate"), 49: (3, "moderate"), 50: (3, "moderate"),
    51: (3, "moderate"), 52: (3, "moderate"), 53: (3, "moderate"), 54: (3, "moderate"),
    55: (3, "cautious"), 56: (3, "moderate"), 57: (3, "moderate"), 58: (3, "free"), 59: (3, "free"),
    60: (3, "free"),
    61: (3, "cautious"),  # the news wire never acts by itself, so its temperament has no effect
}

EXPECTED = {  # plan section 4: (cautious, moderate, free) and (tier 1, tier 2, tier 3) per group
    "Government": ((6, 3, 1), (2, 6, 2)),
    "Land side": ((5, 8, 7), (2, 5, 13)),
    "Funds": ((8, 12, 4), (2, 7, 15)),
    "Retail": ((1, 2, 3), (0, 0, 6)),
}


def main():
    text = (HERE / "seed" / "cast.md").read_text(encoding="utf-8")
    entries = re.findall(
        r"^### (\d+)\. (.+?)\nRole: (.+?)\nGroup: (.+?)\n(.+?)(?=\n### |\n## |\Z)", text, re.S | re.M)
    cast = []
    for num, name, role, group, background in entries:
        tier, temperament = SPLIT[int(num)]
        cast.append({"n": int(num), "name": name.strip(), "role": role.strip(), "group": group.strip(),
                     "tier": tier, "temperament": temperament, "background": " ".join(background.split())})
    assert [c["n"] for c in cast] == list(range(1, 62)), "cast.md must list entries 1-61 in order"
    assert len({c["name"] for c in cast}) == 61, "names must be unique"

    for group, (temps, tiers) in EXPECTED.items():
        members = [c for c in cast if c["group"].startswith(group)]
        t = Counter(c["temperament"] for c in members)
        k = Counter(c["tier"] for c in members)
        got = ((t["cautious"], t["moderate"], t["free"]), (k[1], k[2], k[3]))
        assert got == (temps, tiers), f"{group}: got {got}, plan says {(temps, tiers)}"

    (HERE / "cast.json").write_text(json.dumps(cast, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {len(cast)} cast members; group, tier and temperament counts match the plan")


if __name__ == "__main__":
    main()
