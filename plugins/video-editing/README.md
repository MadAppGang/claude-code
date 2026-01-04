# Video Editing Plugin for Claude Code

Professional video editing toolkit with FFmpeg operations, Whisper transcription, and Apple Final Cut Pro project generation.

**Version:** 1.0.0
**Author:** Jack Rudenko @ MadAppGang
**License:** MIT

---

## Overview

The video-editing plugin brings comprehensive video production capabilities to Claude Code through a coordinated set of specialized agents:

- **FFmpeg Operations** - Video manipulation, conversion, trimming, concatenation, effects
- **Transcription** - Audio/video transcription using Whisper with timing synchronization
- **Final Cut Pro Integration** - Generate FCPXML projects and timelines with proper cut fragments

## Features

### Video Processing (FFmpeg)
- Trim and cut videos with frame-accurate precision
- Concatenate multiple clips into single video
- Convert between formats (MP4, MOV, AVI, etc.)
- Convert to ProRes for Final Cut Pro editing
- Extract audio from video files
- Apply video effects (fade, speed, color correction)
- Scale and resize videos
- Optimize with hardware acceleration

### Transcription (Whisper)
- Transcribe audio and video content
- Multiple output formats (SRT, VTT, JSON, TXT)
- Word-level timing for precise synchronization
- Language detection and specification
- Quality level selection (draft, good, best)
- Batch processing for multiple files

### Final Cut Pro Integration
- Generate FCPXML 1.9 projects
- Multi-clip timeline assembly
- Chapter markers from transcripts
- Sequential and custom clip placement
- Format detection and configuration
- XML validation before import

## Installation

### 1. Install the Plugin

```bash
# Add the MAG plugin marketplace
/plugin marketplace add MadAppGang/claude-code

# Or for local development
/plugin marketplace add /path/to/claude-code
```

### 2. Enable in Settings

Add to your `.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "video-editing@mag-claude-plugins": true
  }
}
```

### 3. Install External Dependencies

**FFmpeg (Required for video processing):**

```bash
# macOS
brew install ffmpeg

# Linux (Ubuntu/Debian)
sudo apt update && sudo apt install ffmpeg

# Linux (Fedora/RHEL)
sudo dnf install ffmpeg

# Windows
choco install ffmpeg
```

**Whisper (Required for transcription):**

```bash
# Python package
pip install openai-whisper

# Or for faster GPU processing
pip install insanely-fast-whisper
```

**xmllint (Optional, for FCPXML validation):**

```bash
# macOS (pre-installed)
xmllint --version

# Linux (Ubuntu/Debian)
sudo apt install libxml2-utils
```

## Quick Start

### Example 1: Trim a Video

```
/video-edit trim interview.mp4 from 1:30 to 5:45
```

This will:
1. Validate the input file
2. Extract media properties
3. Trim the video with frame-accurate precision
4. Validate the output
5. Report results with file sizes

### Example 2: Transcribe Video

```
/transcribe presentation.mp4 --quality best --format srt,vtt
```

This will:
1. Check Whisper installation
2. Extract audio from video
3. Transcribe using large-v3 model
4. Generate SRT and VTT subtitle files
5. Report word count and processing time

### Example 3: Create FCP Project

```
/create-fcp-project clip1.mov clip2.mov clip3.mov --name "My Project"
```

This will:
1. Analyze all input clips
2. Detect common format
3. Generate FCPXML timeline
4. Validate XML structure
5. Provide import instructions

### Example 4: Full Production Workflow

```
/video-edit transcribe interview.mp4 and create FCP project with chapters
```

This will:
1. Transcribe the video
2. Create FCP project with transcript-based chapter markers
3. Report all output files

## Available Commands

### `/video-edit` - Main Orchestrator

Multi-phase video editing workflow coordinator.

**Usage:**
```
/video-edit <operation> <file(s)> [options]
```

**Operations:**
- `trim <file> from <start> to <end>` - Trim video
- `convert <file> to prores` - Convert to ProRes for FCP
- `extract audio from <file>` - Extract audio track
- `concatenate <files>` - Merge multiple videos
- `transcribe <file>` - Transcribe audio/video
- `create fcp project from <files>` - Generate FCPXML

**Examples:**
```
/video-edit trim video.mp4 from 00:01:30 to 00:05:45
/video-edit convert raw_footage.avi to prores
/video-edit extract audio from interview.mp4
/video-edit concatenate clip1.mp4 clip2.mp4 clip3.mp4
```

### `/transcribe` - Transcription Workflow

Dedicated transcription orchestrator.

**Usage:**
```
/transcribe <file(s)> [--quality <level>] [--format <formats>] [--language <lang>]
```

**Options:**
- `--quality draft|good|best` - Quality level (default: good)
- `--format srt|vtt|json|txt|all` - Output formats (default: all)
- `--language <code>` - Language code (default: auto-detect)

**Examples:**
```
/transcribe interview.mp4
/transcribe podcast.mp3 --quality best --format srt,vtt
/transcribe *.mp4 --language en
```

### `/create-fcp-project` - FCP Timeline Generator

Generate Final Cut Pro projects from clips.

**Usage:**
```
/create-fcp-project <file(s)> [--name <project>] [--markers <transcript>]
```

**Options:**
- `--name <name>` - Project name (default: auto-generated)
- `--markers <file>` - Transcript JSON for chapter markers

