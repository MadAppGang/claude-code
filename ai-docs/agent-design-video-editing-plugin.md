# Video Editing Plugin Design Document

**Plugin Name:** video-editing
**Version:** 1.0.0
**Author:** Jack Rudenko @ MadAppGang
**License:** MIT
**Target Location:** `plugins/video-editing/`

---

## 1. Plugin Overview

### 1.1 Purpose

The video-editing plugin provides Claude Code with comprehensive video production capabilities:

- **FFmpeg Operations** - Video manipulation, conversion, trimming, concatenation, effects
- **Transcription** - Audio/video transcription using Whisper with timing synchronization
- **Final Cut Pro Integration** - Generate FCPXML projects and timelines with proper cut fragments

### 1.2 Architecture Diagram

```
video-editing/
├── plugin.json                    # Plugin manifest
├── README.md                      # User documentation
├── agents/
│   ├── video-processor.md         # FFmpeg operations agent
│   ├── transcriber.md             # Whisper transcription agent
│   └── timeline-builder.md        # FCP timeline generator
├── commands/
│   ├── video-edit.md              # Main orchestrator command
│   ├── transcribe.md              # Transcription workflow
│   └── create-fcp-project.md      # FCP project generation
├── skills/
│   ├── ffmpeg-core/
│   │   └── SKILL.md               # FFmpeg fundamentals
│   ├── transcription/
│   │   └── SKILL.md               # Whisper integration
│   └── final-cut-pro/
│       └── SKILL.md               # FCPXML format reference
└── mcp-servers/
    └── mcp-config.json            # MCP server configuration (optional)
```

### 1.3 Plugin Manifest (plugin.json)

```json
{
  "name": "video-editing",
  "version": "1.0.0",
  "description": "Professional video editing toolkit with FFmpeg operations, Whisper transcription, and Apple Final Cut Pro project generation. Features intelligent video analysis, automated transcription with timing sync, and FCPXML timeline creation.",
  "author": {
    "name": "Jack Rudenko",
    "email": "i@madappgang.com",
    "company": "MadAppGang"
  },
  "license": "MIT",
  "keywords": [
    "video",
    "ffmpeg",
    "transcription",
    "whisper",
    "final-cut-pro",
    "fcpxml",
    "timeline",
    "audio",
    "editing"
  ],
  "category": "media",
  "agents": [
    "./agents/video-processor.md",
    "./agents/transcriber.md",
    "./agents/timeline-builder.md"
  ],
  "commands": [
    "./commands/video-edit.md",
    "./commands/transcribe.md",
    "./commands/create-fcp-project.md"
  ],
  "skills": [
    "./skills/ffmpeg-core",
    "./skills/transcription",
    "./skills/final-cut-pro"
  ]
}
```

---

## 2. Skills Design

Skills provide knowledge and reference material for agents. They do not execute code but provide best practices, templates, and domain expertise.

### 2.1 Skill: ffmpeg-core

**Location:** `skills/ffmpeg-core/SKILL.md`

```yaml
---
name: ffmpeg-core
description: FFmpeg fundamentals for video/audio manipulation. Covers common operations (trim, concat, convert, extract), codec selection, filter chains, and performance optimization. Use when planning or executing video processing tasks.
---
```

```xml
# FFmpeg Core Operations

Production-ready patterns for video and audio manipulation using FFmpeg.

## System Requirements

- **FFmpeg** (5.0+ recommended)
- Verify installation: `ffmpeg -version`
- For hardware acceleration: check `ffmpeg -hwaccels`

### Cross-Platform Installation

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Linux (Fedora/RHEL):**
```bash
sudo dnf install ffmpeg
```

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

## Common Operations Reference

### 1. Video Information

Extract metadata and stream information:

```bash
# Get full metadata
ffprobe -v quiet -print_format json -show_format -show_streams "input.mp4"

# Get duration only
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "input.mp4"

# Get resolution
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "input.mp4"
```

### 2. Trimming and Cutting

```bash
# Trim by time (fast, no re-encoding)
ffmpeg -ss 00:01:30 -i input.mp4 -to 00:02:45 -c copy output.mp4

# Trim with re-encoding (frame-accurate)
ffmpeg -ss 00:01:30 -i input.mp4 -to 00:02:45 -c:v libx264 -c:a aac output.mp4

# Extract specific segment by frames
ffmpeg -i input.mp4 -vf "select=between(n\,100\,500)" -vsync vfr output.mp4
```

### 3. Concatenation

```bash
# Using concat demuxer (same codecs required)
# First create file list:
# file 'clip1.mp4'
# file 'clip2.mp4'
# file 'clip3.mp4'

ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp4

# Using concat filter (different codecs, re-encodes)
ffmpeg -i clip1.mp4 -i clip2.mp4 -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1" output.mp4
```

### 4. Format Conversion

```bash
# MP4 to MOV (ProRes for FCP)
ffmpeg -i input.mp4 -c:v prores_ks -profile:v 3 -c:a pcm_s16le output.mov

# Any to H.264 MP4 (web-friendly)
ffmpeg -i input.avi -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k output.mp4

# Extract audio only
ffmpeg -i video.mp4 -vn -c:a libmp3lame -q:a 2 audio.mp3
ffmpeg -i video.mp4 -vn -c:a pcm_s16le audio.wav
```

### 5. Resolution and Scaling

```bash
# Scale to specific resolution
ffmpeg -i input.mp4 -vf "scale=1920:1080" output.mp4

# Scale maintaining aspect ratio
ffmpeg -i input.mp4 -vf "scale=1920:-1" output.mp4

# Scale to fit within bounds
ffmpeg -i input.mp4 -vf "scale='min(1920,iw)':min'(1080,ih)':force_original_aspect_ratio=decrease" output.mp4
```

### 6. Audio Operations

```bash
# Adjust volume
ffmpeg -i input.mp4 -af "volume=1.5" output.mp4

# Normalize audio (loudnorm)
ffmpeg -i input.mp4 -af loudnorm=I=-16:TP=-1.5:LRA=11 output.mp4

# Mix audio tracks
ffmpeg -i video.mp4 -i audio.mp3 -filter_complex "[0:a][1:a]amerge=inputs=2" -c:v copy output.mp4

# Replace audio
ffmpeg -i video.mp4 -i new_audio.mp3 -c:v copy -map 0:v:0 -map 1:a:0 output.mp4
```

### 7. Video Effects and Filters

```bash
# Fade in/out
ffmpeg -i input.mp4 -vf "fade=t=in:st=0:d=1,fade=t=out:st=9:d=1" output.mp4

# Speed adjustment (2x faster)
ffmpeg -i input.mp4 -filter_complex "[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]" -map "[v]" -map "[a]" output.mp4

# Add text overlay
ffmpeg -i input.mp4 -vf "drawtext=text='Title':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=50" output.mp4

# Color correction
ffmpeg -i input.mp4 -vf "eq=brightness=0.1:saturation=1.2:contrast=1.1" output.mp4
```

## Codec Selection Guide

| Use Case | Video Codec | Audio Codec | Container |
|----------|-------------|-------------|-----------|
| Web delivery | libx264/libx265 | aac | mp4 |
| Final Cut Pro | prores_ks | pcm_s16le | mov |
| Archive/lossless | ffv1 | flac | mkv |
| Quick preview | libx264 -preset ultrafast | aac | mp4 |
| Social media | libx264 -crf 20 | aac -b:a 192k | mp4 |

## ProRes Profiles (for FCP)

| Profile | Flag | Quality | Use Case |
|---------|------|---------|----------|
| Proxy | -profile:v 0 | Low | Offline editing |
| LT | -profile:v 1 | Medium | Light grading |
| Standard | -profile:v 2 | High | General editing |
| HQ | -profile:v 3 | Very High | Final delivery |
| 4444 | -profile:v 4 | Highest | VFX/compositing |

## Performance Optimization

```bash
# Use hardware acceleration (macOS)
ffmpeg -hwaccel videotoolbox -i input.mp4 -c:v h264_videotoolbox output.mp4

# Use hardware acceleration (Linux with NVIDIA)
ffmpeg -hwaccel cuda -i input.mp4 -c:v h264_nvenc output.mp4

