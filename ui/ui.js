(function(){
const C=()=>window.CLIMB||MOCK;
const MOCK={st:1,gr:1,h:0,gear:{rope:Infinity,chalk:Infinity,cam:Infinity,nut:Infinity,quickdraw:Infinity,carabiner:Infinity},
 getStamina(){return this.st},getGrip(){return this.gr},getHeight(){return this.h},getGear(){return this.gear},
 placeGear(t){return this.gear[t]>0},selectLimb(n){this.limb=n},onFall(cb){}};
const GEAR=[['quickdraw','\u{1f517}','Quickdraw'],['cam','\u{2699}\u{fe0f}','Cam'],['nut','\u{1f529}','Nut'],['carabiner','\u{1fa9d}','Carabiner'],['chalk','\u{1f9c2}','Chalk'],['rope','\u{1faa2}','Rope'],['iceAxe','\u{26cf}\u{fe0f}','Ice axe'],['crampons','\u{1f97e}','Crampons'],['oxygen','\u{1fae7}','Oxygen'],['downSuit','\u{1f9e5}','Down suit'],['gloves','\u{1f9e4}','Gloves']];
const ui=document.createElement('div');ui.id='cl-ui';
ui.innerHTML=`<div id="cl-title"><h1>CLIMBER</h1><div class="pick"><button data-c="girl" class="on">\u{1f467} Girl</button><button data-c="boy">\u{1f466} Boy</button></div><button id="cl-play">Climb</button><div class="credit">Made by Nova Labs \u{2b50}</div></div>
<div id="cl-bars"><div>Stamina</div><div class="cl-bar" id="cl-stam"><i></i></div><div>Grip</div><div class="cl-bar" id="cl-grip"><i></i></div></div>
<div id="cl-height">0 m</div><div id="cl-gear"></div>
<div id="cl-limbs"><button data-l="LH" class="on">Left hand</button><button data-l="RH">Right hand</button><button data-l="LF">Left foot</button><button data-l="RF">Right foot</button></div><div id="cl-toast"></div>`;
document.body.appendChild(ui);
const $=s=>ui.querySelector(s);
function toast(t){const e=$('#cl-toast');e.textContent=t;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),1600)}
let climber='girl';
ui.querySelectorAll('#cl-title .pick button').forEach(b=>b.onclick=()=>{ui.querySelectorAll('#cl-title .pick button').forEach(x=>x.classList.remove('on'));b.classList.add('on');climber=b.dataset.c});
$('#cl-play').onclick=()=>{$('#cl-title').style.display='none';const c=C();c.start&&c.start({climber})};
const g=$('#cl-gear');
GEAR.forEach(([k,ic,name])=>{const b=document.createElement('button');b.dataset.k=k;b.title=name;b.setAttribute('aria-label',name);b.innerHTML=ic+'<b></b>';
 b.onclick=()=>{const ok=C().placeGear(k);toast(ok?name+' placed':'Can\u2019t place '+name.toLowerCase()+' here');refresh()};g.appendChild(b)});
ui.querySelectorAll('#cl-limbs button').forEach(b=>b.onclick=()=>{ui.querySelectorAll('#cl-limbs button').forEach(x=>x.classList.remove('on'));b.classList.add('on');C().selectLimb(b.dataset.l)});
function refresh(){const c=C(),gear=c.getGear()||{};
 $('#cl-stam i').style.width=Math.max(0,Math.min(1,c.getStamina()))*100+'%';
 $('#cl-grip i').style.width=Math.max(0,Math.min(1,c.getGrip()))*100+'%';
 $('#cl-height').textContent=Math.round(c.getHeight?c.getHeight():0).toLocaleString()+' m';
 g.querySelectorAll('button').forEach(b=>{const n=gear[b.dataset.k]??0;b.querySelector('b').textContent=(n===Infinity||n>=999)?'\u221e':n;b.disabled=!n});
 ui.classList.toggle('calm',c.getStamina()>.7&&c.getGrip()>.7)}
setInterval(refresh,200);refresh();
let hooked=false;const hook=()=>{if(hooked)return;const c=window.CLIMB;if(c&&c.onFall){c.onFall(d=>toast(d&&d.caught?'Rope caught you! \u{1faa2}':'You fell!'));hooked=true}else setTimeout(hook,500)};hook();
window.CLIMB_UI={toast,refresh};
})();
