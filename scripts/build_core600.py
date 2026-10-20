#!/usr/bin/env python3
"""Build the 440-word corpus-ranked supplement for the 600-card CET-4 set.

Input: WordTyper's MIT-licensed cet4_high_freq.json. Existing hand-curated
cards are retained; duplicate headwords are skipped. The source ranks are
general BNC corpus ranks, never CET-4 past-paper frequency counts.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORDS = ROOT / "floot/helpers/wordBank.tsx"
SUPPLEMENT = ROOT / "floot/helpers/wordBankSupplement.tsx"
OUTPUT = ROOT / "floot/helpers/wordBankCorpus.tsx"
TARGET_TOTAL = 600


def existing_words() -> set[str]:
    text = WORDS.read_text(encoding="utf-8") + "\n" + SUPPLEMENT.read_text(encoding="utf-8")
    return set(re.findall(r'"word"\s*:\s*"([a-zA-Z-]+)"', text)) | set(
        re.findall(r'\["([a-zA-Z-]+)"\s*,', text)
    )


def build(source: Path) -> list[dict[str, object]]:
    data = json.loads(source.read_text(encoding="utf-8"))
    known = existing_words()
    needed = TARGET_TOTAL - len(known)
    if needed <= 0:
        raise SystemExit(f"Existing unique bank already has {len(known)} words")
    entries: list[dict[str, object]] = []
    for rank, item in enumerate(data.get("words", []), start=1):
        word = str(item.get("word", "")).strip().lower()
        if not re.fullmatch(r"[a-z]+(?:-[a-z]+)?", word) or word in known:
            continue
        translations = [str(value).strip() for value in item.get("translations", [])]
        translations = [value for value in translations if value and not value.startswith("[")]
        if not translations:
            continue
        meaning = translations[0].replace("...", "……").replace(",", "；")
        entries.append({
            "word": word,
            "phonetic": str(item.get("phonetic", "")),
            "meaning": meaning,
            "sourceRank": rank,
            "note": f"CET-4词汇标签与BNC通用英语语料词频交集排序第{rank}位；这不是四级历年真题考频。",
        })
        known.add(word)
        if len(entries) == needed:
            break
    if len(known) != TARGET_TOTAL:
        raise SystemExit(f"Could only build {len(known)} unique words; source data may have changed")
    return entries


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, help="path to cet4_high_freq.json")
    args = parser.parse_args()
    entries = build(args.source)
    OUTPUT.write_text(
        "// Derived subset; see THIRD_PARTY_NOTICES.md for attribution and limits.\n"
        "export const corpusRankedWords = "
        + json.dumps(entries, ensure_ascii=False, indent=2)
        + " as const;\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(entries)} unique additions to {OUTPUT}")
    print(f"Source ranks: {entries[0]['sourceRank']}–{entries[-1]['sourceRank']}")


if __name__ == "__main__":
    main()