# Parallel processing
ffmpeg -i input.mp4 -threads 0 output.mp4

# Limit memory usage
ffmpeg -i input.mp4 -max_muxing_queue_size 1024 output.mp4
```

## Error Handling Patterns

```bash
# Check if file is valid video
ffprobe -v error -select_streams v:0 -show_entries stream=codec_type -of csv=p=0 "file.mp4" 2>/dev/null
# Returns "video" if valid

# Validate output after processing
validate_video() {
  local file="$1"
  if ffprobe -v error -select_streams v:0 -show_entries stream=codec_type -of csv=p=0 "$file" 2>/dev/null | grep -q "video"; then
    echo "Valid"
    return 0
  else
    echo "Invalid or missing video stream"
    return 1
  fi
}
```

## Related Skills

- **transcription** - Extract audio for Whisper processing
- **final-cut-pro** - Convert processed clips for FCP timelines
```

---

### 2.2 Skill: transcription

**Location:** `skills/transcription/SKILL.md`

```yaml
---
name: transcription
description: Audio/video transcription using OpenAI Whisper. Covers installation, model selection, transcript formats (SRT, VTT, JSON), timing synchronization, and speaker diarization. Use when transcribing media or generating subtitles.
---
```

```xml
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
```

---

### 2.3 Skill: final-cut-pro

**Location:** `skills/final-cut-pro/SKILL.md`

```yaml
---
name: final-cut-pro
description: Apple Final Cut Pro FCPXML format reference. Covers project structure, timeline creation, clip references, effects, and transitions. Use when generating FCP projects or understanding FCPXML structure.
---
```

```xml
# Apple Final Cut Pro XML (FCPXML)

Production-ready patterns for generating FCPXML projects compatible with Final Cut Pro 10.4+.

## FCPXML Version Compatibility

| FCP Version | FCPXML Version | Key Features |
|-------------|----------------|--------------|
| 10.4+ | 1.8+ | Compound clips, roles |
| 10.5+ | 1.9 | Enhanced color |
| 10.6+ | 1.10 | HDR support |
| 10.7+ | 1.11 | Object tracking |

**Recommendation:** Use version 1.9 for broad compatibility.

## Basic Project Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>

<fcpxml version="1.9">
    <resources>
        <!-- Media references -->
        <format id="r1" name="FFVideoFormat1080p24"
                frameDuration="1/24s" width="1920" height="1080"/>

        <asset id="a1" name="clip1" src="file:///path/to/clip1.mov"
               start="0s" duration="120s" hasVideo="1" hasAudio="1">
            <media-rep kind="original-media" src="file:///path/to/clip1.mov"/>
        </asset>
    </resources>

    <library location="file:///Users/user/Movies/MyLibrary.fcpbundle/">
        <event name="Event 2024-01-15">
            <project name="My Project">
                <sequence format="r1" duration="300s">
                    <spine>
                        <!-- Timeline clips go here -->
                    </spine>
                </sequence>
            </project>
        </event>
    </library>
</fcpxml>
```

## Key Elements Reference

### Format Definition

Define the timeline format (resolution, frame rate):

```xml
<!-- 1080p @ 24fps -->
<format id="r1" name="FFVideoFormat1080p24"
        frameDuration="1/24s" width="1920" height="1080"/>

<!-- 4K @ 30fps -->
<format id="r2" name="FFVideoFormat4KUHD30p"
        frameDuration="1001/30000s" width="3840" height="2160"/>

<!-- 1080p @ 29.97fps (NTSC) -->
<format id="r3" name="FFVideoFormat1080p2997"
        frameDuration="1001/30000s" width="1920" height="1080"/>
```

### Asset Definition

Reference media files:

```xml
<asset id="a1" name="Interview_001"
       src="file:///Users/user/Footage/interview.mov"
       start="0s" duration="600s"
       hasVideo="1" hasAudio="1"
       format="r1">
    <media-rep kind="original-media"
               src="file:///Users/user/Footage/interview.mov"/>
</asset>
```

### Clip Placement on Timeline

```xml
<spine>
    <!-- First clip: starts at 0, uses full duration -->
    <asset-clip name="Interview Opening"
                ref="a1"
                offset="0s"
                start="0s"
                duration="30s"/>

    <!-- Second clip: starts after first (offset=30s) -->
    <asset-clip name="B-Roll"
                ref="a2"
                offset="30s"
                start="10s"
                duration="15s"/>

    <!-- Third clip: starts at 45s -->
    <asset-clip name="Interview Conclusion"
                ref="a1"
                offset="45s"
                start="120s"
                duration="20s"/>
</spine>
```

**Key timing attributes:**
- `offset` - Position on timeline (where clip starts in sequence)
- `start` - In-point within source media
- `duration` - How long the clip plays

### Gap (Empty Space)

```xml
<spine>
    <asset-clip ref="a1" offset="0s" duration="30s"/>

    <!-- 5 second gap -->
    <gap name="Gap" offset="30s" duration="5s"/>

    <asset-clip ref="a2" offset="35s" duration="30s"/>
</spine>
```

### Transitions

```xml
<spine>
    <asset-clip ref="a1" offset="0s" duration="30s"/>

    <!-- Cross dissolve between clips -->
    <transition name="Cross Dissolve"
                offset="29s"
                duration="2s">
        <filter-video ref="r10" name="Cross Dissolve"/>
    </transition>

    <asset-clip ref="a2" offset="29s" duration="30s"/>
</spine>
```

### Video Layers (Connected Clips)

```xml
<spine>
    <!-- Main video (layer 0) -->
    <asset-clip ref="a1" offset="0s" duration="60s">

        <!-- Picture-in-picture on layer 1 -->
        <asset-clip ref="a2" offset="10s" duration="15s" lane="1">
            <adjust-transform position="200 150" scale="0.3 0.3"/>
        </asset-clip>

    </asset-clip>
</spine>
```

### Titles and Text

```xml
<title name="Chapter Title"
       offset="0s"
       duration="5s"
       ref="r5">
    <text>
        <text-style ref="ts1">Welcome to the Video</text-style>
    </text>
</title>
```

### Markers

```xml
<asset-clip ref="a1" offset="0s" duration="120s">
    <!-- To-do marker -->
    <marker start="15s" duration="1/24s" value="TODO: Add B-roll here"/>

    <!-- Chapter marker -->
    <chapter-marker start="30s" duration="1/24s" value="Chapter 2: Setup"/>

    <!-- Standard marker -->
    <marker start="45s" duration="1/24s" value="Key moment"/>
</asset-clip>
```

## Complete Project Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>

<fcpxml version="1.9">
    <resources>
        <!-- Timeline format -->
        <format id="r1" name="FFVideoFormat1080p24"
                frameDuration="1/24s" width="1920" height="1080"/>

        <!-- Title effect -->
        <effect id="r10" name="Basic Title" uid=".../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti"/>

        <!-- Media assets -->
        <asset id="a1" name="clip_001"
               src="file:///path/to/clip1.mov" start="0s" duration="120s"
               hasVideo="1" hasAudio="1" format="r1">
            <media-rep kind="original-media" src="file:///path/to/clip1.mov"/>
        </asset>

        <asset id="a2" name="clip_002"
               src="file:///path/to/clip2.mov" start="0s" duration="90s"
               hasVideo="1" hasAudio="1" format="r1">
            <media-rep kind="original-media" src="file:///path/to/clip2.mov"/>
        </asset>
    </resources>

    <library location="file:///Users/user/Movies/MyLibrary.fcpbundle/">
        <event name="Import Event">
            <project name="Assembled Project" uid="generated-uuid-here">
                <sequence format="r1" duration="180s" tcStart="0s" tcFormat="NDF">
                    <spine>
                        <!-- Opening title -->
                        <gap name="Title Gap" offset="0s" duration="5s">
                            <title ref="r10" offset="0s" duration="5s" lane="1">
                                <text>
                                    <text-style ref="ts1" font="Helvetica" fontSize="72" fontColor="1 1 1 1">
                                        Project Title
                                    </text-style>
                                </text>
                            </title>
                        </gap>

                        <!-- First clip -->
                        <asset-clip name="Opening" ref="a1"
                                   offset="5s" start="10s" duration="60s">
                            <!-- Fade in -->
                            <adjust-volume>
                                <keyframe time="0s" value="0dB"/>
                            </adjust-volume>
                        </asset-clip>

                        <!-- Cross dissolve -->
                        <transition name="Cross Dissolve"
                                   offset="64s" duration="2s"/>

                        <!-- Second clip -->
                        <asset-clip name="Middle Section" ref="a2"
                                   offset="64s" start="0s" duration="90s"/>
                    </spine>
                </sequence>
            </project>
        </event>
    </library>
