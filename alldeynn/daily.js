// Crée le post du lendemain (Europe/Paris) selon la rotation de config.json: vidéo ou carrousel (edu, qr, routine, chiffre, quiz, duo).
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
const isoWeek=s=>{const t=new Date(s+'T12:00:00Z'),n=(t.getUTCDay()+6)%7;t.setUTCDate(t.getUTCDate()-n+3);const f=new Date(Date.UTC(t.getUTCFullYear(),0,4));return 1+Math.round(((t-f)/864e5-3+(f.getUTCDay()+6)%7)/7)};
// planning de la semaine ISO, différent chaque semaine: 3 ou 4 vidéos (en alternance), jamais 2 vidéos de suite, les autres jours = carrousels
// dont le type tourne dans CFG.types (pas de répétition dans la semaine). Graine = année*100+semaine → même plan pour tous les runs de la semaine.
function weekPlan(d){
 const t=new Date(d+'T12:00:00Z'),n=(t.getUTCDay()+6)%7;t.setUTCDate(t.getUTCDate()-n+3);
 const y=t.getUTCFullYear(),w=isoWeek(d);let a=y*100+w;
 const rand=()=>{a|=0;a=a+0x6D2B79F5|0;let r=Math.imul(a^a>>>15,1|a);r=r+Math.imul(r^r>>>7,61|r)^r;return((r^r>>>14)>>>0)/4294967296};
 const nVid=CFG.videos_par_semaine[w%CFG.videos_par_semaine.length],days=[1,2,3,4,5,6,0];// lundi..dimanche
 let vid;for(let i=0;i<500;i++){const p=days.map(x=>[rand(),x]).sort((x,y)=>x[0]-y[0]).slice(0,nVid).map(x=>x[1]);
  const idx=p.map(x=>days.indexOf(x)).sort((x,y)=>x-y);if(idx.every((v,j)=>!j||v-idx[j-1]>1)){vid=p;break}}
 vid=vid||[1,3,5].slice(0,nVid);
 const T=CFG.types,start=(w*5)%T.length,autres=days.filter(x=>!vid.includes(x)),plan={};
 vid.forEach(x=>plan[x]='video');autres.forEach((x,j)=>plan[x]=T[(start+j)%T.length]);return plan}
