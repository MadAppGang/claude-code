---
name: final-cut-pro
description: Apple Final Cut Pro FCPXML format reference. Covers project structure, timeline creation, clip references, effects, and transitions. Use when generating FCP projects or understanding FCPXML structure.
---

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

        <asset id="a1" name="clip1" src="file://{ABSOLUTE_PATH}/clip1.mov"
               start="0s" duration="120s" hasVideo="1" hasAudio="1">
            <media-rep kind="original-media" src="file://{ABSOLUTE_PATH}/clip1.mov"/>
        </asset>
    </resources>

    <library location="file://{USER_MOVIES}/MyLibrary.fcpbundle/">
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
       src="file://{ABSOLUTE_PATH}/interview.mov"
       start="0s" duration="600s"
       hasVideo="1" hasAudio="1"
       format="r1">
    <media-rep kind="original-media"
               src="file://{ABSOLUTE_PATH}/interview.mov"/>
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
               src="file://{ABSOLUTE_PATH}/clip1.mov" start="0s" duration="120s"
               hasVideo="1" hasAudio="1" format="r1">
            <media-rep kind="original-media" src="file://{ABSOLUTE_PATH}/clip1.mov"/>
        </asset>

        <asset id="a2" name="clip_002"
               src="file://{ABSOLUTE_PATH}/clip2.mov" start="0s" duration="90s"
               hasVideo="1" hasAudio="1" format="r1">
            <media-rep kind="original-media" src="file://{ABSOLUTE_PATH}/clip2.mov"/>
        </asset>
    </resources>

    <library location="file://{USER_MOVIES}/MyLibrary.fcpbundle/">
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