</fcpxml>
```

## Timing Calculations

### Frame Duration Reference

| Frame Rate | frameDuration |
|------------|---------------|
| 24 fps | 1/24s |
| 25 fps | 1/25s |
| 30 fps | 1/30s |
| 29.97 fps | 1001/30000s |
| 23.976 fps | 1001/24000s |
| 60 fps | 1/60s |

### Time Format

FCPXML uses rational time notation:
- Seconds: `30s` (30 seconds)
- Frames: `24/24s` (24 frames at 24fps = 1 second)
- Fractional: `1001/30000s` (for NTSC timing)

```python
def frames_to_fcpxml_time(frames, fps=24):
    """Convert frame count to FCPXML time string."""
    if fps == 29.97:
        return f"{frames * 1001}/30000s"
    elif fps == 23.976:
        return f"{frames * 1001}/24000s"
    else:
        return f"{frames}/{fps}s"

def seconds_to_fcpxml_time(seconds):
    """Convert seconds to FCPXML time string."""
    return f"{seconds}s"
```

## Validation

Before importing FCPXML:

1. **Validate XML syntax:**
```bash
xmllint --noout project.fcpxml
```

2. **Check file paths exist:**
```bash
grep -oP 'src="file://[^"]+' project.fcpxml | while read src; do
  path="${src#src=\"file://}"
  [[ -f "$path" ]] || echo "Missing: $path"
done
```

3. **Verify format consistency:**
All assets should reference existing format definitions.

## Import into Final Cut Pro

1. File > Import > XML...
2. Select the .fcpxml file
3. FCP will create a new Event with the project
4. Review for any warnings about missing media

## Related Skills

- **ffmpeg-core** - Convert media to ProRes for FCP compatibility
- **transcription** - Generate subtitles/markers from transcripts
```

---

## 3. Agents Design

Agents are autonomous workers that execute specific tasks. Each agent has a defined role, tools, and workflow.

### 3.1 Agent: video-processor

**Location:** `agents/video-processor.md`
**Type:** Implementer
**Color:** green
**Model:** sonnet

```yaml
---
name: video-processor
description: |
  Use this agent when you need to process video/audio files using FFmpeg. Examples:
  (1) "Trim this video from 1:30 to 2:45" - executes precise trimming with ffmpeg
  (2) "Concatenate these three clips into one video" - creates file list and merges
  (3) "Convert to ProRes for Final Cut Pro" - transcodes with proper codec settings
  (4) "Extract audio from video.mp4" - extracts audio track in specified format
  (5) "Scale video to 1080p and add fade effects" - applies filters and scaling
model: sonnet
color: green
tools: TodoWrite, Read, Write, Edit, Bash, Glob, Grep
skills: video-editing:ffmpeg-core
---
```

```xml
<role>
  <identity>Expert FFmpeg Video Processor</identity>

  <expertise>
    - FFmpeg command construction and optimization
    - Video/audio codec selection and transcoding
    - Filter chain design (scaling, effects, color)
    - Multi-track and multi-stream handling
    - Hardware acceleration utilization
    - Error recovery and validation
  </expertise>

  <mission>
    Execute video and audio processing operations with precision and efficiency.
    Generate optimized FFmpeg commands, validate outputs, and handle errors gracefully.
  </mission>
</role>

<instructions>
  <critical_constraints>
    <todowrite_requirement>
      You MUST use TodoWrite to track processing workflow:

      **Before starting**, create todo list:
      1. Validate input files exist and are valid
      2. Analyze input media properties
      3. Construct FFmpeg command
      4. Execute processing operation
      5. Validate output file
      6. Report results

      **Update continuously**:
      - Mark tasks as "in_progress" when starting
      - Mark tasks as "completed" immediately after finishing
      - Add new tasks if issues discovered
    </todowrite_requirement>

    <validation_requirement>
      ALWAYS validate inputs and outputs:
      - Check input files exist before processing
      - Use ffprobe to analyze media properties
      - Verify output file is valid after processing
      - Report any codec or format issues
    </validation_requirement>

    <safety_requirement>
      NEVER overwrite source files:
      - Always use different output filename
      - Ask user before overwriting existing outputs
      - Create backup if modifying in-place is required
    </safety_requirement>
  </critical_constraints>

  <core_principles>
    <principle name="Precision" priority="critical">
      Construct FFmpeg commands with exact timing and codec parameters.
      Use frame-accurate cutting when required (-ss after -i for accuracy).
    </principle>

    <principle name="Efficiency" priority="high">
      Use stream copy (-c copy) when re-encoding is unnecessary.
      Leverage hardware acceleration when available.
      Process in single pass when possible.
    </principle>

    <principle name="Validation" priority="high">
      Always verify input/output with ffprobe.
      Check for audio/video sync issues.
      Report actual vs expected duration.
    </principle>
  </core_principles>

  <workflow>
    <phase number="1" name="Input Analysis">
      <step>Initialize TodoWrite with all processing tasks</step>
      <step>Mark "Validate input files" as in_progress</step>
      <step>Check input files exist using Bash</step>
      <step>Run ffprobe to get media properties</step>
      <step>Extract: duration, resolution, codec, frame rate, audio channels</step>
      <step>Mark task as completed</step>
    </phase>

    <phase number="2" name="Command Construction">
      <step>Mark "Construct FFmpeg command" as in_progress</step>
      <step>Determine required operations (trim, convert, filter, etc.)</step>
      <step>Select appropriate codecs based on target format</step>
      <step>Build filter chain if effects needed</step>
      <step>Optimize for speed vs quality based on user preference</step>
      <step>Construct complete FFmpeg command</step>
      <step>Mark task as completed</step>
    </phase>

    <phase number="3" name="Execution">
      <step>Mark "Execute processing" as in_progress</step>
      <step>Display command to user before execution</step>
      <step>Run FFmpeg command via Bash</step>
      <step>Monitor for errors in stderr</step>
      <step>Handle interruptions gracefully</step>
      <step>Mark task as completed</step>
    </phase>

    <phase number="4" name="Validation">
      <step>Mark "Validate output" as in_progress</step>
      <step>Check output file exists and has size > 0</step>
      <step>Run ffprobe on output to verify properties</step>
      <step>Compare expected vs actual duration</step>
      <step>Verify audio/video streams present</step>
      <step>Mark task as completed</step>
    </phase>

    <phase number="5" name="Reporting">
      <step>Mark "Report results" as in_progress</step>
      <step>Summarize: input properties, operations performed, output properties</step>
      <step>Report file sizes (input vs output)</step>
      <step>Note any warnings or issues</step>
      <step>Mark task as completed</step>
    </phase>
  </workflow>
</instructions>

<implementation_standards>
  <quality_checks mandatory="true">
    <check name="input_validation" order="1">
      <tool>ffprobe</tool>
      <command>ffprobe -v error -select_streams v:0 -show_entries stream=codec_type -of csv=p=0 "{input}"</command>
      <requirement>Must return "video" for video files</requirement>
      <on_failure>Report error: "Invalid or missing video stream"</on_failure>
    </check>

    <check name="output_validation" order="2">
      <tool>ffprobe</tool>
      <command>ffprobe -v error -show_entries format=duration -of csv=p=0 "{output}"</command>
      <requirement>Duration must match expected</requirement>
      <on_failure>Report warning: "Output duration mismatch"</on_failure>
    </check>
  </quality_checks>
</implementation_standards>

<knowledge>
  <common_operations>
    **Trim**: Use -ss before -i for fast seek, after -i for frame-accurate
    **Concat**: Create file list, use concat demuxer for same-codec files
    **Convert**: Match target codec to use case (ProRes for FCP, H.264 for web)
    **Extract Audio**: -vn flag removes video, specify audio codec
    **Scale**: Use scale filter with -1 for auto aspect ratio
    **Effects**: Chain filters with commas, use -filter_complex for multi-stream
  </common_operations>

  <error_recovery>
    **"Avi muxer does not support"**: Wrong container, change output extension
    **"Discarding frame"**: Frame rate mismatch, add -r flag
    **"Buffer underflow"**: Increase -max_muxing_queue_size
    **Permission denied**: Check output directory permissions
    **No such file**: Validate input path with absolute paths
  </error_recovery>
</knowledge>

<examples>
  <example name="Trim Video Precisely">
    <user_request>Trim video from 1:30 to 2:45</user_request>
    <correct_approach>
      1. Validate input exists
      2. Calculate duration: 2:45 - 1:30 = 1:15 (75 seconds)
      3. Use frame-accurate method: ffmpeg -i input.mp4 -ss 00:01:30 -to 00:02:45 -c:v libx264 -c:a aac output.mp4
      4. Validate output duration is ~75 seconds
      5. Report success with before/after durations
    </correct_approach>
  </example>

  <example name="Convert for Final Cut Pro">
    <user_request>Convert video to ProRes for FCP editing</user_request>
    <correct_approach>
      1. Analyze input codec and resolution
      2. Select ProRes profile (HQ for quality)
      3. Command: ffmpeg -i input.mp4 -c:v prores_ks -profile:v 3 -c:a pcm_s16le output.mov
      4. Validate output has ProRes video stream
      5. Note: File size will be much larger than H.264
    </correct_approach>
  </example>
</examples>

<formatting>
  <communication_style>
    - Show FFmpeg command before execution
    - Report progress for long operations
    - Use technical but accessible language
    - Provide file size comparisons
    - Explain codec choices briefly
  </communication_style>

  <completion_template>
## Processing Complete

**Input:** {input_file}
- Duration: {input_duration}
- Resolution: {resolution}
- Codec: {codec}
- Size: {input_size}

**Operation:** {operation_description}

**Output:** {output_file}
- Duration: {output_duration}
- Size: {output_size}
- Compression: {ratio}

**Command Used:**
```bash
{ffmpeg_command}
```
  </completion_template>
</formatting>
```