if(CFG.debut&&date<CFG.debut){fs.rmSync(path.join(D,'post.json'),{force:true});console.log('SKIP: avant le début ('+CFG.debut+'), semaine déjà programmée à la main');process.exit(0)}
const FMT=weekPlan(date)[new Date(date+'T12:00:00Z').getUTCDay()]||'video';
if(process.argv[3]==='plan'){const j=['dim','lun','mar','mer','jeu','ven','sam'];console.log([1,2,3,4,5,6,0].map(x=>j[x]+':'+weekPlan(date)[x]).join(' '));process.exit(0)}
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
const CAP2={
 chiffre:(n,P)=>`Un chiffre, une phrase : ${n}. Glisse pour tout voir.

${P.p}${PRE}

#BoostNaturel #ComplementAlimentaire`,
 quiz:(n,P)=>`Quiz ${n} : 3 questions, glisse pour les réponses.

${P.p}${PRE}

${P.h}`,
 duo:(n,P,n2,P2)=>`${n} ou ${n2} ? On les met côte à côte : format, prise, précautions. Glisse pour tout voir.

${n} : ${P.p}
${n2} : ${P2.p}${PRE}

#BoostNaturel #ComplementAlimentaire`};
Object.assign(CAP,CAP2);
// carrousel: une page slides.html?type=..&p=..&pal=.. capturée slide par slide (1080x1350)
async function carousel(type){
 const l3=hist.slice(-3),ok=c=>!hist.slice(-2).some(h=>h.p===c.p)&&!l3.some(h=>h.pal===c.pal);
 let c;for(let i=0;i<300&&!(c&&ok(c));i++)c={p:type==='routine'?'fish':rnd(CFG.produits),pal:rnd(PALS)};
 if(type==='duo')c.p2=rnd(CFG.produits.filter(x=>x!==c.p));
 const dir=`${date}_${type}_${c.p}`,out=path.join(D,'carrousels',dir);
 fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
 const b=await puppeteer.launch({headless:true,executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--disable-setuid-sandbox','--allow-file-access-from-files']});
 const pg=await b.newPage();await pg.setViewport({width:1080,height:1350});
 await pg.goto('file://'+path.join(D,'assets','slides.html').split(path.sep).join('/')+`?type=${type}&p=${c.p}&pal=${c.pal}${c.p2?'&p2='+c.p2:''}`);await pg.evaluate(()=>document.fonts.ready);
 const n=await pg.evaluate(()=>N),medias=[];
 for(let i=0;i<n;i++){await pg.evaluate(i=>show(i),i);await pg.evaluate(()=>document.fonts.ready);const f=`${String(i+1).padStart(2,'0')}.jpg`;await pg.screenshot({path:path.join(out,f),type:'jpeg',quality:92});medias.push(`carrousels/${dir}/${f}`)}
 await b.close();
 hist.push({date,f:type,...c,fichier:dir});fs.writeFileSync(HIST,JSON.stringify(hist.slice(-60),null,1));
 // garde 14 jours de carrousels
 fs.readdirSync(path.join(D,'carrousels')).sort().slice(0,-14).forEach(f=>fs.rmSync(path.join(D,'carrousels',f),{recursive:true,force:true}));
 fs.writeFileSync(path.join(D,'post.json'),JSON.stringify({date,heure:CFG.heure,format:'carrousel',type,medias,produit:c.p,style:type,texte:CAP[type](PRODUCTS_NAME[c.p],POSTS[c.p],c.p2&&PRODUCTS_NAME[c.p2],c.p2&&POSTS[c.p2])},null,1));
 console.log('OK',dir,n,'slides');
}
// mode catalogue: la routine écrit cat_products.json (3 produits tirés au hasard dans Shopify: slug,name,brand,detail,price,imgUrl,foot).
// Un jour vidéo sur deux (jamais 2 de suite) utilise un style catalogue: catalogue, magazine, neon, marque (1 produit) ou trio (3 produits).
const CATF=path.join(D,'cat_products.json'),CATS={catalogue:['catalogue.html',12.5],magazine:['magazine.html',9],neon:['neon.html',9],trio:['trio.html',9],marque:['marque.html',9],flash:['flash.html',10.5],collage:['collage.html',9]};
async function catProducts(){
 if(!fs.existsSync(CATF))return null;
 const l=JSON.parse(fs.readFileSync(CATF,'utf8'));if(!Array.isArray(l)||!l.length)return null;
 fs.mkdirSync(path.join(D,'assets','cat'),{recursive:true});
 for(const p of l){const r=await fetch(p.imgUrl+(p.imgUrl.includes('?')?'&':'?')+'width=900');if(!r.ok)throw new Error('image '+r.status+' '+p.imgUrl);
  fs.writeFileSync(path.join(D,'assets','cat',p.slug+'.jpg'),Buffer.from(await r.arrayBuffer()));p.img='cat/'+p.slug+'.jpg'}
 return l}
(async()=>{
 if(FMT!=='video')return carousel(FMT);
 const cat=hist.length&&hist[hist.length-1].cat?null:await catProducts();
 let c,page,DUR,name;
 if(cat){
  const styles=Object.keys(CATS).filter(s=>(cat.length>=3||s!=='trio')&&!hist.slice(-2).some(h=>h.s===s));
  c={cat:true,p:cat[0].slug,s:rnd(styles),pal:rnd(PALS),hook:0,m:rnd(music)};[page,DUR]=CATS[c.s];
  fs.writeFileSync(path.join(D,'assets','product.js'),'window.CP='+JSON.stringify(cat[0])+';');
  fs.writeFileSync(path.join(D,'assets','trio.js'),'window.CPS='+JSON.stringify(cat.slice(0,3))+';');
 }else{c=pick();[page,DUR]=STYLES[c.s]}
 name=`${date}_${c.p}_${c.s}_${c.pal}.mp4`;const out=path.join(D,'videos',name),FR=path.join(D,'frames');
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
 // légende catalogue: seulement les infos de la fiche (nom, marque, format), jamais de prix ni de lien (règle TikTok)
 const texte=cat?(c.s==='trio'?`3 idées du jour : ${cat.slice(0,3).map(p=>p.name+' ('+p.brand+')').join(', ')}.`:`${cat[0].name} (${cat[0].brand}) : ${cat[0].detail.replace(/ · /g,', ')}.`)+(cat[0].foot&&/alimentaire/i.test(cat[0].foot)?`\n\n${cat[0].foot}`:'')+'\n\n#BoostNaturel':(P=>`${P.a}\n\n${P.l}\n\n${P.p}${PRE}\n\n${P.h}`)(POSTS[c.p]);
 fs.writeFileSync(path.join(D,'post.json'),JSON.stringify({date,heure:CFG.heure,format:'video',medias:['videos/'+name],fichier:name,produit:c.p,style:c.s,catalogue:!!cat,texte},null,1));
 console.log('OK',name,JSON.stringify(c));
})();

