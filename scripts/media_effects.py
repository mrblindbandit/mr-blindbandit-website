"""Complete controls and help for the seven additional audio processors."""
import html,json
EFFECTS=[
 ('audio-volume','Volume & Peak Limiter','Adjust gain in decibels and optionally limit peaks.'),
 ('audio-equalizer','Three-Band Equalizer','Shape bass, midrange and treble with adjustable gain and presets.'),
 ('audio-pitch','Pitch Shifter','Shift pitch up or down while keeping approximately the original duration.'),
 ('audio-channels','Audio Channel Converter','Convert mono or stereo, extract a channel, or swap left and right.'),
 ('audio-loop','Audio Looper','Repeat audio with optional fades at the joins.'),
 ('audio-compressor','Audio Compressor','Control dynamic range with threshold, ratio, attack and release.'),
 ('audio-silence','Silence Remover','Trim silent edges or remove long pauses throughout a recording.')
]
def fields(slug,select):
 def number(name,label,value,lo,hi,step=1):
  return f'<label>{label}<input name="{name}" type="number" value="{value}" min="{lo}" max="{hi}" step="{step}" required></label>'
 def preset(options):
  return '<label>Preset<select data-effect-preset="'+html.escape(json.dumps(options),quote=True)+'"><option value="">Custom settings</option>'+''.join('<option value="'+html.escape(k)+'">'+html.escape(k)+'</option>' for k in options)+'</select></label>'
 limiter='<label><input name="limiter" type="checkbox" checked> Protect peaks with a limiter</label>'
 notes={
 'audio-volume':'Positive gain makes audio louder; it can clip when the limiter is off. The limiter prevents sample peaks above the ceiling, but does not guarantee a true-peak mastering target.',
 'audio-equalizer':'Bass is centered at 120 Hz, midrange at 1 kHz, and treble at 6 kHz. Lower the preamp when boosting bands. The optional limiter ceiling is −1 dBFS.',
 'audio-pitch':'One semitone is one piano key; 12 semitones is an octave. Duration is preserved approximately. Large shifts can sound artificial and this is not a formant-preserving vocal processor.',
 'audio-channels':'Mono combines channels. Stereo creates a two-channel file; a mono source remains the same sound in both channels. Extract left, extract right, and swap require a stereo source.',
 'audio-loop':'Repeat count includes the original play. Optional edge fades soften each join; they do not overlap or crossfade the repeats. Sources are limited to 5 minutes and output to 60 minutes to control memory.',
 'audio-compressor':'Compression reduces differences between louder and quieter sections. Threshold is in dBFS; attack and release are milliseconds. Makeup gain raises the processed level. The optional output limiter ceiling is −1 dBFS.',
 'audio-silence':'Review carefully: a threshold that is too high can remove quiet speech or music. Edge mode removes only leading and trailing silence. All-pauses mode shortens pauses of at least the selected duration; the detection window can remain at a cut. Keep-silence retains a little breathing room. Sources are limited to 10 minutes.'}
 s='<fieldset data-effect-settings><legend>Processing settings</legend>'
 if slug=='audio-volume':s+=preset({'Gentle boost':{'gain':3},'Reduce level':{'gain':-6},'Original level':{'gain':0}})+number('gain','Gain (dB)',0,-60,24,.5)+limiter+number('ceiling','Limiter ceiling (dBFS)',-1,-12,0,.1)
 if slug=='audio-equalizer':s+=preset({'Flat':{'bass':0,'mid':0,'treble':0,'preamp':0},'Warm':{'bass':3,'mid':0,'treble':-2,'preamp':-3},'Speech clarity':{'bass':-3,'mid':3,'treble':2,'preamp':-5},'Bright':{'bass':-2,'mid':0,'treble':4,'preamp':-4}})+''.join(number(k,label,0,-18,18,.5) for k,label in [('bass','Bass gain (dB)'),('mid','Midrange gain (dB)'),('treble','Treble gain (dB)')])+number('preamp','Preamp (dB)',-3,-24,0,.5)+limiter
 if slug=='audio-pitch':s+=preset({'Octave down':{'semitones':-12},'Down two semitones':{'semitones':-2},'Original pitch':{'semitones':0},'Up two semitones':{'semitones':2},'Octave up':{'semitones':12}})+number('semitones','Pitch shift (semitones)',0,-12,12,.1)
 if slug=='audio-channels':s+=select('channelmode','Channel operation',[('mono','Mix to mono'),('stereo','Convert to stereo'),('left','Extract left channel'),('right','Extract right channel'),('swap','Swap left and right')])
 if slug=='audio-loop':s+=number('repeats','Total repeats',2,2,20)+number('edgefade','Fade at each edge (seconds)',0,0,5,.01)
 if slug=='audio-compressor':s+=preset({'Gentle music':{'threshold':-18,'ratio':2,'attack':20,'release':250,'makeup':0},'Speech':{'threshold':-24,'ratio':3,'attack':10,'release':150,'makeup':3},'Firm control':{'threshold':-12,'ratio':6,'attack':5,'release':100,'makeup':0}})+number('threshold','Threshold (dBFS)',-18,-48,0,.5)+number('ratio','Ratio (to 1)',2,1,20,.1)+number('attack','Attack (milliseconds)',20,.1,2000,.1)+number('release','Release (milliseconds)',250,1,9000)+number('makeup','Makeup gain (dB)',0,0,24,.5)+limiter
 if slug=='audio-silence':s+=select('silencemode','Removal mode',[('edges','Only leading and trailing silence'),('all','Long pauses throughout')])+number('threshold','Silence threshold (dBFS)',-45,-80,-10)+number('silenceduration','Minimum internal pause (seconds)',.5,.1,10,.1)+number('keep','Retain silence at cuts (seconds)',.1,0,1,.01)
 s+='</fieldset><p class="media-notice">'+notes[slug]+'</p>'+select('format','Export format',[('wav','WAV — 24-bit / 48 kHz'),('mp3','MP3 — 320 kbps / 48 kHz'),('flac','FLAC — lossless / 48 kHz')])
 s+='<p>Listen to the original above, then generate a processed preview below. A preview contains up to the first 10 seconds of the processed output. Export file processes the complete source. All exports are copies; raising sample rate or bit depth does not restore missing detail.</p><button type="button" data-effect-preview>Preview processed audio</button><button type="button" data-effect-reset>Reset effect settings</button>'
 return s
