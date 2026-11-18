const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const dir=process.argv[2],out=process.argv[3],fps=30;
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('file://'+dir+'/index.html');await p.evaluate(()=>document.fonts.ready);
const dur=await p.evaluate(()=>CFG.dur);const N=Math.round(dur*fps);
const ff=spawn('ffmpeg',['-y','-f','image2pipe','-framerate',String(fps),'-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',out],{stdio:['pipe','ignore','ignore']});
for(let i=0;i<N;i++){await p.evaluate(t=>render(t),i/fps);const buf=await p.screenshot({type:'jpeg',quality:92});
 if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r)); if(i%300==0)console.log(i,'/',N);}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();})();
