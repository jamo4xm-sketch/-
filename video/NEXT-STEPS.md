# Alumni campaign video – remaining work

Status: `video/src/` holds the current version (65 s, UTAS Ibri flyer theme, real logo).
The prizes screen (scene 4) is updated to «تنتظركم جوائز وسحوبات قيّمة!» (no fixed number 30).
The rendered `utas-alumni-campaign.mp4` is still the earlier cut.

Still to do (needs the ElevenLabs connector):

1. Scene 1 graduate image (`grad.png`): regenerate in UTAS graduation attire, using
   `ref-utas-graduation-attire.jpg` as the reference: navy gown, light silver-blue satin stole
   with blue piping and the UTAS orange/blue emblem, Omani massar (embroidered turban) or kumma,
   holding the navy UTAS certificate folder. Generate on a flat light-grey background, then cut out
   with `python3 cutout.py raw.png grad.png 24`.
2. Scene 4 voice-over: same voice "Mansour" (voice_id 5HAezIQAaoSgJypcI0NP, eleven_multilingual_v2).
   New line: «وتقديراً لمبادرتِكم وتفاعلِكم... تنتظرُكم جوائزُ وسحوباتٌ قيّمة! مخصّصةً لفئتين:
   الأولى لأوّلِ عشرةِ مسجّلين، والثانيةُ للرقمِ الرابحِ عبرَ السحب!»
   Place it at 38.0 s (scene 4 = 37.5–51.5 s), replacing the vo.mp3 slice 33.28–46.55,
   and retime the scene-4 subtitles in `cfg.js` and the card cue times in `index.html`.
3. Render: `node render.js <dir> <dir>/silent.mp4`, then mix vo1.mp3 + vo.mp3 slices + music.wav
   (`python3 music.py music.wav` with dur=66) as in the previous ffmpeg command.
