# Media tools implementation and validation — 2026-09-13

Implemented in the existing site, using its public-page generator, sitemap generation, AdSense head integration, and private-route protection.

## Added routes
- /media-tools/
- /art-track/ (Art Track and Podcast modes)
- /audiogram/
- /metadata-editor/
- /waveform-image/
- /artwork-resizer/
- /audio-check/
- /audio-clipper/

## Architecture
Shared FFmpeg WASM worker with bounded client download, streamed asset progress, worker-start timeout, explicit cancellation and error recovery. Media is read locally before engine startup. Canvas handles artwork composition and waveform images. FFmpeg handles synchronized export visualization and H.264/AAC MP4 generation. Only destination preferences are saved in localStorage. No raw media upload endpoint was introduced.

The existing converter retains audio and video inputs, presets, custom options, trim and tags. Additional formats: AIFF, raw AAC, ALAC in M4A and WavPack. OGG uses Opus because the bundled engine does not provide libvorbis encoding. Added delivery PCM presets and an accessible format chooser.

## Verified in alternate cloud Chromium
- Actual downloads from all eight tool workflows, with FFprobe inspection of seven generated media files.
- MP4 input to MP3 output.
- 1080p horizontal H.264/AAC with waveform.
- 720p vertical TikTok with bars, without artwork in Podcast mode.
- Spectrum export in a Reels layout.
- Short 2160p export with visualizer disabled.
- WAV metadata copy, waveform PNG and 3000px artwork PNG.
- Loudness analysis and WAV clipping.
- Corrupt-media recovery and 390px layout without horizontal overflow.
- Existing public-page, sitemap, publisher-file, structural accessibility and seven crawl/authorization regression checks.

## Remaining acceptance work
This is an initial implementation, not a claim of complete fulfillment or WCAG certification.
- Physical iPhone Safari and VoiceOver testing is unavailable in the alternate cloud browser.
- Full matrix of long sources (3–5 minutes and 60+ minutes), interruptions, sleep/wake, memory pressure, all image variants and every input codec remains to be completed.
- Preview visualizations are representative; Bars and Spectrum preview should use their exact exported renderer style.
- Video export offers individual destination variants, not a one-click multi-video pack.
- Optional thumbnail, render report, cross-tool project handoff, PWA/offline assets and benchmarking are not implemented.
- Source size is capped at 250 MB for the current WASM implementation; it is not a streaming large-file renderer.
- No Apple Digital Masters or distributor certification is claimed.
