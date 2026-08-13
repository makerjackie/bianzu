---
name: mj-bianzu-tts
description: Generate bianzu / 滑动变祖器 rank voices as short funny mp3s via Fish Audio. Use when regenerating public/sfx voices, adding a subject or rank, or when the user mentions bianzu TTS, 变祖器语音, 花都谢了, or 牢梁你又跳票了.
---

# Bianzu TTS

Regenerate rank voices for `rheostat.01mvp.com` / `makerjackie/bianzu`. Do not use Apple `say`.

## Provider (locked)

| Field | Value |
| --- | --- |
| Provider | Fish Audio |
| Model | `s2.1-pro-free` |
| Voice | `5196af35f6ff4a0dbf541793fc9f2157` (`Donald J. Trump (Noise reduction)`) |
| Endpoint | `POST https://api.fish.audio/v1/tts` |
| Format | `mp3` |

Why this stack: earlier batches used Apple `say` (Eddy/Albert). The user rejected that mechanical voice and asked for Trump/Musk-like male via Fish or MiMo. Fish `s2.1-pro-free` with the Trump voice is the locked default. MiMo 2.5 (`MIMO_API_KEY`) is fallback only.

## Credentials

Read from environment or gitignored `.env`. Never write keys into the repo, skill, README, commit messages, or GitHub.

```bash
FISHAUDIO_KEY=   # required
MIMO_API_KEY=    # fallback only
```

Check presence, not values:

```bash
echo "FISH=${FISHAUDIO_KEY:+set}"
```

If missing, stop and ask the user to put `FISHAUDIO_KEY` in `.env`.

## Output paths

```
public/sfx/{id}/{zh|en}-{0-5}.mp3
```

6 subjects × 6 ranks × zh+en = **72** files. `{id}` matches `src/subjects.js`: `musk`, `liang`, `kimi`, `codex`, `claude`, `tibo`. Rank index `0` = 小难, `1` = 牢, `2` = 子, `3` = 圣, `4` = 神, `5` = 祖.

After replacing mp3s, bump the cache-bust query in `src/main.js` `poke()` (`/sfx/${id}.mp3?v=N`).

## Line style

Short, funny, rank-matched. Chinese meme cadence. English can be Trump-flavored (short punches, "believe me") but still about the subject.

Canonical examples:

- 花都谢了。V4 还在即将。
- 牢梁，你又跳票了。

Rules:

- One beat. Roughly 6–16 Chinese characters or 4–10 English words.
- Lead with the rank nickname (小难梁 / 牢梁 / 梁子 / 梁圣 / 梁神 / 梁祖, and the matching English).
- Punchline from that rank's event, not a generic hype line.
- No Apple TTS leftover cadence. No long explanations.

Canonical copy lives in [lines.json](lines.json). Edit that file when ranks or jokes change, then regenerate.

## Generate

From the repo root:

```bash
python3 .cursor/skills/mj-bianzu-tts/scripts/generate-sfx.py
```

The script:

1. Loads `FISHAUDIO_KEY` from env or `.env`
2. Reads [lines.json](lines.json)
3. `POST`s each line with headers `Authorization: Bearer $FISHAUDIO_KEY`, `Content-Type: application/json`, `model: s2.1-pro-free`
4. Body `{ "text", "reference_id": "5196af35f6ff4a0dbf541793fc9f2157", "format": "mp3" }`
5. Writes `public/sfx/{id}/{lang}-{n}.mp3`

To search voices again (only if the Trump id disappears):

```bash
curl -sS "https://api.fish.audio/model?title=Trump&page_size=8&sort_by=task_count" \
  -H "Authorization: Bearer $FISHAUDIO_KEY"
```

Prefer the highest `task_count` Donald Trump model. Update `VOICE_ID` in the script and this skill together.

## Manual one-shot

```bash
curl https://api.fish.audio/v1/tts \
  -H "Authorization: Bearer $FISHAUDIO_KEY" \
  -H "Content-Type: application/json" \
  -H "model: s2.1-pro-free" \
  -d '{"text":"牢梁，你又跳票了。","reference_id":"5196af35f6ff4a0dbf541793fc9f2157","format":"mp3"}' \
  --output public/sfx/liang/zh-1.mp3
```

## Fallback

If Fish is down, MiMo `mimo-v2.5-tts` with a fun male / voicedesign Trump-like instruction is allowed. Do not silently fall back to `say`. After a fallback, say so in the reply and keep Fish as the documented default.