**Examples:**
```
/create-fcp-project clip1.mov clip2.mov clip3.mov
/create-fcp-project *.mov --name "Documentary Rough Cut"
/create-fcp-project interview.mp4 --markers interview.json
```

## Architecture

### Agents

**video-processor** (green)
- FFmpeg operations specialist
- Handles all video/audio processing
- Validates inputs and outputs
- Reports detailed results

**transcriber** (orange)
- Whisper transcription specialist
- Extracts audio, runs transcription
- Generates multiple output formats
- Provides timing synchronization

**timeline-builder** (green)
- FCPXML generation specialist
- Creates valid FCP projects
- Manages asset references and timing
- Validates XML structure

### Skills

**ffmpeg-core**
- FFmpeg command patterns
- Codec selection guide
- Filter chain examples
- Performance optimization

**transcription**
- Whisper model selection
- Output format reference
- Timing synchronization
- Quality optimization

**final-cut-pro**
- FCPXML structure guide
- Element reference
- Timing calculations
- Validation patterns

## Workflow Examples

### Trim Multiple Clips for FCP

```
# 1. Trim unwanted parts
/video-edit trim raw_footage.mp4 from 00:02:00 to 00:15:30

# 2. Convert to ProRes
/video-edit convert raw_footage_trimmed.mp4 to prores

# 3. Create FCP project
/create-fcp-project raw_footage_trimmed.mov --name "Final Edit"
```

### Transcribe and Add Subtitles

```
# 1. Transcribe video
/transcribe documentary.mp4 --quality best --format srt

# 2. Review and edit documentary.srt manually if needed

# 3. Burn subtitles into video (using video-processor agent)
# Or use subtitle file separately
```

### Multi-Clip Project with Chapters

```
# 1. Transcribe main interview
/transcribe main_interview.mp4 --format json

# 2. Create project with all clips and chapter markers
/create-fcp-project main_interview.mp4 b_roll_1.mov b_roll_2.mov \
  --markers main_interview.json \
  --name "Interview Project"
```

## Troubleshooting

### FFmpeg Not Found

**Error:** `ffmpeg: command not found`

**Solution:**
```bash
# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg  # Ubuntu/Debian
sudo dnf install ffmpeg  # Fedora/RHEL
```

### Whisper Not Found

**Error:** `whisper: command not found`

**Solution:**
```bash
pip install openai-whisper

# Or for GPU acceleration
pip install insanely-fast-whisper
```

### FCPXML Import Fails

**Error:** "Media offline" in Final Cut Pro

**Solution:**
- Ensure all media files use absolute paths
- Verify all referenced files exist
- Check file permissions
- Convert to ProRes if using non-native formats

### Transcription Too Slow

**Problem:** Whisper transcription takes too long

**Solution:**
- Use smaller model: `--quality draft` or `--quality good`
- Use GPU acceleration (install CUDA/cuDNN)
- Use `insanely-fast-whisper` instead of `openai-whisper`
- Process shorter segments

## Technical Details

### Supported Formats

**Video Input:**
- MP4, MOV, AVI, MKV, WebM
- Any format supported by FFmpeg

**Video Output:**
- MP4 (H.264/AAC) - Web delivery
- MOV (ProRes/PCM) - FCP editing
- Any format supported by FFmpeg

**Transcript Formats:**
- SRT - SubRip Subtitle (universal)
- VTT - WebVTT (web native)
- JSON - Full metadata with word timing
- TXT - Plain text

**FCPXML:**
- Version 1.9 (FCP 10.5+)
- Broad compatibility across FCP versions

### Performance

**Video Processing:**
- Hardware acceleration supported (VideoToolbox, CUDA)
- Stream copy for lossless operations
- Parallel processing for multi-core CPUs

**Transcription:**
- Model selection impacts speed/quality
- GPU acceleration recommended for large-v3
- Batch processing for multiple files

**FCP Generation:**
- Fast XML generation (milliseconds)
- No video re-encoding required
- Immediate import to Final Cut Pro

## Best Practices

### For Video Processing

1. **Use stream copy when possible** - Faster, lossless
2. **Convert to ProRes for FCP** - Native format, best performance
3. **Validate outputs** - Always check duration and properties
4. **Use absolute paths** - Prevents file not found errors

### For Transcription

1. **Start with small model** - Test quality before using large
2. **Specify language** - Improves accuracy
3. **Use word timestamps** - Better synchronization
4. **Review and edit** - Automatic transcription isn't perfect

### For FCP Projects

1. **Validate before import** - Check XML syntax
2. **Use consistent formats** - All clips same resolution/fps
3. **Absolute file paths** - Prevents media offline errors
4. **Test with simple project** - Verify workflow before complex edits

## Limitations

- **Whisper model size** - Larger models require significant RAM/VRAM
- **FCPXML complexity** - Advanced effects may require manual creation
- **Hardware acceleration** - Platform dependent (VideoToolbox, CUDA, etc.)
- **Transcription accuracy** - Depends on audio quality and model size

## Contributing

This plugin is part of the MAG Claude Plugins collection. See the main repository for contribution guidelines.

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/MadAppGang/claude-code/issues
- Email: i@madappgang.com

---

**Maintained by:** Jack Rudenko @ MadAppGang
**Last Updated:** December 29, 2025
**Version:** 1.0.0
