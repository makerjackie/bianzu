#!/usr/bin/env python3
"""Generate bianzu rank voices via Fish Audio s2.1-pro-free.

Reads FISHAUDIO_KEY from the environment or a gitignored .env file.
Never prints the key.
"""

from __future__ import annotations

import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import httpx

MODEL = "s2.1-pro-free"
VOICE_ID = "5196af35f6ff4a0dbf541793fc9f2157"  # Donald J. Trump (Noise reduction)
TTS_URL = "https://api.fish.audio/v1/tts"
WORKERS = 3


def repo_root() -> Path:
    here = Path(__file__).resolve()
    for parent in [here, *here.parents]:
        if (parent / "src" / "subjects.js").exists() and (parent / "public" / "sfx").exists():
            return parent
    sys.exit("Could not find bianzu repo root (need src/subjects.js and public/sfx).")


def skill_dir() -> Path:
    return Path(__file__).resolve().parent.parent


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        os.environ.setdefault(name.strip(), value.strip().strip("'").strip('"'))


def api_key(root: Path) -> str:
    load_dotenv(root / ".env")
    val = os.environ.get("FISHAUDIO_KEY", "").strip()
    if not val:
        sys.exit("Missing FISHAUDIO_KEY. Put it in the environment or .env. See .env.example.")
    return val


def synthesize(token: str, text: str, dest: Path) -> None:
    last_err = None
    for attempt in range(4):
        try:
            with httpx.Client(http2=False, timeout=60) as client:
                res = client.post(
                    TTS_URL,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                        "model": MODEL,
                    },
                    json={"text": text, "reference_id": VOICE_ID, "format": "mp3"},
                )
            ctype = res.headers.get("content-type", "")
            audio_ok = ctype.startswith("audio/") or res.content.startswith(b"ID3") or res.content[:2] in {b"\xff\xfb", b"\xff\xf3"}
            if res.status_code == 200 and audio_ok:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(res.content)
                return
            last_err = f"{res.status_code} {res.text[:200]}"
        except Exception as exc:  # noqa: BLE001
            last_err = f"{type(exc).__name__}: {exc}"
        time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"TTS failed for {dest.name}: {last_err}")


def jobs(root: Path) -> list[tuple[str, Path]]:
    lines = json.loads((skill_dir() / "lines.json").read_text())
    out_root = root / "public" / "sfx"
    items = []
    for subject, langs in lines.items():
        for lang, texts in langs.items():
            if len(texts) != 6:
                sys.exit(f"{subject}/{lang} must have 6 lines, got {len(texts)}")
            for idx, text in enumerate(texts):
                items.append((text, out_root / subject / f"{lang}-{idx}.mp3"))
    if len(items) != 72:
        sys.exit(f"expected 72 lines, got {len(items)}")
    return items


def main() -> None:
    root = repo_root()
    token = api_key(root)
    items = jobs(root)
    print(f"Fish Audio {MODEL} voice={VOICE_ID} files={len(items)}")
    ok = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futs = {pool.submit(synthesize, token, text, dest): dest for text, dest in items}
        for fut in as_completed(futs):
            dest = futs[fut]
            try:
                fut.result()
                ok += 1
                print(f"ok {dest.relative_to(root / 'public' / 'sfx')} ({ok}/{len(items)})")
            except Exception as exc:  # noqa: BLE001
                print(f"FAIL {dest}: {exc}", file=sys.stderr)
                sys.exit(1)
    print(f"wrote {ok} mp3s")


if __name__ == "__main__":
    main()
