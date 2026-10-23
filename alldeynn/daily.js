// Crée la vidéo du lendemain (Europe/Paris): produit, style, palette, accroche et musique variés sans répétition récente.
// usage: node daily.js [YYYY-MM-DD]   → écrit videos/<date>_<produit>_<style>_<palette>.mp4, met à jour history.json et écrit post.json
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const puppeteer=require('puppeteer');
const {POSTS,PRE}=require('./assets/posts_data.js');
const D=__dirname,CFG=JSON.parse(fs.readFileSync(path.join(D,'config.json'),'utf8'));
const FF=process.env.FFMPEG||'ffmpeg',FPS=30;
const STYLES={pub:['pub.html',15],gestes:['steps.html',16],edito:['edito.html',14]},PALS=['lilas','menthe','rose','bleu','sable'];
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const parisDate=(add=0)=>{const d=new Date(Date.now()+add*864e5);return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris'}).format(d)};
const date=process.argv[2]||parisDate(1);
const HIST=path.join(D,'history.json'),hist=fs.existsSync(HIST)?JSON.parse(fs.readFileSync(HIST,'utf8')):[];
const music=fs.readdirSync(path.join(D,'music')).filter(f=>/\.(mp3|m4a|wav|aac)$/i.test(f));
function pick(){
 const l3=hist.slice(-3),ok=c=>!hist.slice(-2).some(h=>h.p===c.p)&&!hist.slice(-1).some(h=>h.s===c.s)&&!l3.some(h=>h.pal===c.pal||h.m===c.m||h.hook===c.hook);
 for(let i=0;i<300;i++){const c={p:rnd(CFG.produits),s:rnd(Object.keys(STYLES)),pal:rnd(PALS),hook:Math.floor(Math.random()*8),m:rnd(music)};if(ok(c))return c}
 return {p:rnd(CFG.produits),s:rnd(Object.keys(STYLES)),pal:rnd(PALS),hook:0,m:rnd(music)};
}
(async()=>{
 const c=pick(),[page,DUR]=STYLES[c.s],name=`${date}_${c.p}_${c.s}_${c.pal}.mp4`,out=path.join(D,'videos',name),FR=path.join(D,'frames');
 fs.rmSync(FR,{recursive:true,force:true});fs.mkdirSync(FR,{recursive:true});fs.mkdirSync(path.join(D,'videos'),{recursive:true});
 const b=await puppeteer.launch({headless:true,executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--disable-setuid-sandbox','--allow-file-access-from-files']});
 const pg=await b.newPage();await pg.setViewport({width:1080,height:1920});
 await pg.goto('file://'+path.join(D,'assets',page).split(path.sep).join('/')+`?p=${c.p}&pal=${c.pal}&hook=${c.hook}`);await pg.evaluate(()=>document.fonts.ready);
 for(let i=0;i<DUR*FPS;i++){await pg.evaluate(t=>render(t),i/FPS);await pg.screenshot({path:path.join(FR,String(i).padStart(4,'0')+'.jpg'),type:'jpeg',quality:90})}
 await b.close();
 const ss=/^cc0_/.test(c.m)?['-ss',String(Math.floor(Math.random()*40))]:[];
 const r=spawnSync(FF,['-y','-framerate',FPS,'-i',path.join(FR,'%04d.jpg'),...ss,'-i',path.join(D,'music',c.m),'-map','0:v','-map','1:a','-t',DUR,
  '-af',`loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=${DUR-1}:d=1`,'-c:v','libx264','-crf','20','-preset','fast','-pix_fmt','yuv420p','-c:a','aac','-shortest','-movflags','+faststart',out],{encoding:'utf8'});
 if(r.status!==0){console.error(r.stderr.slice(-500));process.exit(1)}
 fs.rmSync(FR,{recursive:true,force:true});
 hist.push({date,...c,fichier:name});fs.writeFileSync(HIST,JSON.stringify(hist.slice(-60),null,1));
 // garde 14 jours de vidéos
 fs.readdirSync(path.join(D,'videos')).sort().slice(0,-14).forEach(f=>fs.rmSync(path.join(D,'videos',f)));
 const P=POSTS[c.p];
 fs.writeFileSync(path.join(D,'post.json'),JSON.stringify({date,heure:CFG.heure,fichier:name,produit:c.p,style:c.s,texte:`${P.a}\n\n${P.l}\n\n${P.p}${PRE}\n\n${P.h}`},null,1));
 console.log('OK',name,JSON.stringify(c));
})();
