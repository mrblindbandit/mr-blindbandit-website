"""Professional browser-side audio converter and policy disclosure pages."""
import html

def add_audio_converter(output, layout, pages):
    description='Convert audio or extract high-quality audio from MP4, MOV, MKV, WebM and other video files, with professional presets or custom controls.'
    body='''<section class="page-intro shell converter-intro"><p class="eyebrow">MR. BLINDBANDIT / AUDIO UTILITY</p><h1>Professional audio converter</h1><p class="lede">Convert audio locally in your browser with lossless, studio, streaming, podcast, and custom settings.</p><img class="media-hero-image" src="/assets/media/creator-suite.webp" srcset="/assets/media/creator-suite-small.webp 640w, /assets/media/creator-suite.webp 1600w" sizes="(max-width: 700px) 100vw, 1100px" width="1600" height="900" alt="" decoding="async"><ul class="converter-trust" aria-label="Converter privacy and quality highlights"><li>Files stay on your device</li><li>No account required</li><li>Professional export presets</li></ul></section>
<section class="shell section converter-workspace" aria-labelledby="converter-heading"><div class="section-heading"><div><p class="eyebrow">LOCAL CONVERSION DESK</p><h2 id="converter-heading">Choose audio or video</h2></div><p class="converter-engine-state" data-engine-state role="status" aria-live="polite">Engine loads only when you convert.</p></div>
<form class="audio-converter" data-audio-converter>
 <div class="converter-upload"><label for="audio-source"><strong>Choose an audio or video file</strong><span>Audio: MP3, WAV, FLAC, AAC/M4A, OGG, Opus, AIFF · Video: MP4, MOV, MKV, WebM, AVI, MPEG and compatible formats · maximum 250 MB</span></label><input id="audio-source" name="source" type="file" accept="audio/*,video/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.oga,.opus,.aiff,.aif,.mp4,.m4v,.mov,.mkv,.webm,.avi,.mpeg,.mpg,.3gp" required><div data-file-summary class="converter-file-summary" aria-live="polite">No file selected.</div></div>
 <fieldset><legend>Quality preset</legend><div class="preset-grid">
  <label><input type="radio" name="preset" value="studio" checked><span><strong>Studio master</strong>WAV · 24-bit · 48 kHz · stereo</span></label>
  <label><input type="radio" name="preset" value="lossless"><span><strong>Lossless archive</strong>FLAC · source quality preserved</span></label>
  <label><input type="radio" name="preset" value="mp3-high"><span><strong>MP3 maximum</strong>MP3 · 320 kbps · stereo</span></label>
  <label><input type="radio" name="preset" value="stream"><span><strong>Streaming AAC</strong>M4A · 256 kbps · 48 kHz</span></label>
  <label><input type="radio" name="preset" value="podcast"><span><strong>Podcast voice</strong>MP3 · 128 kbps · mono</span></label>
  <label><input type="radio" name="preset" value="custom"><span><strong>Custom</strong>Choose format and quality controls</span></label>
 </div></fieldset>
 <fieldset class="custom-audio-options" data-custom-options disabled><legend>Custom export settings</legend><div class="tool-grid">
  <label>Output format<select name="format"><option value="mp3">MP3</option><option value="wav">WAV</option><option value="flac">FLAC</option><option value="m4a">AAC / M4A</option><option value="ogg">OGG Vorbis</option><option value="opus">Opus</option></select></label>
  <label>Sample rate<select name="rate"><option value="source">Keep source rate</option><option value="44100">44.1 kHz</option><option value="48000">48 kHz</option><option value="88200">88.2 kHz</option><option value="96000">96 kHz</option></select></label>
  <label>Channels<select name="channels"><option value="source">Keep source channels</option><option value="2">Stereo</option><option value="1">Mono</option></select></label>
  <label>Bitrate<select name="bitrate"><option value="128k">128 kbps</option><option value="192k">192 kbps</option><option value="256k" selected>256 kbps</option><option value="320k">320 kbps</option></select></label>
  <label>WAV depth<select name="depth"><option value="pcm_s16le">16-bit PCM</option><option value="pcm_s24le" selected>24-bit PCM</option><option value="pcm_f32le">32-bit float</option></select></label>
  <label><input name="normalize" type="checkbox"> Normalize loudness to −14 LUFS</label>
 </div></fieldset>
 <details class="converter-advanced"><summary>Optional trim and metadata</summary><div class="tool-grid"><label>Start time<input name="start" placeholder="00:00:00" pattern="[0-9:.]+" inputmode="decimal"></label><label>End time<input name="end" placeholder="Leave blank for full file" pattern="[0-9:.]+" inputmode="decimal"></label><label>Title<input name="title" maxlength="160"></label><label>Artist<input name="artist" maxlength="160"></label><label>Album<input name="album" maxlength="160"></label></div></details>
 <div class="converter-progress" hidden data-progress-wrap><div><span data-progress-label>Preparing…</span><strong data-progress-value>0%</strong></div><progress data-progress max="100" value="0">0%</progress></div>
 <div class="tool-actions"><button class="button" type="submit" data-convert>Convert audio</button><button type="button" data-cancel disabled>Cancel</button><button type="reset">Start over</button></div>
 <div class="converter-result" data-converter-result role="status" aria-live="polite"></div>
</form></section>
<section class="shell section converter-guidance"><div><p class="eyebrow">QUALITY GUIDE</p><h2>Choose settings for the destination.</h2></div><div class="modern-paths"><article><span>01 / MASTER</span><h3>WAV or FLAC</h3><p>Use lossless output for archiving, mastering, distribution delivery, or another production stage. Converting a compressed source to lossless does not restore information already removed.</p></article><article><span>02 / LISTENING</span><h3>MP3 or AAC</h3><p>Use 256–320 kbps for high-quality sharing. Smaller voice files may use a lower bitrate and mono audio.</p></article><article><span>03 / MODERN WEB</span><h3>Opus or OGG</h3><p>Efficient formats can produce smaller files, but confirm that the intended platform and listener device accept them.</p></article></div></section>
<section class="shell section"><h2>Privacy, limits, and responsible use</h2><p>The selected audio or video file and converted output remain in browser memory and are not uploaded to Blindbandit Records. When you begin conversion, the browser downloads the FFmpeg WebAssembly engine from jsDelivr. That provider receives ordinary connection information but does not receive your media file from this tool. The page now shows separate engine-download and conversion progress. Conversion speed depends on file duration, format, device memory, and processor performance. Keep the page open until the download is ready.</p><p>Only convert material you own or are authorized to process. This utility does not remove copyright protection, watermarks, access controls, or platform restrictions. Review the <a href="/privacy/">privacy policy</a>, <a href="/copyright/">copyright policy</a>, and <a href="/terms/">website terms</a>.</p></section><link rel="stylesheet" href="/media-tools.css?v=2"><script src="/media-engine.js?v=2" defer></script><script src="/converter-presets.js?v=1" defer></script><script src="/audio-converter.js?v=3" defer></script>'''
    layout('/audio-converter/','Professional Audio Converter | Mr. Blindbandit',description,body)
    converter=output/'audio-converter/index.html'
    source=converter.read_text().replace('<body>','<body class="public-modern">',1).replace('<link rel="stylesheet" href="/styles.css">','<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/public-modern.css">',1)
    converter.write_text(source)
    if not any(route=='/audio-converter/' for _,route in pages): pages.append(('Professional audio converter','/audio-converter/'))
    # Add the converter to the self-updating resource surface without creating duplicate navigation systems.
    for rel in ('resources/index.html','index.html'):
        page=output/rel
        if page.exists():
            source=page.read_text()
            card='<a href="/audio-converter/" class="converter-feature-card"><span>AUDIO + VIDEO UTILITY</span><h3>Professional audio converter</h3><p>Convert audio or extract high-quality audio from MP4, MOV, MKV, WebM and other video files.</p><strong>Open converter ↗</strong></a>'
            marker='<div class="everyday-grid">'
            if marker in source: source=source.replace(marker,marker+card,1)
            page.write_text(source)
