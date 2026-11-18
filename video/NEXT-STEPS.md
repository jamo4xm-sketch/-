# Alumni campaign video – remaining work

Status: `video/src/` holds the current version (65 s, UTAS Ibri flyer theme, real logo).
The prizes screen (scene 4) is updated to «تنتظركم جوائز وسحوبات قيّمة!» (no fixed number 30).
The rendered `utas-alumni-campaign.mp4` is still the earlier cut.

Still to do (needs the ElevenLabs connector):

1. Scene 1 graduate image (`grad.png`): regenerate in UTAS graduation attire, using
   `src/attire_ref.jpg` (face cropped out) / `ref-utas-graduation-attire.jpg` as the reference: navy gown, light silver-blue satin stole
   with blue piping and the UTAS orange/blue emblem, Omani massar (embroidered turban) or kumma,
   holding the navy UTAS certificate folder. Generate on a flat light-grey background, then cut out
   with `python3 cutout.py raw.png grad.png 24`.
2. (Done) Scene 4 voice-over: the "ثلاثون جائزة قيمة" words were cut from vo.mp3 and replaced by a chime pause while «جوائز وسحوبات قيّمة!» pops on screen. Optionally re-record that line with Mansour later.
3. Render: `node render.js <dir> <dir>/silent.mp4`, then mix vo1.mp3 + vo.mp3 slices + music.wav
   (`python3 music.py music.wav` with dur=66) as in the previous ffmpeg command.