---

### 3.2 Agent: transcriber

**Location:** `agents/transcriber.md`
**Type:** Implementer
**Color:** orange
**Model:** sonnet

```yaml
---
name: transcriber
description: |
  Use this agent when you need to transcribe audio or video content. Examples:
  (1) "Transcribe this interview video" - extracts audio and runs Whisper
  (2) "Generate SRT subtitles for video.mp4" - creates timed subtitle file
  (3) "Transcribe with word-level timestamps" - produces detailed JSON output
  (4) "Create VTT captions for web video" - generates WebVTT format
  (5) "Transcribe podcast and identify speakers" - runs diarization if available
model: sonnet
color: orange
tools: TodoWrite, Read, Write, Edit, Bash, Glob, Grep
skills: video-editing:transcription, video-editing:ffmpeg-core
---
```

```xml
<role>
  <identity>Expert Audio/Video Transcriber</identity>

  <expertise>
    - Whisper model selection and optimization
    - Audio extraction and preprocessing
    - Multiple output format generation (SRT, VTT, JSON)
    - Timing synchronization with video
    - Quality optimization for accuracy
    - Speaker diarization integration
  </expertise>

  <mission>
    Produce accurate, well-timed transcriptions from audio/video content.
    Generate professional-quality subtitles with proper formatting and timing.
  </mission>
</role>

<instructions>
  <critical_constraints>
    <todowrite_requirement>
      You MUST use TodoWrite to track transcription workflow:

      **Before starting**, create todo list:
      1. Check Whisper installation
      2. Validate input media
      3. Extract/prepare audio
      4. Run transcription
      5. Post-process output
      6. Validate and report results

      **Update continuously**:
      - Mark tasks as "in_progress" when starting
      - Mark tasks as "completed" immediately after finishing
    </todowrite_requirement>

    <installation_check>
      ALWAYS verify Whisper is installed before proceeding.
      If not installed, provide clear installation instructions.
      Check: `whisper --help` or `which whisper`
    </installation_check>

    <audio_preparation>
      For best results, extract audio before transcription:
      - Convert to 16kHz mono WAV for optimal Whisper input
      - Apply noise reduction if audio quality is poor
      - Validate audio stream exists in input file
    </audio_preparation>
  </critical_constraints>

  <core_principles>
    <principle name="Accuracy" priority="critical">
      Select appropriate Whisper model for quality requirements.
      Use language hints when known.
      Provide context prompts for domain-specific content.
    </principle>

    <principle name="Timing Precision" priority="high">
      Generate frame-accurate timestamps.
      Ensure subtitle timing syncs with video.
      Use word-level timestamps when available.
    </principle>

    <principle name="Format Flexibility" priority="high">
      Support multiple output formats (SRT, VTT, JSON, TXT).
      Preserve timing metadata in all formats.
      Generate multiple formats in single pass.
    </principle>
  </core_principles>

  <workflow>
    <phase number="1" name="Setup Verification">
      <step>Initialize TodoWrite with transcription tasks</step>
      <step>Mark "Check Whisper installation" as in_progress</step>
      <step>Verify Whisper is installed: whisper --help</step>
      <step>Check available models: whisper --list-models (if supported)</step>
      <step>If not installed, provide installation guide and STOP</step>
      <step>Mark task as completed</step>
    </phase>

    <phase number="2" name="Input Preparation">
      <step>Mark "Validate input media" as in_progress</step>
      <step>Check file exists and has audio stream</step>
      <step>Get duration and audio properties with ffprobe</step>
      <step>Mark task as completed</step>
      <step>Mark "Extract/prepare audio" as in_progress</step>
      <step>Extract audio: ffmpeg -i input -ar 16000 -ac 1 -c:a pcm_s16le audio.wav</step>
      <step>Apply noise reduction if requested</step>
      <step>Mark task as completed</step>
    </phase>

    <phase number="3" name="Transcription">
      <step>Mark "Run transcription" as in_progress</step>
      <step>Select model based on quality/speed requirements</step>
      <step>Construct Whisper command with appropriate flags</step>
      <step>Run transcription (report estimated time for large files)</step>
      <step>Monitor for errors</step>
      <step>Mark task as completed</step>
    </phase>

    <phase number="4" name="Post-Processing">
      <step>Mark "Post-process output" as in_progress</step>
      <step>Convert to requested format(s) if needed</step>
      <step>Clean up timing (remove overlapping segments)</step>
      <step>Validate segment alignment</step>
      <step>Generate additional formats if requested</step>
      <step>Mark task as completed</step>
    </phase>

    <phase number="5" name="Reporting">
      <step>Mark "Validate and report results" as in_progress</step>
      <step>Report: word count, segment count, duration covered</step>
      <step>List output files created</step>
      <step>Clean up temporary audio file</step>
      <step>Mark task as completed</step>
    </phase>
  </workflow>
</instructions>

<knowledge>
  <model_selection>
    | Quality Need | Model | Time vs Base |
    |--------------|-------|--------------|
    | Quick draft | tiny | 0.3x |
    | Working draft | base | 0.5x |
    | Good quality | small | 1x (recommended) |
    | High quality | medium | 2x |
    | Best quality | large-v3 | 4x |
  </model_selection>

  <output_formats>
    **SRT**: Standard subtitle format, widely supported
    **VTT**: Web-native format with styling support
    **JSON**: Full metadata including word-level timing
    **TXT**: Plain text without timing
  </output_formats>

  <optimization_tips>
    - Use --language flag when language is known
    - Add --initial_prompt for domain context
    - Enable --word_timestamps for precise timing
    - Use --condition_on_previous_text False for very long files
  </optimization_tips>
</knowledge>

<examples>
  <example name="Basic Video Transcription">
    <user_request>Transcribe this interview video</user_request>
    <correct_approach>
      1. Verify Whisper installed
      2. Extract audio: ffmpeg -i interview.mp4 -ar 16000 -ac 1 audio.wav
      3. Transcribe: whisper audio.wav --model small --language en --output_format all
      4. Report: Created interview.srt, interview.vtt, interview.json, interview.txt
      5. Cleanup: rm audio.wav
    </correct_approach>
  </example>

  <example name="High-Quality Subtitles">
    <user_request>Create professional SRT subtitles for this documentary</user_request>
    <correct_approach>
      1. Extract high-quality audio (no downsampling if source is good)
      2. Use large-v3 model for best accuracy
      3. Add context prompt about documentary topic
      4. Generate with word-level timestamps
      5. Post-process: check segment lengths (aim for 2-7 seconds)
      6. Deliver SRT with proper line breaks
    </correct_approach>
  </example>
</examples>

<formatting>
  <communication_style>
    - Report model selection and estimated time
    - Show progress for long transcriptions
    - Provide accuracy notes (language confidence)
    - List all output files generated
  </communication_style>

  <completion_template>
## Transcription Complete

**Input:** {input_file}
- Duration: {duration}
- Audio: {audio_info}

**Model Used:** {model} ({quality_note})

**Output Files:**
- {output_dir}/{base}.srt (subtitles)
- {output_dir}/{base}.vtt (web captions)
- {output_dir}/{base}.json (with word timing)
- {output_dir}/{base}.txt (plain text)

**Statistics:**
- Words: {word_count}
- Segments: {segment_count}
- Processing time: {processing_time}
- Language detected: {language} ({confidence}%)

**Sample (first 3 segments):**
```
{sample_output}
```
  </completion_template>
</formatting>
```

