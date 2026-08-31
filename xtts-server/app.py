"""
Local XTTS-v2 voice-cloning server for Sahaaya.

Bridges the app's existing XTTSProvider.ts contract (POST /tts_stream with
{text, language, speaker_wav}, Accept: audio/wav) to the real Coqui TTS
zero-shot cloning API (TTS.api.TTS(...).tts_to_file(..., speaker_wav=<path>)),
using the vendored ../TTS-dev checkout.

speaker_wav arrives from the browser as a base64 data-URI recorded by
MediaRecorder (webm/opus, see src/hooks/useVoiceRecorder.ts) — not a file
path — so it's decoded here with PyAV (no system ffmpeg needed) into a WAV
file before being handed to XTTS.

Run:
    venv/bin/python app.py
Env:
    XTTS_PORT (default 5050)
    COQUI_TOS_AGREED=1 is set below to accept the non-commercial CPML model
    license non-interactively — see https://coqui.ai/cpml. Review the
    license yourself before any commercial use.
"""
import base64
import io
import os
import re
import tempfile
import traceback

os.environ.setdefault("COQUI_TOS_AGREED", "1")

import av
import numpy as np
import soundfile as sf
from flask import Flask, request, Response, jsonify

from TTS.api import TTS

app = Flask(__name__)

MODEL_NAME = "tts_models/multilingual/multi-dataset/xtts_v2"
PORT = int(os.environ.get("XTTS_PORT", "8020"))  # matches VITE_XTTS_ENDPOINT in .env.example

# XTTS-v2 only ships these 17 languages (see TTS/tts/configs/xtts_config.py).
# The frontend already maps 'as' (Assamese) -> 'hi' before calling us; this
# is a defensive second layer in case a caller forgets.
SUPPORTED_LANGUAGES = {
    "en", "es", "fr", "de", "it", "pt", "pl", "tr", "ru",
    "nl", "cs", "ar", "zh-cn", "hu", "ko", "ja", "hi",
}

print(f" > Loading {MODEL_NAME} (first run downloads ~1.8GB, then it's cached)...")
tts = TTS(MODEL_NAME, progress_bar=True)
print(" > Model loaded. Ready for requests.")


def _decode_reference_audio(speaker_wav: str, out_path: str) -> None:
    """Decodes a data-URI (or raw base64) voice sample into a 16-bit mono WAV file."""
    if "," in speaker_wav and speaker_wav.startswith("data:"):
        raw_b64 = speaker_wav.split(",", 1)[1]
    else:
        raw_b64 = speaker_wav
    raw_b64 = raw_b64.strip()
    missing_padding = len(raw_b64) % 4
    if missing_padding:
        raw_b64 += "=" * (4 - missing_padding)
    audio_bytes = base64.b64decode(raw_b64)

    container = av.open(io.BytesIO(audio_bytes))
    stream = next(s for s in container.streams if s.type == "audio")
    resampler = av.AudioResampler(format="s16", layout="mono", rate=24000)

    frames = []
    for packet in container.demux(stream):
        for frame in packet.decode():
            for resampled in resampler.resample(frame):
                frames.append(resampled.to_ndarray())
    container.close()

    if not frames:
        raise ValueError("Reference clip had no decodable audio")

    pcm = np.concatenate(frames, axis=1).reshape(-1).astype(np.int16)
    sf.write(out_path, pcm, samplerate=24000, subtype="PCM_16")


@app.after_request
def add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    return resp


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "model": MODEL_NAME})


@app.route("/tts_stream", methods=["POST", "OPTIONS"])
def tts_stream():
    if request.method == "OPTIONS":
        return Response(status=204)

    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    language = body.get("language") or "en"
    speaker_wav = body.get("speaker_wav")

    if not text:
        return jsonify({"error": "text is required"}), 400
    if not speaker_wav:
        return jsonify({"error": "speaker_wav (reference voice clip) is required for cloning"}), 400
    if language not in SUPPORTED_LANGUAGES:
        language = "en"

    with tempfile.TemporaryDirectory() as tmp_dir:
        ref_path = os.path.join(tmp_dir, "reference.wav")
        out_path = os.path.join(tmp_dir, "output.wav")
        try:
            _decode_reference_audio(speaker_wav, ref_path)
        except Exception as exc:  # noqa: BLE001 - report decode failures clearly to the caller
            traceback.print_exc()
            return jsonify({"error": f"Could not decode reference audio: {exc}"}), 400

        try:
            tts.tts_to_file(text=text, speaker_wav=ref_path, language=language, file_path=out_path)
        except Exception as exc:  # noqa: BLE001 - surface synthesis failures instead of a bare 500
            traceback.print_exc()
            return jsonify({"error": f"Synthesis failed: {exc}"}), 500

        with open(out_path, "rb") as f:
            audio_bytes = f.read()

    return Response(audio_bytes, mimetype="audio/wav")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)
