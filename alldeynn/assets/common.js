const $=id=>document.getElementById(id);
const e=x=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3);
const PALS={lilas:['#E4D8F7','#A48BD0','#3B2466','#8A6BC8','#4a3a70','#FBF6EE','#EFE4D4'],menthe:['#DDF1E6','#8CC8A8','#1F4A38','#3E8E6A','#2f5d49','#F4FAF6','#E3EFE7'],
 rose:['#FBE1E8','#E79BB0','#6A2140','#C0527A','#7a3552','#FFF5F7','#F6E3E8'],bleu:['#DCE8F8','#86A8DC','#1D3566','#4A73C0','#2d467a','#F3F7FD','#E1EAF6'],sable:['#F6EBD9','#D9B98A','#4A3418','#A8782F','#5c4528','#FBF6EE','#EFE4D4']};
const PAL=PALS[new URLSearchParams(location.search).get('pal')]||PALS.lilas;
['bg0','bg1','ink','acc','ink2','ebg0','ebg1'].forEach((k,i)=>document.documentElement.style.setProperty('--'+k,PAL[i]));
const IN=(el,t,a,dy,d=.6,dx=0)=>{const k=e((t-a)/d);el.style.opacity=k;el.style.transform=`translate(${(1-k)*dx}px,${(1-k)*dy}px)`;return k};
const FONT='@font-face{font-family:P;font-weight:500;src:url(p500.ttf)}@font-face{font-family:P;font-weight:600;src:url(p600.ttf)}@font-face{font-family:P;font-weight:700;src:url(p700.ttf)}html,body{margin:0;width:1080px;height:1920px;overflow:hidden;font-family:P}.a{position:absolute;opacity:0;will-change:transform,opacity}';
document.head.insertAdjacentHTML('beforeend','<meta charset="utf-8"><style>'+FONT+'</style>');
