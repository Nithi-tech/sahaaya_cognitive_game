# XTTS-v2 Voice Cloning Server

Wraps the vendored [`../TTS-dev`](../TTS-dev) checkout (Coqui TTS) so the app's
existing `XTTSProvider` (`src/services/voice/providers/XTTSProvider.ts`) can do
real zero-shot voice cloning locally instead of falling back to plain browser
speech.

## What it does

- Loads `tts_models/multilingual/multi-dataset/xtts_v2` once at startup.
- Exposes `POST /tts_stream` with the exact contract `XTTSProvider.ts` already
  expects: JSON body `{ text, language, speaker_wav }`, response
  `audio/wav`.
- `speaker_wav` arrives as a base64 data-URI recorded in the browser
  (`src/hooks/useVoiceRecorder.ts`, usually `audio/webm`), not a file path —
  this server decodes it with [PyAV](https://github.com/PyAV-Org/PyAV)
  (bundles its own decoding libs, no system `ffmpeg` needed) into a WAV file
  before handing it to XTTS.
- Falls back non-Assamese-supporting languages to `en` — XTTS-v2 only ships
  17 languages (see `TTS/tts/configs/xtts_config.py` in TTS-dev); the
  frontend already maps `as` (Assamese) → `hi` (closest supported language)
  before calling this server.

## First-time setup

```bash
cd xtts-server
python3 -m venv venv
venv/bin/pip install --upgrade pip setuptools wheel
# CPU-only torch build — much smaller than the default CUDA wheels, and this
# is CPU inference only unless you have a CUDA GPU available.
venv/bin/pip install torch==2.11.0 torchaudio==2.11.0 --index-url https://download.pytorch.org/whl/cpu
venv/bin/pip install -e ../TTS-dev flask av
```

(`requirements.lock.txt` in this folder is a full `pip freeze` snapshot of a
known-working install, for reference.)

## Running

```bash
venv/bin/python app.py
```

- First run downloads the xtts_v2 model (~1.8GB) to
  `~/.local/share/tts/tts_models--multilingual--multi-dataset--xtts_v2` —
  cached after that.
- Listens on `http://localhost:8020` by default (`XTTS_PORT` env var to
  change).
- `app.py` sets `COQUI_TOS_AGREED=1` to skip the interactive license prompt.
  **The xtts_v2 model itself is licensed under Coqui's CPML
  (non-commercial) — read https://coqui.ai/cpml before any commercial use.**

## Wiring it into the app

In the project root `.env`:

```
VITE_VOICE_CLONE_PROVIDER=xtts
VITE_XTTS_ENDPOINT=http://localhost:8020
```

## Performance note

This machine has no GPU. XTTS-v2 on CPU typically takes **10-30+ seconds per
line** — `XTTSProvider.ts` sets a 30s timeout (`timeoutMs`, overridable via
`VITE_XTTS_TIMEOUT_MS`) specifically to accommodate this instead of the
default 3.5s used for hosted APIs. Expect noticeably slower "AI Voice"
responses than ElevenLabs or the browser-TTS fallback. For production or
snappier demos, run this on a machine with a CUDA GPU, or switch
`VITE_VOICE_CLONE_PROVIDER` to `elevenlabs`.
