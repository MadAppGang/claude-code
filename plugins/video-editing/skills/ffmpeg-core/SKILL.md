---
name: ffmpeg-core
description: FFmpeg fundamentals for video/audio manipulation. Covers common operations (trim, concat, convert, extract), codec selection, filter chains, and performance optimization. Use when planning or executing video processing tasks.
---
plugin: video-editing
updated: 2026-01-20

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
