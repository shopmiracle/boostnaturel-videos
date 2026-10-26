// Crée le post du lendemain (Europe/Paris) selon la rotation de config.json: vidéo, carrousel éducatif (edu), Q/R (qr) ou routine.
// usage: node daily.js [YYYY-MM-DD]   → écrit videos/<date>_...mp4 ou carrousels/<date>_<type>_<produit>/NN.jpg, met à jour history.json et écrit post.json
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const puppeteer=require('puppeteer');
const {POSTS,PRE}=require('./assets/posts_data.js');
const PRODUCTS_NAME={fish:'Collarose Fish',caps:'Collarose Caps',vita:'Vitarose',zinc:'Zinc 15 mg',sleep:'AllDeynn Sleeprose',d3k2:'Vitamine D3 + K2',d3drops:'Vitamine D3 gouttes',fishfram:'Collarose Fish framboise'};
const D=__dirname,CFG=JSON.parse(fs.readFileSync(path.join(D,'config.json'),'utf8'));
const FF=process.env.FFMPEG||'ffmpeg',FPS=30;
const STYLES={pub:['pub.html',15],gestes:['steps.html',16],edito:['edito.html',14]},PALS=['lilas','menthe','rose','bleu','sable'];
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const parisDate=(add=0)=>{const d=new Date(Date.now()+add*864e5);return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris'}).format(d)};
const date=process.argv[2]||parisDate(1);
const FMT=(CFG.rotation||{})[new Date(date+'T12:00:00Z').getUTCDay()]||'video';
const HIST=path.join(D,'history.json'),hist=fs.existsSync(HIST)?JSON.parse(fs.readFileSync(HIST,'utf8')):[];
const music=fs.readdirSync(path.join(D,'music')).filter(f=>/\.(mp3|m4a|wav|aac)$/i.test(f));
function pick(){
 const l3=hist.slice(-3),ok=c=>!hist.slice(-2).some(h=>h.p===c.p)&&!hist.slice(-1).some(h=>h.s===c.s)&&!l3.some(h=>h.pal===c.pal||h.m===c.m||h.hook===c.hook);
 for(let i=0;i<300;i++){const c={p:rnd(CFG.produits),s:rnd(Object.keys(STYLES)),pal:rnd(PALS),hook:Math.floor(Math.random()*8),m:rnd(music)};if(ok(c))return c}
 return {p:rnd(CFG.produits),s:rnd(Object.keys(STYLES)),pal:rnd(PALS),hook:0,m:rnd(music)};
}
const CAP={
 edu:(n,P)=>`3 choses à savoir sur ${n} : ce qu'il y a dedans, comment le prendre, les précautions. Glisse pour tout voir.

${P.p}${PRE}

${P.h}`,
 qr:(n,P)=>`Vos questions sur ${n}, on répond en 3 slides. Glisse pour tout voir.

${P.p}${PRE}

${P.h}`,
 routine:()=>`Les moments de prise des produits, produit par produit, d'après les fiches. Doses et précautions : voir chaque emballage.${PRE}

#BoostNaturel #ComplementAlimentaire`};
// carrousel: une page slides.html?type=..&p=..&pal=.. capturée slide par slide (1080x1350)
async function carousel(type){
 const l3=hist.slice(-3),ok=c=>!hist.slice(-2).some(h=>h.p===c.p)&&!l3.some(h=>h.pal===c.pal);
 let c;for(let i=0;i<300&&!(c&&ok(c));i++)c={p:type==='routine'?'fish':rnd(CFG.produits),pal:rnd(PALS)};
 const dir=`${date}_${type}_${c.p}`,out=path.join(D,'carrousels',dir);
 fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
 const b=await puppeteer.launch({headless:true,executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--disable-setuid-sandbox','--allow-file-access-from-files']});
 const pg=await b.newPage();await pg.setViewport({width:1080,height:1350});
 await pg.goto('file://'+path.join(D,'assets','slides.html').split(path.sep).join('/')+`?type=${type}&p=${c.p}&pal=${c.pal}`);await pg.evaluate(()=>document.fonts.ready);
 const n=await pg.evaluate(()=>N),medias=[];
 for(let i=0;i<n;i++){await pg.evaluate(i=>show(i),i);await pg.evaluate(()=>document.fonts.ready);const f=`${String(i+1).padStart(2,'0')}.jpg`;await pg.screenshot({path:path.join(out,f),type:'jpeg',quality:92});medias.push(`carrousels/${dir}/${f}`)}
 await b.close();
 hist.push({date,f:type,...c,fichier:dir});fs.writeFileSync(HIST,JSON.stringify(hist.slice(-60),null,1));
 // garde 14 jours de carrousels
 fs.readdirSync(path.join(D,'carrousels')).sort().slice(0,-14).forEach(f=>fs.rmSync(path.join(D,'carrousels',f),{recursive:true,force:true}));
 fs.writeFileSync(path.join(D,'post.json'),JSON.stringify({date,heure:CFG.heure,format:'carrousel',type,medias,produit:c.p,style:type,texte:CAP[type](PRODUCTS_NAME[c.p],POSTS[c.p])},null,1));
 console.log('OK',dir,n,'slides');
}
(async()=>{
 if(FMT!=='video')return carousel(FMT);
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
 fs.writeFileSync(path.join(D,'post.json'),JSON.stringify({date,heure:CFG.heure,format:'video',medias:['videos/'+name],fichier:name,produit:c.p,style:c.s,texte:`${P.a}\n\n${P.l}\n\n${P.p}${PRE}\n\n${P.h}`},null,1));
 console.log('OK',name,JSON.stringify(c));
})();
