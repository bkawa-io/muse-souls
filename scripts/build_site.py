#!/usr/bin/env python3
"""Refresh the generated site invitation from the single canonical root template.

Run from anywhere: python3 scripts/build_site.py
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
source = ROOT / "INSTRUCTIONS.md"
target = ROOT / "docs" / "data" / "installation-template.md"
text = source.read_text(encoding="utf-8")
required = ["PACK_LABEL", "SOUL_URL", "IDENTITY_URL", "NAMES_URL", "AVATAR_URL", "PACK_URL"]
missing = [item for item in required if "{{" + item + "}}" not in text]
if missing:
    sys.exit("Missing instruction placeholders: " + ", ".join(missing))
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(text, encoding="utf-8")
print(f"Synchronized {source.relative_to(ROOT)} -> {target.relative_to(ROOT)}")
