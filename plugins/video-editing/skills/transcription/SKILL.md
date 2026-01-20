---
name: transcription
description: Audio/video transcription using OpenAI Whisper. Covers installation, model selection, transcript formats (SRT, VTT, JSON), timing synchronization, and speaker diarization. Use when transcribing media or generating subtitles.
---
plugin: video-editing
updated: 2026-01-20

# Transcription with Whisper

Production-ready patterns for audio/video transcription using OpenAI Whisper.

## System Requirements

### Installation Options

**Option 1: OpenAI Whisper (Python)**
```bash
# macOS/Linux/Windows
pip install openai-whisper

# Verify
whisper --help
```

**Option 2: whisper.cpp (C++ - faster)**
```bash
# macOS
brew install whisper-cpp

# Linux - build from source
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp && make

# Windows - use pre-built binaries or build with cmake
```

**Option 3: Insanely Fast Whisper (GPU accelerated)**
```bash
pip install insanely-fast-whisper
```

### Model Selection

| Model | Size | VRAM | Accuracy | Speed | Use Case |
|-------|------|------|----------|-------|----------|
| tiny | 39M | ~1GB | Low | Fastest | Quick previews |
| base | 74M | ~1GB | Medium | Fast | Draft transcripts |
| small | 244M | ~2GB | Good | Medium | General use |
| medium | 769M | ~5GB | Better | Slow | Quality transcripts |
| large-v3 | 1550M | ~10GB | Best | Slowest | Final production |

**Recommendation:** Start with `small` for speed/quality balance. Use `large-v3` for final delivery.

## Basic Transcription

### Using OpenAI Whisper

```bash
# Basic transcription (auto-detect language)
whisper audio.mp3 --model small

# Specify language and output format
whisper audio.mp3 --model medium --language en --output_format srt

# Multiple output formats
whisper audio.mp3 --model small --output_format all

# With timestamps and word-level timing
whisper audio.mp3 --model small --word_timestamps True
```

### Using whisper.cpp

```bash
# Download model first
./models/download-ggml-model.sh base.en

# Transcribe
./main -m models/ggml-base.en.bin -f audio.wav -osrt

# With timestamps
./main -m models/ggml-base.en.bin -f audio.wav -ocsv
```

## Output Formats

### SRT (SubRip Subtitle)
```
1
00:00:01,000 --> 00:00:04,500
Hello and welcome to this video.

2
00:00:05,000 --> 00:00:08,200
Today we'll discuss video editing.
```

### VTT (WebVTT)
```
WEBVTT

00:00:01.000 --> 00:00:04.500
Hello and welcome to this video.

00:00:05.000 --> 00:00:08.200
Today we'll discuss video editing.
```

### JSON (with word-level timing)
```json
{
  "text": "Hello and welcome to this video.",
  "segments": [
    {
      "id": 0,
      "start": 1.0,
      "end": 4.5,
      "text": " Hello and welcome to this video.",
      "words": [
        {"word": "Hello", "start": 1.0, "end": 1.3},
        {"word": "and", "start": 1.4, "end": 1.5},
        {"word": "welcome", "start": 1.6, "end": 2.0},
        {"word": "to", "start": 2.1, "end": 2.2},
        {"word": "this", "start": 2.3, "end": 2.5},
        {"word": "video", "start": 2.6, "end": 3.0}
      ]
    }
  ]
}
```

## Audio Extraction for Transcription

Before transcribing video, extract audio in optimal format:

```bash
# Extract audio as WAV (16kHz, mono - optimal for Whisper)
ffmpeg -i video.mp4 -ar 16000 -ac 1 -c:a pcm_s16le audio.wav

# Extract as high-quality WAV for archival
ffmpeg -i video.mp4 -vn -c:a pcm_s16le audio.wav

# Extract as compressed MP3 (smaller, still works)
ffmpeg -i video.mp4 -vn -c:a libmp3lame -q:a 2 audio.mp3
```

## Timing Synchronization

### Convert Whisper JSON to FCP Timing

```python
import json

def whisper_to_fcp_timing(whisper_json_path, fps=24):
    """Convert Whisper JSON output to FCP-compatible timing."""
    with open(whisper_json_path) as f:
        data = json.load(f)

    segments = []
    for seg in data.get("segments", []):
        segments.append({
            "start_time": seg["start"],
            "end_time": seg["end"],
            "start_frame": int(seg["start"] * fps),
            "end_frame": int(seg["end"] * fps),
            "text": seg["text"].strip(),
            "words": seg.get("words", [])
        })

    return segments
```

### Frame-Accurate Timing

```bash
# Get exact frame count and duration
ffprobe -v error -count_frames -select_streams v:0 \
  -show_entries stream=nb_read_frames,duration,r_frame_rate \
  -of json video.mp4
```

## Speaker Diarization

For multi-speaker content, use pyannote.audio:

```bash
pip install pyannote.audio
```

```python
from pyannote.audio import Pipeline

pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization@2.1")
diarization = pipeline("audio.wav")

for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{turn.start:.1f}s - {turn.end:.1f}s: {speaker}")
```

## Batch Processing

```bash
#!/bin/bash
# Transcribe all videos in directory

MODEL="small"
OUTPUT_DIR="transcripts"
mkdir -p "$OUTPUT_DIR"

for video in *.mp4 *.mov *.avi; do
  [[ -f "$video" ]] || continue

  base="${video%.*}"

  # Extract audio
  ffmpeg -i "$video" -ar 16000 -ac 1 -c:a pcm_s16le "/tmp/${base}.wav" -y

  # Transcribe
  whisper "/tmp/${base}.wav" --model "$MODEL" \
    --output_format all \
    --output_dir "$OUTPUT_DIR"

  # Cleanup temp audio
  rm "/tmp/${base}.wav"

  echo "Transcribed: $video"
done
```

## Quality Optimization

### Improve Accuracy

1. **Noise reduction before transcription:**
```bash
ffmpeg -i noisy_audio.wav -af "highpass=f=200,lowpass=f=3000,afftdn=nf=-25" clean_audio.wav
```

2. **Use language hint:**
```bash
whisper audio.mp3 --language en --model medium
```

3. **Provide initial prompt for context:**
```bash
whisper audio.mp3 --initial_prompt "Technical discussion about video editing software."
```

### Performance Tips

1. **GPU acceleration (if available):**
```bash
whisper audio.mp3 --model large-v3 --device cuda
```

2. **Process in chunks for long videos:**
```python
# Split audio into 10-minute chunks
# Transcribe each chunk
# Merge results with time offset adjustment
```

## Error Handling

```bash
# Validate audio file before transcription
validate_audio() {
  local file="$1"
  if ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 "$file" 2>/dev/null | grep -q "audio"; then
    return 0
  else
    echo "Error: No audio stream found in $file"
    return 1
  fi
}

# Check Whisper installation
check_whisper() {
  if command -v whisper &> /dev/null; then
    echo "Whisper available"
    return 0
  else
    echo "Error: Whisper not installed. Run: pip install openai-whisper"
    return 1
  fi
}
```

## Related Skills

- **ffmpeg-core** - Audio extraction and preprocessing
- **final-cut-pro** - Import transcripts as titles/markers
