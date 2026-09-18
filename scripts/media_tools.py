"""Local creator tools, integrated before the shared SEO and navigation build."""
import html
from media_effects import EFFECTS, fields as effect_fields

TOOLS=[
 ('art-track','Art Track & Podcast Generator','Turn a song or episode into a horizontal or vertical video.'),
 ('audiogram','Social Audiogram','Select a clip and export a social video with a moving visualizer.'),
 ('metadata-editor','Audio Metadata Editor','Edit title, artist and album tags without re-encoding supported audio.'),
 ('waveform-image','Waveform Image Generator','Create a waveform image from your audio.'),
 ('artwork-resizer','Artwork Resizer','Prepare cover art for square, vertical and horizontal destinations.'),
 ('audio-check','Loudness & Audio Check','Measure audio levels and inspect clipping indicators.'),
 ('audio-clipper','Audio Clipper','Preview and trim an excerpt using precise time controls.'),
 ('audio-fade','Audio Fade In & Out','Add smooth beginnings and endings to your audio.'),
 ('audio-speed','Audio Speed Changer','Change playback speed while keeping the original pitch.'),
 ('audio-reverse','Audio Reverser','Create reversed audio for sound design and creative effects.')
]
TOOLS += EFFECTS

def add_media_tools(output,layout,pages):
 def select(name,label,options):
  return '<label>'+label+'<select name="'+name+'">'+''.join('<option value="'+str(v)+'">'+t+'</option>' for v,t in options)+'</select></label>'
 shape=select('platform','Destination',[('youtube','YouTube — horizontal'),('vertical','Generic vertical'),('tiktok','TikTok'),('reels','Instagram Reels'),('shorts','YouTube Shorts')])
 quality=select('quality','Video quality',[(1080,'1080p Full HD — recommended'),(720,'720p HD'),(144,'144p Tiny'),(240,'240p'),(360,'360p'),(480,'480p'),(1440,'1440p QHD'),(2160,'2160p 4K')])
 for slug,title,desc in TOOLS:
  video=slug in ('art-track','audiogram')
  imageonly=slug=='artwork-resizer'
  fields=''
  if slug=='art-track':fields+='<fieldset><legend>Mode</legend><label><input type="radio" name="mode" value="art" checked> Art Track</label><label><input type="radio" name="mode" value="podcast"> Podcast — artwork optional</label></fieldset>'
  if imageonly:fields+='<label>Choose artwork<input name="artwork" type="file" accept="image/jpeg,image/png,image/webp" required></label>'
  else:
   fields+='<label>Choose audio'+(' or video' if slug=='audio-clipper' else '')+'<input name="source" type="file" accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,.aiff'+(',video/*,.mp4,.webm' if slug=='audio-clipper' else '')+'" required></label>'
   if video:fields+='<label>Artwork'+(' (required for Art Track)' if slug=='art-track' else ' (optional)')+'<input name="artwork" type="file" accept="image/jpeg,image/png,image/webp"></label>'
  fields+='<p class="media-notice">Your media is processed locally on this device and is not uploaded to our server for conversion or rendering. Maximum audio/video source: 250 MB.</p>'
  if not imageonly:fields+='<button type="button" data-inspect>Read metadata and preview</button><audio data-audio controls aria-label="Source audio preview"></audio>'
  if video or slug in ('metadata-editor','waveform-image'):
   fields+='<div class="media-grid"><label>Title / episode title<input name="title" maxlength="180"></label><label>Artist / author<input name="artist" maxlength="180"></label><label>Album / podcast name<input name="album" maxlength="180"></label></div>'
  if video:
   fields+='<label><input type="checkbox" name="showtext" checked> Show title and artist</label><button type="button" data-restore-visuals>Restore title + waveform</button><div class="media-grid">'+shape+quality+'<label><input name="showvisual" type="checkbox" checked> Show waveform</label>'+select('visualizer','Waveform style',[('wave','Waveform'),('bars','Bars'),('spectrum','Spectrum')])+'</div><p data-layout role="status"></p><p class="media-notice">4K and long videos can take substantial time and memory. 1080p is recommended. Platform safe regions are conservative guides and may vary by app/device.</p>'
  if slug in ('audiogram','audio-clipper'):
   fields+='<div class="media-grid"><label>Start (seconds)<input name="start" type="number" min="0" step="0.01" value="0"></label><label>End (seconds)<input name="end" type="number" min="0.01" step="0.01" value="30"></label></div><button type="button" data-play-clip>Play selected clip</button>'
   if slug=='audio-clipper':fields+='<button type="button" data-silence>Detect leading/trailing silence</button>'+select('format','Export format',[('wav','WAV — lossless'),('mp3','MP3 — 320 kbps'),('flac','FLAC — lossless')])
  if slug in ('audio-fade','audio-speed','audio-reverse'):
   if slug=='audio-fade':fields+='<div class="media-grid"><label>Fade in (seconds)<input name="fadein" type="number" min="0" step="0.01" value="1" required></label><label>Fade out (seconds)<input name="fadeout" type="number" min="0" step="0.01" value="2" required></label></div>'
   if slug=='audio-speed':fields+=select('speed','Playback speed',[(0.5,'0.5× — half speed'),(0.75,'0.75×'),(1,'1× — original'),(1.25,'1.25×'),(1.5,'1.5×'),(2,'2× — double speed')]).replace('value="1"','value="1" selected')
   if slug=='audio-reverse':fields+='<p>Reverses the entire audio, including speech. Use sources up to 10 minutes; reversing buffers the source in memory.</p>'
   fields+=select('format','Export format',[('wav','WAV — 24-bit lossless'),('mp3','MP3 — 320 kbps'),('flac','FLAC — lossless')])
  if slug in {item[0] for item in EFFECTS}:fields+=effect_fields(slug,select)
  if slug=='artwork-resizer':fields+=select('size','Canvas size',[('3000x3000','3000 × 3000'),('2000x2000','2000 × 2000'),('1400x1400','1400 × 1400'),('1080x1080','1080 × 1080'),('1080x1920','1080 × 1920 vertical'),('1920x1080','1920 × 1080 horizontal')])
  if slug=='waveform-image':fields+=select('size','Image shape',[('1600x900','Horizontal'),('1080x1080','Square'),('900x1600','Vertical')])+'<label><input type="checkbox" name="transparent"> Transparent PNG</label>'
  if video or slug in ('waveform-image','artwork-resizer','audio-clipper'):
   fields+='<canvas data-preview width="960" height="540" role="img" aria-label="Media layout or waveform preview"></canvas><p>Layout preview shows title, artwork and waveform. For the exact moving effect, use Render exact 3-second preview. Silent audio produces a flat waveform.</p>'
  action='Generate video' if video else 'Analyze audio' if slug=='audio-check' else 'Save metadata copy' if slug=='metadata-editor' else 'Export file'
  fields+='<div class="media-actions"><button class="button" type="submit">'+action+'</button><button type="button" data-cancel disabled>Cancel processing</button><button type="button" data-reset-preferences>Reset saved preferences</button></div>'
  if slug in {item[0] for item in EFFECTS}:fields=fields.replace('data-reset-preferences>','data-reset-preferences hidden>')
  helpblock='<section class="media-help"><h2>How to use this tool</h2><ol><li>Choose your source file using the labeled file button.</li><li>Review metadata, preview and the relevant destination settings.</li><li>Start processing and keep this page open.</li><li>Download or share your finished file from the completion dialog.</li></ol><h3>Supported files and device limits</h3><p>Common audio inputs include MP3, WAV, FLAC, M4A/AAC, OGG and Opus when the bundled engine can decode the codec. Images: JPEG, PNG and WebP. Convert HEIC to JPEG first. Large sources, long podcasts and 4K exports can exceed browser memory. Try a shorter clip or lower resolution if an export fails.</p><h3>Privacy and troubleshooting</h3><p>Source media stays in this browser session. The engine downloads from jsDelivr on first use; the provider receives ordinary connection information but no source media from these tools. Only non-sensitive destination preferences are saved locally. Retry after an engine error, close memory-heavy tabs or try a different browser. No higher-resolution setting can restore detail absent from your source.</p><h3>Accessibility</h3><p>Controls have text labels, timelines use numeric time fields, and downloads open in a keyboard-accessible dialog. <a href="/accessibility/">Accessibility information and issue reporting</a>.</p></section>'
  body='<link rel="stylesheet" href="/media-tools.css?v=2"><section class="shell media-suite"><a href="/media-tools/">All media tools</a><p class="eyebrow">MR. BLINDBANDIT / CREATOR TOOLS</p><h1>'+title+'</h1><p class="lede">'+desc+'</p><img class="media-hero-image" src="/assets/media/creator-suite.webp" srcset="/assets/media/creator-suite-small.webp 640w, /assets/media/creator-suite.webp 1600w" sizes="(max-width: 700px) 100vw, 1100px" width="1600" height="900" alt="" decoding="async"><form data-media-tool="'+slug+'">'+fields+'</form><section class="media-health" aria-label="Engine health"><p data-health role="status" aria-live="polite">Ready to choose a file. Engine loads on demand.</p><progress data-job-progress max="100" hidden aria-label="Processing progress"></progress><details><summary>Technical details</summary><p>Browser-local FFmpeg WebAssembly worker, Canvas and Web Audio. Single-worker fallback does not require SharedArrayBuffer. Files are not retained after reload.</p></details></section><div data-results></div>'+helpblock+'</section><script src="/media-engine.js?v=2" defer></script><script src="/media-effects.js?v=1" defer></script><script src="/media-tools.js?v=4" defer></script>'
  route='/'+slug+'/'
  layout(route,title+' | Mr. Blindbandit',desc,body)
  pages.append((title,route))
 cards='<a class="media-card" href="/audio-converter/"><h2>Audio Converter</h2><p>Audio conversion and video-to-audio extraction.</p><span>Local processing →</span></a>'
 for slug,title,desc in TOOLS:cards+='<a class="media-card" href="/'+slug+'/"><h2>'+title+'</h2><p>'+desc+'</p><span>Local processing →</span></a>'
 layout('/media-tools/','Media Hub — Audio & Video Tools | Mr. Blindbandit','Create art tracks, podcast videos, audiograms and audio files locally in your browser.','<link rel="stylesheet" href="/media-tools.css?v=2"><section class="shell media-suite"><p class="eyebrow">THE CREATOR TOOLBOX</p><h1>Media Hub</h1><p class="lede">Your source files stay on your device. Choose your media, pick a destination and let the tools handle the technical details.</p><img class="media-hero-image" src="/assets/media/creator-suite.webp" srcset="/assets/media/creator-suite-small.webp 640w, /assets/media/creator-suite.webp 1600w" sizes="(max-width: 700px) 100vw, 1100px" width="1600" height="900" alt="" decoding="async"><div class="media-grid">'+cards+'</div></section>')
 pages.append(('Media Tools','/media-tools/'))
 for rel in ('index.html','resources/index.html'):
  p=output/rel
  if p.exists():
   text=p.read_text()
   if rel=='index.html':
    text=text.replace('<main id="main"', '<main id="main"',1)
    marker=text.index('>',text.index('<main '))+1
    text=text[:marker]+'<section class="shell media-hub-shortcut" aria-label="Creator tools"><a class="button" href="/media-tools/">Open Media Hub</a><p>Art tracks, waveforms, audio conversion and editing tools.</p></section>'+text[marker:]
   else:text=text.replace('</main>','<section class="shell"><a class="button" href="/media-tools/">Open Media Hub</a></section></main>',1)
   p.write_text(text)
