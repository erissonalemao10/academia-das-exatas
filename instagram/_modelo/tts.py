"""Narração dos reels com voz neural pt-BR (Piper, via sherpa-onnx). Roda offline.

  python tts.py synth entrada.json saida.json   # sintetiza cada frase (com cache) e devolve as durações
  python tts.py mix   linha.json   audio.wav    # posiciona as frases na linha do tempo e normaliza

Variáveis de ambiente:
  REEL_TTS_DIR  pasta com os modelos (padrão: ~/.cache/reel-tts)
  REEL_VOICE    voz Piper (padrão: cadu → vits-piper-pt_BR-cadu-medium)
  REEL_SPEED    velocidade da fala (padrão: 1.08)
"""
import hashlib, json, os, sys
import numpy as np
import soundfile as sf

TTS_DIR = os.environ.get("REEL_TTS_DIR", os.path.expanduser("~/.cache/reel-tts"))
VOICE = os.environ.get("REEL_VOICE", "cadu")
SPEED = float(os.environ.get("REEL_SPEED", "1.08"))
CACHE = os.path.join(TTS_DIR, "cache")


def engine():
    import sherpa_onnx
    d = os.path.join(TTS_DIR, f"vits-piper-pt_BR-{VOICE}-medium")
    cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        vits=sherpa_onnx.OfflineTtsVitsModelConfig(
            model=os.path.join(d, f"pt_BR-{VOICE}-medium.onnx"),
            tokens=os.path.join(d, "tokens.txt"),
            data_dir=os.path.join(d, "espeak-ng-data")),
        num_threads=4))
    return sherpa_onnx.OfflineTts(cfg)


def trim(a, sr, thr=0.012):
    """Remove silêncio do começo e do fim (o espaçamento é controlado pela linha do tempo)."""
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx):
        return a
    pad = int(0.03 * sr)
    return a[max(0, idx[0] - pad): idx[-1] + pad]


def synth(inp, out):
    sentences = json.load(open(inp))
    os.makedirs(CACHE, exist_ok=True)
    tts, res = None, []
    for s in sentences:
        key = hashlib.sha1(f"{VOICE}|{SPEED}|{s}".encode()).hexdigest()[:16]
        f = os.path.join(CACHE, key + ".wav")
        if not os.path.exists(f):
            tts = tts or engine()
            a = tts.generate(s, sid=0, speed=SPEED)
            samples = trim(np.array(a.samples, dtype=np.float32), a.sample_rate)
            sf.write(f, samples, a.sample_rate)
        info = sf.info(f)
        res.append({"file": f, "dur": info.frames / info.samplerate})
    json.dump(res, open(out, "w"))


def mix(inp, out):
    tl = json.load(open(inp))
    sr = sf.info(tl["clips"][0]["file"]).samplerate
    total = np.zeros(int((tl["total"] + 0.5) * sr), dtype=np.float32)
    for c in tl["clips"]:
        a, _ = sf.read(c["file"], dtype="float32")
        i = int(c["start"] * sr)
        total[i:i + len(a)] += a[: len(total) - i]
    voiced = total[np.abs(total) > 0.01]
    rms = np.sqrt(np.mean(voiced ** 2)) if len(voiced) else 1
    total *= min(10 ** (-16 / 20) / rms, 0.97 / max(np.max(np.abs(total)), 1e-6))
    sf.write(out, total[: int(tl["total"] * sr)], sr)


if __name__ == "__main__":
    {"synth": synth, "mix": mix}[sys.argv[1]](sys.argv[2], sys.argv[3])