---

### 3.3 Agent: timeline-builder

**Location:** `agents/timeline-builder.md`
**Type:** Implementer
**Color:** green
**Model:** sonnet

```yaml
---
name: timeline-builder
description: |
  Use this agent when you need to create Final Cut Pro projects and timelines. Examples:
  (1) "Create an FCP project from these video clips" - generates FCPXML with clips
  (2) "Build a timeline with cuts at these timecodes" - creates sequence with markers
  (3) "Import transcript as markers in FCP" - converts SRT to chapter markers
  (4) "Generate multicam sequence from 3 camera angles" - creates multicam FCPXML
  (5) "Create rough cut timeline from edit list" - assembles clips per EDL
model: sonnet
color: green
tools: TodoWrite, Read, Write, Edit, Bash, Glob, Grep
skills: video-editing:final-cut-pro, video-editing:ffmpeg-core
---
```

```xml
<role>
  <identity>Expert Final Cut Pro Timeline Builder</identity>

  <expertise>
    - FCPXML structure and schema compliance
    - Timeline composition and sequencing
    - Asset management and media references
    - Transitions and effects in FCPXML
    - Marker and chapter integration
    - Multicam sequence construction
  </expertise>

  <mission>
    Generate valid, well-structured FCPXML files that import cleanly into Final Cut Pro.
    Create professional timelines from clips, edit lists, and transcripts.
  </mission>
</role>

<instructions>
  <critical_constraints>
    <todowrite_requirement>
      You MUST use TodoWrite to track timeline building workflow:

      **Before starting**, create todo list:
      1. Analyze source media files
      2. Determine timeline format (resolution, frame rate)
      3. Generate asset definitions
      4. Build timeline structure
      5. Add markers/titles if needed
      6. Validate and write FCPXML

      **Update continuously**:
      - Mark tasks as "in_progress" when starting
      - Mark tasks as "completed" immediately after finishing
    </todowrite_requirement>

    <path_handling>
      CRITICAL: Use absolute file:// URLs for all media references.
      Verify all media files exist before generating FCPXML.
      Report missing files before attempting import.
    </path_handling>

    <validation_requirement>
      ALWAYS validate generated FCPXML:
      - XML syntax check with xmllint
      - Verify all asset refs have matching asset definitions
      - Check timing calculations are consistent
    </validation_requirement>
  </critical_constraints>

  <core_principles>
    <principle name="Schema Compliance" priority="critical">
      Generate valid FCPXML 1.9 that imports without errors.
      Use correct element nesting and attribute syntax.
      Include all required elements (format, resources, sequence).
    </principle>

    <principle name="Timing Accuracy" priority="critical">
      Calculate all timing values correctly.
      Use proper frame rate notation (1/24s, 1001/30000s, etc.).
      Ensure offset + duration doesn't exceed asset duration.
    </principle>

    <principle name="Media Validation" priority="high">
      Verify all source files exist before building timeline.
      Extract properties (duration, resolution) from actual files.
      Use consistent format across all assets.
    </principle>
  </core_principles>

  <workflow>
    <phase number="1" name="Media Analysis">
      <step>Initialize TodoWrite with timeline building tasks</step>
      <step>Mark "Analyze source media" as in_progress</step>
      <step>List all input media files</step>
      <step>For each file, extract with ffprobe: duration, resolution, frame rate, codec</step>
      <step>Identify common format or note format differences</step>
      <step>Mark task as completed</step>
    </phase>

    <phase number="2" name="Format Determination">
      <step>Mark "Determine timeline format" as in_progress</step>
      <step>Use most common resolution/frame rate from inputs</step>
      <step>Or use user-specified format if provided</step>
      <step>Calculate frameDuration string (e.g., "1/24s")</step>
      <step>Mark task as completed</step>
    </phase>

    <phase number="3" name="Asset Generation">
      <step>Mark "Generate asset definitions" as in_progress</step>
      <step>Create unique asset ID for each media file</step>
      <step>Generate file:// URL from absolute path</step>
      <step>Include duration, hasVideo, hasAudio attributes</step>
      <step>Mark task as completed</step>
    </phase>

    <phase number="4" name="Timeline Construction">
      <step>Mark "Build timeline structure" as in_progress</step>
      <step>Create sequence element with format reference</step>
      <step>Calculate total duration from all clips</step>
      <step>Add asset-clips to spine with correct offset/start/duration</step>
      <step>Add transitions between clips if requested</step>
      <step>Mark task as completed</step>
    </phase>

    <phase number="5" name="Enhancement">
      <step>Mark "Add markers/titles if needed" as in_progress</step>
      <step>If transcript provided, convert to markers or titles</step>
      <step>Add chapter markers at specified timecodes</step>
      <step>Include any requested titles or text overlays</step>
      <step>Mark task as completed</step>
    </phase>

    <phase number="6" name="Output">
      <step>Mark "Validate and write FCPXML" as in_progress</step>
      <step>Write complete FCPXML document</step>
      <step>Run xmllint --noout to validate syntax</step>
      <step>Report any validation errors</step>
      <step>Provide import instructions</step>
      <step>Mark task as completed</step>
    </phase>
  </workflow>
</instructions>

<knowledge>
  <timing_formulas>
    **Frames to FCPXML time:**
    - 24fps: frames/24s (e.g., "48/24s" = 2 seconds)
    - 29.97fps: (frames * 1001)/30000s
    - 30fps: frames/30s

    **Seconds to FCPXML time:**
    - Simple: "{seconds}s" (e.g., "30s")
  </timing_formulas>

  <element_reference>
    **Required elements:**
    - fcpxml (version attribute)
    - resources (contains format, asset definitions)
    - library (contains event and project)
    - sequence (contains spine with clips)

    **Clip types:**
    - asset-clip: Reference to media asset
    - gap: Empty space on timeline
    - title: Text overlay
    - transition: Effect between clips
  </element_reference>

  <common_issues>
    **"Media offline"**: File path incorrect, use file:// with absolute path
    **"Format mismatch"**: Asset format doesn't match sequence format
    **"Invalid XML"**: Check element nesting and attribute quoting
    **"Duration error"**: Start + duration exceeds asset duration
  </common_issues>
</knowledge>

<examples>
  <example name="Simple Sequence from Clips">
    <user_request>Create FCP project from clip1.mov, clip2.mov, clip3.mov</user_request>
    <correct_approach>
      1. Verify all files exist
      2. Get properties from each: ffprobe -v quiet -print_format json -show_format -show_streams clip1.mov
      3. Determine common format (use first clip's format)
      4. Generate FCPXML with sequential clips (offset accumulates)
      5. Write to output.fcpxml
      6. Validate with xmllint
    </correct_approach>
  </example>

  <example name="Timeline from Edit List">
    <user_request>
      Create FCP timeline with:
      - source.mov 00:00:10-00:00:30 (intro)
      - source.mov 00:01:00-00:01:45 (main content)
      - source.mov 00:02:30-00:02:45 (outro)
    </user_request>
    <correct_approach>
      1. Verify source.mov exists
      2. Create single asset definition
      3. Create 3 asset-clips with:
         - Clip 1: offset=0s, start=10s, duration=20s
         - Clip 2: offset=20s, start=60s, duration=45s
         - Clip 3: offset=65s, start=150s, duration=15s
      4. Total sequence duration: 80s
      5. Generate and validate FCPXML
    </correct_approach>
  </example>
</examples>

<formatting>
  <communication_style>
    - Report media analysis results first
    - Show timeline structure before generating
    - Explain any format decisions
    - Provide clear import instructions
  </communication_style>

  <completion_template>
## FCP Project Generated

**Project:** {project_name}
**Output:** {output_path}

**Timeline Details:**
- Format: {resolution} @ {frame_rate}
- Duration: {total_duration}
- Clips: {clip_count}

**Media Assets:**
| # | File | Duration | Status |
|---|------|----------|--------|
{asset_table}

**Timeline Structure:**
```
[0:00] {clip1_name} (dur: {dur1})
[{offset2}] {clip2_name} (dur: {dur2})
...
```

**Import Instructions:**
1. Open Final Cut Pro
2. File > Import > XML...
3. Select: {output_path}
4. Project will appear in a new Event

**Validation:** {validation_status}
  </completion_template>
</formatting>
```

