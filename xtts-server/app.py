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

    pcm = np.concatenate(frames, axis=1).reshape(-1).astype(np.float32) / 32768.0

    # 1. Silence Trimming: Trim leading and trailing background room noise
    frame_len = 480
    if len(pcm) > frame_len * 4:
        energy = np.array([np.sqrt(np.mean(pcm[i:i+frame_len]**2)) for i in range(0, len(pcm) - frame_len, frame_len)])
        threshold = max(0.008, float(np.mean(energy)) * 0.25)
        voiced = np.where(energy > threshold)[0]
        if len(voiced) > 0:
            start_idx = max(0, (voiced[0] - 2) * frame_len)
            end_idx = min(len(pcm), (voiced[-1] + 3) * frame_len)
            pcm = pcm[start_idx:end_idx]

    # 2. Optimal Window Selection: XTTS-v2's Perceiver encoder is specifically designed
    # and trained for 3-10 seconds of speech. If a user uploads a long file (e.g. 30s-60s),
    # passing the entire clip smears the speaker latents across multiple sentences and pauses.
    # We automatically select the cleanest, highest-energy 8-second speech window.
    sr = 24000
    target_sec = 8.0
    target_len = int(sr * target_sec)
    if len(pcm) > target_len + int(sr * 1.0):
        step = int(sr * 0.25)
        frame_len_win = int(sr * 0.05)
        best_start = 0
        best_score = -1.0
        for start in range(0, len(pcm) - target_len, step):
            chunk = pcm[start : start + target_len]
            sub_frames = [np.sqrt(np.mean(chunk[i:i+frame_len_win]**2)) for i in range(0, len(chunk) - frame_len_win, frame_len_win)]
            avg_energy = float(np.mean(sub_frames))
            active_ratio = float(np.sum(np.array(sub_frames) > 0.02) / max(1, len(sub_frames)))
            score = avg_energy * (active_ratio ** 2)
            if score > best_score:
                best_score = score
                best_start = start
        pcm = pcm[best_start : best_start + target_len]
        print(f" > Extracted optimal 8s speech window for XTTS (offset: {round(best_start/sr, 2)}s)")

    # 3. Peak normalize to 0.92 (-0.7 dB) to maximize signal clarity without clipping
    max_amp = float(np.max(np.abs(pcm)))
    if max_amp > 1e-4:
        pcm = (pcm / max_amp) * 0.92

    clean_pcm = (pcm * 32767.0).astype(np.int16)
    sf.write(out_path, clean_pcm, samplerate=24000, subtype="PCM_16")


@app.after_request
def add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    return resp


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "Sahaaya XTTS-v2 Voice Cloning Server",
        "status": "online",
        "model": MODEL_NAME,
        "endpoints": {
            "GET /": "Server status",
            "GET /health": "Health check",
            "POST /tts_stream": "Zero-shot voice cloning API",
        },
    })


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
            tts.tts_to_file(
                text=text,
                speaker_wav=ref_path,
                language=language,
                file_path=out_path,
                temperature=0.75,
                repetition_penalty=2.0,
            )
        except Exception as exc:  # noqa: BLE001 - surface synthesis failures instead of a bare 500
            traceback.print_exc()
            return jsonify({"error": f"Synthesis failed: {exc}"}), 500

        with open(out_path, "rb") as f:
            audio_bytes = f.read()

    return Response(audio_bytes, mimetype="audio/wav")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)
