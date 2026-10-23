// fiches produits (textes tirés des fiches Shopify, rien d'inventé) + fruits illustrés
const PRODUCTS={
 fish:{img:'fish.jpg',name:'Collarose Fish',tag:'COLLAGÈNE MARIN',format:'300 g',price:'38,99 €',
  foot:'Contient du poisson. Complément alimentaire : respecter la dose recommandée.',
  tint:['#FFE3C7','#F6A98F'],fruits:['mango','passion'],stepsFruit:true,
  msgs:[['Collagène marin','300 g'],['Saveur mangue','fruit de la passion'],['À mélanger dans l’eau,','un jus ou un smoothie']],
  steps:[['Mesure la dose','indiquée sur l’emballage'],['Mélange','dans l’eau, un jus ou un smoothie'],['Chaque jour','à tout moment, toujours au même moment']],
  edLab:['SAVEUR','Mangue<br>fruit de la passion'],edIng:'Acide hyaluronique<br>Collagène · Biotine'},
 caps:{img:'caps.jpg',name:'Collarose Caps',tag:'COLLAGÈNE',format:'180 gélules',price:'22,99 €',
  foot:'+18 ans. Déconseillé en cas de calculs rénaux. Complément alimentaire : respecter la dose recommandée.',
  tint:['#FFE9C9','#F7B96B'],fruits:['orange'],stepsFruit:false,wide:true,
  msgs:[['Collagène','180 gélules'],['Vitamine C,','acide hyaluronique, biotine'],['3 gélules, 2 fois par jour,','avec beaucoup d’eau']],
  steps:[['3 gélules','par prise'],['2 fois par jour','matin et après-midi'],['Avec beaucoup d’eau','toujours au même moment']],
  edLab:['INGRÉDIENT CLÉ','Vitamine C'],edIng:'Collagène (Verisol) · Biotine<br>Vitamine C · Acide hyaluronique'},
 vita:{img:'vita.jpg',name:'Vitarose',tag:'COMPLÉMENT ALIMENTAIRE',format:'120 comprimés',price:'15,99 €',
  foot:'+18 ans. Pas avec des anticoagulants (vitamine K). Avis médical conseillé.',
  tint:['#E3F1DA','#9CCB8E'],fruits:['pomegranate','blueberry'],stepsFruit:false,wide:true,
  msgs:[['Complément alimentaire','120 comprimés'],['Vitamines, minéraux','et extraits de plantes'],['2 comprimés, 2 fois par jour,','après le repas']],
  steps:[['2 comprimés','par prise'],['2 fois par jour','matin et après-midi, après le repas'],['Avec beaucoup d’eau','maximum 4 par jour']],
  edLab:['EXTRAITS DE PLANTES','Olivier, raisin,<br>grenade, thé vert,<br>myrtille'],edIng:'Vitamines<br>Minéraux · Extraits de plantes'},
 zinc:{img:'zinc.jpg',name:'Zinc 15 mg',tag:'ALLNUTRITION · FRESH MINT',format:'120 pastilles',price:'10,99 €',
  foot:'Ne pas dépasser 1 pastille par jour. +18 ans. Complément alimentaire : respecter la dose recommandée.',
  tint:['#DFF3EA','#8DD1B5'],fruits:[],stepsFruit:false,wide:true,
  msgs:[['Zinc 15 mg','Fresh Mint'],['Le zinc contribue','à une peau normale'],['1 pastille par jour,','après un repas']],
  steps:[['1 pastille','par jour'],['À sucer','après un repas'],['Patiente 30 min','avant de manger ou boire']],
  edLab:['SAVEUR','Menthe fraîche'],edIng:'Zinc 15 mg<br>120 pastilles'},
 sleep:{img:'sleep.jpg',name:'AllDeynn Sleeprose',tag:'COMPLÉMENT DU SOIR',format:'280 g',price:'23,99 €',
  foot:'Avis d’un professionnel de santé en cas de grossesse, d’allaitement ou de traitement. Respecter la dose recommandée.',
  tint:['#E3E6F8','#8E9AD8'],fruits:['orange'],stepsFruit:false,wide:false,
  msgs:[['Complément du soir','pot de 280 g'],['Saveur citron orange','en poudre'],['À mélanger dans l’eau,','un jus ou un smoothie']],
  steps:[['Mesure la dose','indiquée sur l’emballage'],['Mélange','dans l’eau, un jus ou un smoothie'],['Le soir','durée selon l’emballage']],
  edLab:['SAVEUR','Citron orange'],edIng:'Complément du soir<br>Poudre · 280 g'},
 d3k2:{img:'d3k2.jpg',name:'Vitamine D3 + K2',tag:'VITAMINE D3 4000 + K2',format:'60 capsules molles',price:'10,99 €',
  foot:'Pas avec des anticoagulants antagonistes de la vitamine K. Respecter la dose journalière recommandée.',
  tint:['#FFF1C4','#F6C85F'],fruits:[],stepsFruit:false,wide:false,
  msgs:[['Vitamine D3 4000','+ vitamine K2'],['En capsules molles','boîte de 60'],['1 capsule par jour,','au repas, avec de l’eau']],
  steps:[['1 capsule','par jour'],['Au repas','avec de l’eau'],['Chaque jour','sans dépasser la dose']],
  edLab:['COMPOSITION','Vitamine D3<br>+ vitamine K'],edIng:'Vitamine D3 4000<br>Capsules molles · 60'},
 d3drops:{img:'d3drops.jpg',name:'Vitamine D3 gouttes',tag:'VITAMINE D3 4000',format:'flacon 30 ml',price:'8,99 €',
  foot:'Ne pas dépasser la dose journalière recommandée. À conserver à l’abri de la lumière. Complément alimentaire.',
  tint:['#FFF3D6','#F3C37A'],fruits:[],stepsFruit:false,wide:true,
  msgs:[['Vitamine D3 4000','en gouttes'],['1 goutte par jour,','sous la langue'],['Garde 30 secondes,','puis avale']],
  steps:[['1 goutte','par jour'],['Sous la langue','30 secondes'],['Puis avale','flacon à l’abri de la lumière']],
  edLab:['MODE D’EMPLOI','1 goutte<br>sous la langue'],edIng:'Vitamine D3 4000<br>Flacon de 30 ml'},
 fishfram:{img:'fishfram.jpg',name:'Collarose Fish',tag:'COLLAGÈNE MARIN · FRAMBOISE',format:'180 pastilles',price:'29,99 €',
  foot:'Contient du poisson. Complément alimentaire : respecter la dose recommandée.',
  tint:['#FFE0E8','#F29DB5'],fruits:['raspberry','strawberry'],stepsFruit:true,wide:true,
  msgs:[['Collagène marin','180 pastilles'],['Saveur framboise','fraise des bois'],['Dose et mode d’emploi','sur l’emballage']],
  steps:[['Lis le mode d’emploi','sur l’emballage'],['Respecte la dose','journalière'],['Chaque jour','de préférence au même moment']],
  edLab:['SAVEUR','Framboise<br>fraise des bois'],edIng:'Collagène marin<br>Boîte de 180 pastilles'}
};
const PK=new URLSearchParams(location.search).get('p')||'fish',C=PRODUCTS[PK];
function fruitSVG(k){
 if(k==='raspberry'){let s='';for(let r=0;r<4;r++)for(let c=0;c<=r+2&&c<5;c++)s+='<circle cx="'+(100+(c-(Math.min(r+2,4))/2)*34)+'" cy="'+(70+r*32)+'" r="19" fill="#D6204A"/><circle cx="'+(94+(c-(Math.min(r+2,4))/2)*34)+'" cy="'+(64+r*32)+'" r="5" fill="#F27C95"/>';return '<svg viewBox="0 0 200 200" width="100%" height="100%"><path d="M100 34C92 18 74 14 62 22C78 26 90 30 100 34ZM100 34C108 18 126 14 138 22C122 26 110 30 100 34Z" fill="#3E8E4E"/>'+s+'</svg>'}
 if(k==='strawberry'){let s='';for(let i=0;i<14;i++)s+='<ellipse cx="'+(100+Math.cos(i*2.1)*(10+(i*13)%42))+'" cy="'+(120+Math.sin(i*2.1)*(8+(i*11)%36))+'" rx="3" ry="4.5" fill="#FFE9A8"/>';return '<svg viewBox="0 0 200 200" width="100%" height="100%"><path d="M100 188C40 150 26 96 52 74C74 56 100 70 100 70C100 70 126 56 148 74C174 96 160 150 100 188Z" fill="#E63950"/>'+s+'<path d="M100 72C84 52 62 56 54 68C72 66 88 70 100 72ZM100 72C116 52 138 56 146 68C128 66 112 70 100 72ZM100 72C98 54 100 40 108 30C106 46 104 60 100 72Z" fill="#3E8E4E"/></svg>'}
 if(k==='mango')return `<svg viewBox="0 0 200 200" width="100%" height="100%"><defs><radialGradient id="mg" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FFE27A"/><stop offset=".55" stop-color="#FFA23A"/><stop offset="1" stop-color="#E8543A"/></radialGradient></defs><g transform="rotate(32 100 100) translate(30 0) scale(.7 1)"><path d="M100 12C158 10 190 70 178 124C166 176 120 196 84 180C40 162 18 108 40 66C55 36 76 14 100 12Z" fill="url(#mg)"/><path d="M100 12C104 -6 128 -10 146 0C130 16 114 18 100 12Z" fill="#3E8E4E"/><path d="M58 78C64 60 78 48 92 44" stroke="#fff" stroke-opacity=".55" stroke-width="9" stroke-linecap="round" fill="none"/></g></svg>`;
 if(k==='orange'){let s='';for(let i=0;i<8;i++)s+=`<path d="M100 100L${100+Math.cos(i*.785+.1)*58} ${100+Math.sin(i*.785+.1)*58}A58 58 0 0 1 ${100+Math.cos((i+1)*.785-.1)*58} ${100+Math.sin((i+1)*.785-.1)*58}Z" fill="#FFB43A"/>`;
  return `<svg viewBox="0 0 200 200" width="100%" height="100%"><circle cx="100" cy="100" r="92" fill="#F47C1E"/><circle cx="100" cy="100" r="80" fill="#FFF1D6"/>${s}</svg>`}
 if(k==='blueberry')return `<svg viewBox="0 0 200 200" width="100%" height="100%"><defs><radialGradient id="bg" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#7B8FE0"/><stop offset="1" stop-color="#2E3A8C"/></radialGradient></defs><circle cx="100" cy="106" r="80" fill="url(#bg)"/><path d="M100 76l9 14 16 2-12 11 3 16-16-8-16 8 3-16-12-11 16-2z" fill="#1E265F"/></svg>`;
 if(k==='pomegranate')return `<svg viewBox="0 0 200 200" width="100%" height="100%"><defs><radialGradient id="pg" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#F0576B"/><stop offset="1" stop-color="#A3122E"/></radialGradient></defs><circle cx="100" cy="112" r="76" fill="url(#pg)"/><path d="M70 44l14 22h32l14-22-18 10-12-14-12 14z" fill="#A3122E"/></svg>`;
 let seeds='';for(let i=0;i<22;i++){const a=i*2.4,r=8+((i*37)%34);seeds+=`<ellipse cx="${100+Math.cos(a)*r}" cy="${100+Math.sin(a)*r}" rx="5" ry="7" fill="#3B2410" transform="rotate(${i*40} ${100+Math.cos(a)*r} ${100+Math.sin(a)*r})"/>`}
 return `<svg viewBox="0 0 200 200" width="100%" height="100%"><circle cx="100" cy="100" r="92" fill="#6B2D7B"/><circle cx="100" cy="100" r="78" fill="#F7EBC8"/><circle cx="100" cy="100" r="66" fill="#F6B73C"/>${seeds}</svg>`;
}