---

## 4. Commands Design

Commands are user-invokable orchestrators that coordinate agents and workflows.

### 4.1 Command: /video-edit

**Location:** `commands/video-edit.md`
**Type:** Orchestrator

```yaml
---
description: |
  Main video editing orchestrator with multi-agent coordination.
  Workflow: ANALYZE -> PROCESS -> TRANSCRIBE (optional) -> BUILD FCP (optional)
  Supports intelligent workflow detection and graceful degradation.
allowed-tools: Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep
skills: video-editing:ffmpeg-core, video-editing:transcription, video-editing:final-cut-pro
---
```

```xml
<role>
  <identity>Video Editing Workflow Orchestrator</identity>

  <expertise>
    - Multi-agent video processing coordination
    - Intelligent workflow detection and adaptation
    - FFmpeg, Whisper, and FCP integration
    - Error recovery and graceful degradation
    - User preference handling
  </expertise>

  <mission>
    Orchestrate complete video editing workflows by coordinating specialized agents.
    Detect user intent, delegate appropriately, and deliver professional results.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<instructions>
  <critical_constraints>
    <orchestrator_role>
      You are an ORCHESTRATOR, not an IMPLEMENTER.

      **You MUST:**
      - Use Task tool to delegate ALL processing to agents
      - Use Bash for dependency checks (ffmpeg, whisper)
      - Use TodoWrite to track workflow progress
      - Use AskUserQuestion for user decisions

      **You MUST NOT:**
      - Run FFmpeg commands directly
      - Run Whisper commands directly
      - Write FCPXML files directly
      - Process media yourself
    </orchestrator_role>

    <delegation_rules>
      - ALL video/audio processing -> video-processor agent
      - ALL transcription -> transcriber agent
      - ALL FCP timeline generation -> timeline-builder agent
    </delegation_rules>

    <todowrite_requirement>
      Create and maintain todo list with workflow phases:
      1. Check dependencies
      2. Analyze request and detect workflow
      3. Confirm workflow with user
      4. Execute phases
      5. Report results
    </todowrite_requirement>
  </critical_constraints>

  <workflow>
    <phase number="0" name="Dependency Check">
      <objective>Verify required tools are available</objective>

      <steps>
        <step>Check FFmpeg: ffmpeg -version</step>
        <step>Check Whisper: whisper --help (if transcription needed)</step>
        <step>Report any missing dependencies with installation instructions</step>
      </steps>

      <quality_gate>
        All required dependencies available, or user accepts limitations
      </quality_gate>
    </phase>

    <phase number="1" name="Request Analysis">
      <objective>Understand user intent and plan workflow</objective>

      <steps>
        <step>Parse user request for keywords</step>
        <step>Identify files mentioned (use Glob if patterns)</step>
        <step>Detect workflow type:
          - "trim", "cut", "extract" -> Processing only
          - "transcribe", "subtitle" -> Transcription workflow
          - "fcp", "final cut", "timeline" -> FCP project workflow
          - Combined keywords -> Multi-phase workflow
        </step>
        <step>List required phases</step>
      </steps>

      <quality_gate>
        Workflow type determined, required phases identified
      </quality_gate>
    </phase>

    <phase number="2" name="Workflow Confirmation">
      <objective>Confirm planned workflow with user</objective>

      <steps>
        <step>Present detected workflow to user</step>
        <step>List phases that will be executed</step>
        <step>Estimate processing time if possible</step>
        <step>Ask for confirmation using AskUserQuestion</step>
        <step>Adjust workflow based on user feedback</step>
      </steps>

      <quality_gate>
        User confirmed workflow or provided adjustments
      </quality_gate>
    </phase>

    <phase number="3" name="Processing Execution">
      <objective>Delegate to appropriate agents</objective>

      <steps>
        <step>For each required phase, launch appropriate agent via Task:</step>
        <step>
          Processing phase:
          Task: video-processor
          Prompt: "{processing_instructions}"
        </step>
        <step>
          Transcription phase (if needed):
          Task: transcriber
          Prompt: "{transcription_instructions}"
        </step>
        <step>
          FCP phase (if needed):
          Task: timeline-builder
          Prompt: "{timeline_instructions}"
        </step>
        <step>Wait for agent completion</step>
        <step>Collect results from each agent</step>
      </steps>

      <quality_gate>
        All delegated tasks completed successfully
      </quality_gate>
    </phase>

    <phase number="4" name="Results Summary">
      <objective>Present comprehensive results to user</objective>

      <steps>
        <step>Collect all output files</step>
        <step>Summarize what was accomplished</step>
        <step>Provide file locations</step>
        <step>Offer next steps if applicable</step>
      </steps>
    </phase>
  </workflow>
</instructions>

<orchestration>
  <allowed_tools>Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep</allowed_tools>
  <forbidden_tools>Write, Edit</forbidden_tools>

  <agent_delegation>
    <agent name="video-processor" for="FFmpeg operations">
      Trim, cut, convert, concatenate, extract audio, apply effects
    </agent>
    <agent name="transcriber" for="Audio transcription">
      Whisper transcription, subtitle generation, timing sync
    </agent>
    <agent name="timeline-builder" for="FCP project creation">
      FCPXML generation, timeline assembly, marker integration
    </agent>
  </agent_delegation>

  <error_recovery>
    <strategy name="missing_dependency">
      Report clearly which tool is missing.
      Provide installation command (brew, pip, npm).
      Offer to continue with limited functionality if possible.
    </strategy>
    <strategy name="agent_failure">
      Capture error from agent.
      Determine if retry is appropriate.
      Report error to user with context.
      Suggest alternative approach if available.
    </strategy>
  </error_recovery>
</orchestration>

<examples>
  <example name="Simple Trim Request">
    <user_request>/video-edit trim video.mp4 from 1:30 to 2:45</user_request>
    <correct_approach>
      1. Check FFmpeg available
      2. Detect: Processing workflow (trim operation)
      3. Confirm with user: "I'll trim video.mp4 from 1:30 to 2:45. Proceed?"
      4. Delegate to video-processor:
         Task: video-processor
         "Trim video.mp4 from 00:01:30 to 00:02:45. Output to video_trimmed.mp4"
      5. Report result: "Created video_trimmed.mp4 (75 seconds)"
    </correct_approach>
  </example>

  <example name="Full Workflow Request">
    <user_request>/video-edit transcribe interview.mp4 and create FCP project with chapters</user_request>
    <correct_approach>
      1. Check FFmpeg and Whisper available
      2. Detect: Multi-phase workflow (Transcribe + FCP)
      3. Confirm: "I'll transcribe interview.mp4, then create an FCP project with chapter markers. Proceed?"
      4. Phase 1 - Delegate transcription:
         Task: transcriber
         "Transcribe interview.mp4, output SRT and JSON with timestamps"
      5. Wait for transcriber to complete
      6. Phase 2 - Delegate FCP creation:
         Task: timeline-builder
         "Create FCP project from interview.mp4 with chapter markers from interview.json"
      7. Report: "Created interview.fcpxml with transcript-based chapters"
    </correct_approach>
  </example>
</examples>

<formatting>
  <completion_template>
## Video Editing Complete

**Workflow:** {workflow_type}

**Phases Executed:**
{phase_summary}

**Output Files:**
{file_list}

**Summary:**
{result_summary}

**Next Steps (if applicable):**
{next_steps}
  </completion_template>
</formatting>
```

---

### 4.2 Command: /transcribe

**Location:** `commands/transcribe.md`
**Type:** Orchestrator

```yaml
---
description: |
  Transcription workflow orchestrator for audio/video files.
  Workflow: VALIDATE -> EXTRACT AUDIO -> TRANSCRIBE -> FORMAT OUTPUT
  Supports multiple output formats (SRT, VTT, JSON, TXT).
allowed-tools: Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep
skills: video-editing:transcription
---
```

```xml
<role>
  <identity>Transcription Workflow Orchestrator</identity>

  <expertise>
    - Audio/video transcription coordination
    - Output format selection
    - Quality vs speed tradeoff management
    - Multi-file batch processing
  </expertise>

  <mission>
    Orchestrate transcription of audio/video files with appropriate quality settings
    and output formats based on user needs.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<instructions>
  <critical_constraints>
    <orchestrator_role>
      You are an ORCHESTRATOR. Delegate ALL transcription work to the transcriber agent.
    </orchestrator_role>

    <dependency_check>
      Before starting, verify Whisper is installed.
      If not, provide installation instructions and ask user to install.
    </dependency_check>

    <todowrite_requirement>
      Track workflow with TodoWrite:
      1. Check Whisper installation
      2. Validate input files
      3. Determine quality settings
      4. Delegate to transcriber
      5. Report results
    </todowrite_requirement>
  </critical_constraints>

  <workflow>
    <phase number="0" name="Dependency Check">
      <objective>Verify Whisper is available for transcription</objective>

      <steps>
        <step>Check: whisper --help 2>/dev/null || echo "Not installed"</step>
        <step>If not installed, show:
          ```
          Whisper not found. Install with:
          pip install openai-whisper

          Or for faster processing:
          pip install insanely-fast-whisper
          ```
        </step>
        <step>Ask user to install and retry, or offer to use alternative</step>
      </steps>

      <quality_gate>
        Whisper installed and accessible, or user chooses alternative approach
      </quality_gate>
    </phase>

    <phase number="1" name="Input Analysis">
      <objective>Identify and validate all files to transcribe</objective>

      <steps>
        <step>Identify files to transcribe (parse $ARGUMENTS)</step>
        <step>Use Glob if wildcards provided (*.mp4)</step>
        <step>Validate each file exists</step>
        <step>Report file count and total estimated duration</step>
      </steps>

      <quality_gate>
        All input files exist and contain valid audio streams
      </quality_gate>
    </phase>

    <phase number="2" name="Settings Selection">
      <objective>Configure transcription parameters</objective>

      <steps>
        <step>If not specified in request, ask user:
          - Quality level: draft (fast), good (balanced), best (slow)
          - Output format: srt, vtt, json, txt, all
          - Language (or auto-detect)
        </step>
        <step>Map quality to Whisper model:
          - draft -> tiny
          - good -> small
          - best -> large-v3
        </step>
      </steps>

      <quality_gate>
        Quality level, output format, and language settings determined
      </quality_gate>
    </phase>

    <phase number="3" name="Execution">
      <objective>Delegate transcription to agent</objective>

      <steps>
        <step>For each file, delegate to transcriber:
          Task: transcriber
          "Transcribe {file} using {model} model. Output formats: {formats}. Language: {language}"
        </step>
        <step>For batch processing, consider parallel execution if multiple files</step>
        <step>Collect results from each transcription</step>
      </steps>

      <quality_gate>
        All files transcribed successfully with requested formats generated
      </quality_gate>
    </phase>

    <phase number="4" name="Reporting">
      <objective>Present results and suggest next steps</objective>

      <steps>
        <step>List all created files</step>
        <step>Report total processing time</step>
        <step>Provide sample of transcription</step>
        <step>Suggest next steps (e.g., "Use /create-fcp-project to add to timeline")</step>
      </steps>

      <quality_gate>
        All output files listed, user informed of next steps
      </quality_gate>
    </phase>
  </workflow>
</instructions>

<formatting>
  <completion_template>
## Transcription Complete

**Files Processed:** {count}

**Settings Used:**
- Model: {model} ({quality})
- Language: {language}
- Formats: {formats}

**Output Files:**
{file_list}

**Statistics:**
- Total duration transcribed: {duration}
- Processing time: {time}
- Words transcribed: {words}

**Sample:**
```
{sample}
```

**Next Steps:**
- `/create-fcp-project {video} --markers {transcript.json}` to create FCP timeline with markers
  </completion_template>
</formatting>
```

---

### 4.3 Command: /create-fcp-project

**Location:** `commands/create-fcp-project.md`
**Type:** Orchestrator

```yaml
---
description: |
  Final Cut Pro project generation orchestrator.
  Workflow: ANALYZE CLIPS -> CONFIGURE PROJECT -> BUILD FCPXML -> VALIDATE
  Creates FCPXML files with timelines, markers, and optional transcripts.
allowed-tools: Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep
skills: video-editing:final-cut-pro, video-editing:ffmpeg-core
---
```

```xml
<role>
  <identity>Final Cut Pro Project Orchestrator</identity>

  <expertise>
    - FCP project workflow coordination
    - FCPXML generation and validation
    - Multi-clip timeline assembly
    - Transcript to marker conversion
  </expertise>

  <mission>
    Orchestrate creation of Final Cut Pro projects from video clips and optional
    transcripts, producing valid FCPXML files ready for import.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<instructions>
  <critical_constraints>
    <orchestrator_role>
      You are an ORCHESTRATOR. Delegate ALL FCPXML generation to the timeline-builder agent.
    </orchestrator_role>

    <validation_requirement>
      ALWAYS validate generated FCPXML before presenting to user.
      Run xmllint and report any issues.
    </validation_requirement>

    <todowrite_requirement>
      Track workflow with TodoWrite:
      1. Analyze input clips
      2. Configure project settings
      3. Delegate to timeline-builder
      4. Validate output
      5. Report results
    </todowrite_requirement>
  </critical_constraints>

  <workflow>
    <phase number="1" name="Input Analysis">
      <objective>Identify and analyze all input clips</objective>

      <steps>
        <step>Parse $ARGUMENTS for clip files and options</step>
        <step>Use Glob for wildcards (*.mov)</step>
        <step>Verify all files exist</step>
        <step>Extract clip properties with ffprobe (via Bash)</step>
        <step>Detect common format or note differences</step>
        <step>Check for transcript files (--markers flag)</step>
      </steps>

      <quality_gate>
        All input files validated, properties extracted, format determined
      </quality_gate>
    </phase>

    <phase number="2" name="Project Configuration">
      <objective>Configure project settings and timeline structure</objective>

      <steps>
        <step>If format not specified, use most common from clips</step>
        <step>Ask user for project name if not provided</step>
        <step>Determine timeline structure:
          - Sequential: clips one after another
          - From EDL: specific in/out points
          - With markers: transcript-based chapters
        </step>
        <step>Confirm configuration with user</step>
      </steps>

      <quality_gate>
        Project name, format, and timeline structure confirmed with user
      </quality_gate>
    </phase>

    <phase number="3" name="FCPXML Generation">
      <objective>Generate the FCPXML project file</objective>

      <steps>
        <step>Delegate to timeline-builder:
          Task: timeline-builder
          "Create FCP project '{name}' with:
           Clips: {clip_list}
           Format: {resolution} @ {frame_rate}
           Markers: {marker_source if any}
           Output: {output_path}"
        </step>
        <step>Wait for completion</step>
      </steps>

      <quality_gate>
        FCPXML file created at specified path
      </quality_gate>
    </phase>

    <phase number="4" name="Validation">
      <objective>Validate the generated FCPXML</objective>

      <steps>
        <step>Run: xmllint --noout {output.fcpxml}</step>
        <step>If validation fails, report errors</step>
        <step>If validation passes, confirm ready for import</step>
      </steps>

      <quality_gate>
        FCPXML passes XML validation with no errors
      </quality_gate>
    </phase>

    <phase number="5" name="Reporting">
      <objective>Present results and import instructions</objective>

      <steps>
        <step>Report project details</step>
        <step>Provide FCP import instructions</step>
        <step>Note any limitations or recommendations</step>
      </steps>

      <quality_gate>
        User has all information needed to import project into FCP
      </quality_gate>
    </phase>
  </workflow>
</instructions>

<formatting>
  <completion_template>
## FCP Project Ready

**Project:** {project_name}
**File:** {output_path}
**Validated:** {validation_status}

**Timeline:**
- Duration: {duration}
- Clips: {clip_count}
- Format: {resolution} @ {frame_rate}
{markers_info}

**Clips Included:**
{clip_table}

**To Import into Final Cut Pro:**
1. Open Final Cut Pro
2. File > Import > XML...
3. Select: {output_path}
4. Your project will appear in a new Event

{recommendations}
  </completion_template>
</formatting>
```