// palettes, accroches (sans promesse santé) — choisies par studio.js via ?pal=&hook=
const PALS={lilas:['#E4D8F7','#A48BD0','#3B2466','#8A6BC8','#4a3a70','#FBF6EE','#EFE4D4'],menthe:['#DDF1E6','#8CC8A8','#1F4A38','#3E8E6A','#2f5d49','#F4FAF6','#E3EFE7'],
 rose:['#FBE1E8','#E79BB0','#6A2140','#C0527A','#7a3552','#FFF5F7','#F6E3E8'],bleu:['#DCE8F8','#86A8DC','#1D3566','#4A73C0','#2d467a','#F3F7FD','#E1EAF6'],sable:['#F6EBD9','#D9B98A','#4A3418','#A8782F','#5c4528','#FBF6EE','#EFE4D4']};
const QS=new URLSearchParams(location.search),PAL=PALS[QS.get('pal')]||PALS.lilas;
['bg0','bg1','ink','acc','ink2','ebg0','ebg1'].forEach((k,i)=>document.documentElement.style.setProperty('--'+k,PAL[i]));
const HOOKS=['Ton rituel du jour ?','Prêt(e) pour ta routine ?','Et si tu testais ?','Le geste du jour','Ta pause bien-être','Un moment pour toi','Ton rendez-vous du jour','Un petit rituel ?'];
const HOOK=HOOKS[(+QS.get('hook')||0)%HOOKS.length];
const hookLines=s=>{const w=s.split(' '),m=Math.ceil(w.length/2);return [w.slice(0,m).join(' '),w.slice(m).join(' ')]};
const STEPT=['Ton rituel<br>en 3 gestes','3 gestes<br>au quotidien','Simple comme<br>1, 2, 3','La routine<br>en 3 étapes'];
const STEPH=STEPT[(+QS.get('hook')||0)%STEPT.length];