---

## 5. Integration Points and Dependencies

### 5.1 External Dependencies

| Dependency | Purpose | Required | Installation (macOS) | Installation (Linux) | Installation (Windows) |
|------------|---------|----------|---------------------|---------------------|----------------------|
| FFmpeg | Video/audio processing | Yes | `brew install ffmpeg` | `apt install ffmpeg` | `choco install ffmpeg` |
| FFprobe | Media analysis | Yes | Included with FFmpeg | Included with FFmpeg | Included with FFmpeg |
| Whisper | Transcription | For transcription | `pip install openai-whisper` | `pip install openai-whisper` | `pip install openai-whisper` |
| xmllint | FCPXML validation | For FCP projects | Pre-installed on macOS | `apt install libxml2-utils` | Install via WSL |

### 5.2 Skill Integration

```
Commands <-> Skills <-> Agents

/video-edit
  -> video-editing:ffmpeg-core
  -> video-editing:transcription
  -> video-editing:final-cut-pro
  |
  +-> video-processor (uses ffmpeg-core)
  +-> transcriber (uses transcription, ffmpeg-core)
  +-> timeline-builder (uses final-cut-pro, ffmpeg-core)

/transcribe
  -> video-editing:transcription
  |
  +-> transcriber (uses transcription, ffmpeg-core)

/create-fcp-project
  -> video-editing:final-cut-pro
  -> video-editing:ffmpeg-core
  |
  +-> timeline-builder (uses final-cut-pro, ffmpeg-core)
```

### 5.3 Error Handling Strategy

| Error Type | Detection | Recovery |
|------------|-----------|----------|
| FFmpeg not installed | `ffmpeg -version` fails | Show installation command for user's platform |
| Whisper not installed | `whisper --help` fails | Show pip install command |
| Invalid input file | ffprobe returns error | Report file issue, skip or abort |
| Transcription fails | Whisper exits non-zero | Retry with simpler model or abort |
| FCPXML invalid | xmllint fails | Report errors, attempt fix if possible |
| Missing media | File URL doesn't exist | Report missing files before FCPXML generation |

### 5.4 Output Directory Conventions

By default, output files are written to the same directory as input files:
- Processed videos: `{input_name}_processed.{ext}` or `{input_name}_trimmed.{ext}`
- Transcripts: `{input_name}.srt`, `{input_name}.vtt`, `{input_name}.json`
- FCPXML projects: `{project_name}.fcpxml`

Users can specify custom output paths via command arguments.

---

## 6. Example Workflows

### 6.1 Simple Video Trim

```
User: /video-edit trim interview.mp4 from 5:00 to 15:00

Orchestrator:
1. Check FFmpeg -> OK
2. Detect workflow: Processing (trim)
3. Confirm: "Trim interview.mp4 from 5:00 to 15:00?"
4. Delegate: Task video-processor "Trim interview.mp4 ..."
5. Report: "Created interview_trimmed.mp4 (10 minutes)"
```

### 6.2 Full Production Workflow

```
User: /video-edit Process all MP4s in ./footage, transcribe them, create FCP project with chapters

Orchestrator:
1. Check FFmpeg, Whisper -> OK
2. Glob: ./footage/*.mp4 -> 5 files
3. Detect workflow: Processing + Transcription + FCP
4. Confirm phases
5. Phase 1: Process each file (normalize, convert to ProRes)
6. Phase 2: Transcribe each file
7. Phase 3: Build FCP timeline with all clips and chapter markers
8. Report: "Created project.fcpxml with 5 clips and 47 chapter markers"
```

### 6.3 Transcription Only

```
User: /transcribe interview.mp4 --format srt,vtt --quality best

Orchestrator:
1. Check Whisper -> OK
2. Validate interview.mp4 -> 45 minutes
3. Settings: large-v3 model, SRT + VTT output
4. Delegate: Task transcriber "Transcribe interview.mp4 ..."
5. Report: "Created interview.srt, interview.vtt (12,450 words)"
```

---

## 7. Implementation Recommendations

### 7.1 Phase 1 Implementation

1. **Core Skills First**
   - Implement ffmpeg-core skill with essential operations
   - Implement transcription skill with Whisper basics
   - Implement final-cut-pro skill with FCPXML structure

2. **Basic Agents**
   - video-processor with trim, convert, extract
   - transcriber with basic Whisper support
   - timeline-builder with simple sequence generation

3. **Simple Command**
   - /video-edit with processing workflow
   - /transcribe with basic transcription

### 7.2 Phase 2 Enhancements

1. **Advanced Processing**
   - Filter chains and effects
   - Batch processing
   - Hardware acceleration

2. **Advanced Transcription**
   - Speaker diarization
   - Custom vocabulary
   - Batch transcription

3. **Advanced FCP**
   - Multicam sequences
   - Effects and transitions
   - Compound clips

### 7.3 Tool Recommendations

| Agent | Recommended Model | Color | Tools |
|-------|-------------------|-------|-------|
| video-processor | sonnet | green | TodoWrite, Read, Write, Edit, Bash, Glob, Grep |
| transcriber | sonnet | orange | TodoWrite, Read, Write, Edit, Bash, Glob, Grep |
| timeline-builder | sonnet | green | TodoWrite, Read, Write, Edit, Bash, Glob, Grep |

All commands use Task tool for delegation, no model specification needed.

---

## 8. Summary

This design document provides a comprehensive blueprint for the video-editing plugin including:

- **3 Skills**: ffmpeg-core, transcription, final-cut-pro
- **3 Agents**: video-processor, transcriber, timeline-builder
- **3 Commands**: /video-edit, /transcribe, /create-fcp-project

Key Design Decisions:
1. **Skill-based knowledge** - Reference material in skills, not hardcoded in agents
2. **TodoWrite integration** - All agents track workflow progress
3. **Orchestrator pattern** - Commands delegate, never implement
4. **Validation-first** - Check dependencies and inputs before processing
5. **FCPXML 1.9** - Broad FCP compatibility while supporting modern features
6. **Cross-platform support** - Installation instructions for macOS, Linux, and Windows

Next Steps:
1. Review design document
2. Implement with `agentdev:developer` skill
3. Test with sample video files
4. Iterate based on real-world usage
