// Climber engine v1 — Nova Labs
import * as THREE from './three.module.js';
const A = () => window.CLIMB_AUDIO;
const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
// ---------- noise ----------
function h2(x,y){let n=x*374761393+y*668265263;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967296;}
function vn(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const a=h2(xi,yi),b=h2(xi+1,yi),c=h2(xi,yi+1),d=h2(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,o=4){let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*vn(x*f,y*f);f*=2.03;a*=.5;}return s;}
const snowAt=(x,y)=>{const k=Math.min(1,Math.max(0,y)/(8849-5300));const n=fbm(x*.35+3,y*.35-5,3);const flat=Math.max(0,wallN(x,y).y)*1.5;return n+flat*.3+k*.7-.9;};
const wallZ=(x,y)=>0.9*fbm(x*.18+7,y*.18)+0.14*vn(x*1.3,y*1.3)+0.05*vn(x*4.1,y*4.1)-0.5-Math.max(0,Math.abs(x)-3)**2*0.35;
function wallN(x,y){const e=.05;return V(-(wallZ(x+e,y)-wallZ(x-e,y))/(2*e),-(wallZ(x,y+e)-wallZ(x,y-e))/(2*e),1).normalize();}
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
// ---------- renderer / scene ----------
const host=document.getElementById('game')||document.body;
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xa9c3dd,30,260);
const camera=new THREE.PerspectiveCamera(55,1,0.1,900);
scene.add(new THREE.HemisphereLight(0xcfe4ff,0x6b5a48,0.9));
const sun=new THREE.DirectionalLight(0xfff1d6,2.2);sun.position.set(-6,10,8);scene.add(sun);scene.add(sun.target);
// sky
const sky=new THREE.Mesh(new THREE.SphereGeometry(600,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 vertexShader:'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 uniforms:{alt:{value:0}},fragmentShader:'uniform float alt;varying vec3 p;void main(){float h=clamp(p.y*1.4+.15,0.,1.);vec3 c=mix(mix(vec3(.80,.87,.94),vec3(.55,.68,.85),alt),mix(vec3(.25,.50,.85),vec3(.05,.12,.35),alt),h);float s=pow(max(dot(p,normalize(vec3(-.5,.5,.6))),0.),300.);gl_FragColor=vec4(c+s*vec3(1.,.9,.7),1.);}'}));
scene.add(sky);
// distant mountains
const mountains=new THREE.Group();scene.add(mountains);
{const mr=rng(99);const mat=new THREE.MeshLambertMaterial({color:0x7d8ea6,flatShading:true,fog:false});const snow=new THREE.MeshLambertMaterial({color:0xeef3f8,flatShading:true,fog:false});
 for(let i=0;i<34;i++){const side=i%2?1:-1,hgt=90+mr()*170,r=35+mr()*55;const g=new THREE.ConeGeometry(r,hgt,7,1);
  const pa=g.attributes.position;for(let k=0;k<pa.count;k++)if(pa.getY(k)<hgt/2-1){pa.setX(k,pa.getX(k)*(0.8+mr()*.4));pa.setZ(k,pa.getZ(k)*(0.8+mr()*.4));}g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat);m.position.set(side*(70+mr()*220),hgt/2-40,-120-mr()*280);mountains.add(m);
  const cap=new THREE.Mesh(new THREE.ConeGeometry(r*0.5,hgt*0.5,7,1),snow);cap.position.set(m.position.x,m.position.y+hgt*0.25+.5,m.position.z);mountains.add(cap);}}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(800,800),new THREE.MeshLambertMaterial({color:0xdfe6ee}));ground.rotation.x=-Math.PI/2;ground.position.y=-0.02;scene.add(ground);
// ---------- materials ----------
const rockMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:0});
const holdMat={jug:new THREE.MeshStandardMaterial({color:0xb7a690,roughness:.9}),crimp:new THREE.MeshStandardMaterial({color:0xa89a86,roughness:.9}),
 sloper:new THREE.MeshStandardMaterial({color:0x9c8f7d,roughness:.8}),crack:new THREE.MeshStandardMaterial({color:0x1d1915,roughness:1}),
 ledge:new THREE.MeshStandardMaterial({color:0x8f8270,roughness:.95,flatShading:true})};
const metal=new THREE.MeshStandardMaterial({color:0xdfe3e8,metalness:1,roughness:.18});
const holdGeo={jug:new THREE.SphereGeometry(.075,7,5),crimp:new THREE.BoxGeometry(.15,.025,.06),sloper:new THREE.SphereGeometry(.11,7,5)};
const HQ={jug:1,crimp:.55,sloper:.45,crack:.8,ledge:1.2};
// ---------- chunks ----------
const CH=12,WW=11;const chunks=new Map();let holds=[],bolts=[];const holdMeshes=[],wallMeshes=[];
const LEDGE_EVERY=36;
function addHold(list,g,x,y,type,extra={}){const z=wallZ(x,y);const n=wallN(x,y);const h={pos:V(x,y,z+0.05).addScaledVector(n,0.02),type,q:HQ[type],...extra};
 let m;if(type==='crack'){m=new THREE.Mesh(new THREE.BoxGeometry(.012+h.w*.008,.45,.01),holdMat.crack);}else if(type==='ledge'){return list.push(h),h;}else{m=new THREE.Mesh(holdGeo[type],holdMat[type]);
  if(type==='jug')m.scale.set(1.5,.8,1.1);if(type==='sloper')m.scale.set(1.4,.7,.55);}
 m.position.copy(h.pos);m.lookAt(h.pos.clone().add(n));m.rotateZ((h2(x*100|0,y*100|0)-.5)*.6);m.userData.hold=h;h.mesh=m;g.add(m);list.push(h);return h;}
function buildChunk(i){const g=new THREE.Group();const y0=i*CH;const list=[],bl=[];
 const geo=new THREE.PlaneGeometry(WW,CH,64,32);const pa=geo.attributes.position;const col=[];
 for(let k=0;k<pa.count;k++){const x=pa.getX(k),y=pa.getY(k)+y0+CH/2;pa.setY(k,y);const z=wallZ(x,y);pa.setZ(k,z);
  const n=fbm(x*.9,y*.9,3),st=.5+.5*Math.sin(y*3.1+fbm(x*.3,y*.3)*6),c=.36+.25*n+.07*st+z*.12;
  const lime=Math.min(1,Math.max(0,(fbm(x*.08+20,y*.06)-.4)*4)),streak=.5+.5*Math.sin(x*9+fbm(x*2,y*.15)*8);
  let r=c*(1.02+lime*.25)-streak*.05*lime,gg=c*(.98+lime*.12),b=c*(.92-lime*.08)+ (1-lime)*.03;const iron=Math.max(0,fbm(x*.5,y*.5+9,2)-.62)*1.6;r+=iron*.25;gg+=iron*.08;
  const sn=snowAt(x,y);if(sn>0){const t=Math.min(1,sn*6);const ice=vn(x*.7+50,y*.7)>.6;const sc=ice?[.72,.85,.95]:[.94,.96,1];r+=(sc[0]-r)*t;gg+=(sc[1]-gg)*t;b+=(sc[2]-b)*t;}
  col.push(r,gg,b);}
 geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));geo.computeVertexNormals();
 const wall=new THREE.Mesh(geo,rockMat);g.add(wall);wall.userData.wall=1;
 const R=rng(1000+i*7919);
 for(let y=y0+(i===0?2.1:0.2);y<y0+CH;y+=0.36+R()*0.12){const n=3+(R()*3|0);
  for(let j=0;j<n;j++){const x=(R()*2-1)*(j<2?1:2.6);const r=R();const type=r<.3?'jug':r<.6?'crimp':r<.8?'sloper':'crack';
   addHold(list,g,x,y,type,type==='crack'?{w:[0.5,0.75,1,2,3,4][R()*6|0],taper:R()<.5}:{});}
  if(R()<.25){const x=(R()*2-1)*3.5;addHold(list,g,x,y,R()<.5?'jug':'crimp');}}
 if(i===0){[[-.25,.35],[.25,.35],[-.5,1.0],[.5,1.0],[-.3,1.75],[.3,1.75],[0,1.4],[-.2,2.1]].forEach(([x,y],k)=>addHold(list,g,x,y,k<2?'jug':k%2?'jug':'crimp'));}
 for(let y=y0+3;y<y0+CH;y+=3){const x=(R()*2-1)*.8,z=wallZ(x,y);const b={pos:V(x,y,z+.03),n:wallN(x,y)};
  const hg=new THREE.Mesh(new THREE.BoxGeometry(.035,.07,.012),metal);hg.position.copy(b.pos);hg.lookAt(b.pos.clone().add(b.n));g.add(hg);
  const hd=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.02,6),metal);hd.position.copy(b.pos).addScaledVector(b.n,.01);hd.position.y+=.02;hd.rotation.x=Math.PI/2;g.add(hd);b.mesh=hg;bl.push(b);}
 for(let L=Math.ceil(Math.max(1,y0)/LEDGE_EVERY)*LEDGE_EVERY;L<y0+CH;L+=LEDGE_EVERY){
  const lg=new THREE.Mesh(new THREE.BoxGeometry(7,.25,.7,6,1,2),holdMat.ledge);lg.position.set(0,L-.12,wallZ(0,L)+.25);g.add(lg);
  for(let x=-3;x<=3;x+=.3)addHold(list,g,x,L,'ledge',{ledge:L});}
 scene.add(g);list.forEach(h=>h.mesh&&holdMeshes.push(h.mesh));wallMeshes.push(wall);
 chunks.set(i,{g,list,bl,wall});holds.push(...list);bolts.push(...bl);}
function dropChunk(i){const c=chunks.get(i);scene.remove(c.g);c.g.traverse(o=>{if(o.geometry&&!Object.values(holdGeo).includes(o.geometry))o.geometry.dispose();});
 const s=new Set(c.list);holds=holds.filter(h=>!s.has(h));const sb=new Set(c.bl);bolts=bolts.filter(b=>!sb.has(b));
 for(let k=holdMeshes.length-1;k>=0;k--)if(s.has(holdMeshes[k].userData.hold))holdMeshes.splice(k,1);wallMeshes.splice(wallMeshes.indexOf(c.wall),1);chunks.delete(i);}
function updateChunks(y){const c=Math.floor(y/CH);for(let i=Math.max(0,c-1);i<=c+2;i++)if(!chunks.has(i))buildChunk(i);for(const i of [...chunks.keys()])if(i<c-1||i>c+2)dropChunk(i);}
// ---------- climber ----------
const LIMBS=['LH','RH','LF','RF'];const NAME={leftHand:'LH',rightHand:'RH',leftFoot:'LF',rightFoot:'RF',LH:'LH',RH:'RH',LF:'LF',RF:'RF'};
let P;function setProps(kind){const g=kind==='boy';const s=g?1:.93;
 P={kind,s,arm1:.30*s,arm2:.29*s,leg1:.44*s,leg2:.43*s,torso:.50*s,sw:(g?.40:.34)*s,hw:(g?.17:.19)*s,shirt:g?0x2f6fb5:0xc94f7c,pants:g?0x39424f:0x4a3f5c,skin:0xe0b08e,hair:g?0x3a2a1c:0x6b3e1f};}
const body=new THREE.Group();scene.add(body);let parts={};
function cyl(r,mat){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.85,1,7),mat);body.add(m);return m;}
function buildBody(){body.clear();const M=c=>new THREE.MeshStandardMaterial({color:c,roughness:.8});
 const shirt=M(P.shirt),pants=M(P.pants),skin=M(P.skin),harn=M(0xf2b01e),shoe=M(0x222222),helm=new THREE.MeshStandardMaterial({color:0xe8e23a,roughness:.4});
 parts={torso:cyl(.12*P.s,shirt),pelvis:new THREE.Mesh(new THREE.BoxGeometry(P.hw*2+.04,.13*P.s,.18*P.s),pants),
  head:new THREE.Mesh(new THREE.SphereGeometry(.105*P.s,10,8),skin),helmet:new THREE.Mesh(new THREE.SphereGeometry(.118*P.s,10,6,0,Math.PI*2,0,Math.PI*.55),helm),
  harness:new THREE.Mesh(new THREE.TorusGeometry(.15*P.s,.022,5,12),harn),loopL:new THREE.Mesh(new THREE.TorusGeometry(.085*P.s,.016,4,10),harn),loopR:new THREE.Mesh(new THREE.TorusGeometry(.085*P.s,.016,4,10),harn)};
 parts.torso.scale.x=1.3;['pelvis','head','helmet','harness','loopL','loopR'].forEach(k=>body.add(parts[k]));
 if(P.kind==='girl'){parts.pony=new THREE.Mesh(new THREE.SphereGeometry(.05,6,5),M(P.hair));parts.pony.scale.set(1,1.8,1);body.add(parts.pony);}
 parts.hair=new THREE.Mesh(new THREE.SphereGeometry(.1*P.s,8,6),M(P.hair));body.add(parts.hair);
 for(const L of LIMBS){const arm=L[1]==='H';parts[L]={a:cyl((arm?.045:.065)*P.s,arm?shirt:pants),b:cyl((arm?.038:.05)*P.s,arm?skin:pants),
  e:arm?new THREE.Mesh(new THREE.SphereGeometry(.045*P.s,6,5),skin):new THREE.Mesh(new THREE.BoxGeometry(.09*P.s,.07*P.s,.22*P.s),shoe)};body.add(parts[L].e);
  if(!arm){const k=new THREE.Mesh(new THREE.TorusGeometry(.075*P.s,.015,4,8),harn);body.add(k);parts[L].loop=k;}}}
const up=V(0,1,0),tmpQ=new THREE.Quaternion();
function seg(m,a,b){const d=b.clone().sub(a);const l=d.length();m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(up,d.multiplyScalar(1/(l||1)));m.scale.y=l;}
function ik(a,t,l1,l2,pole){const d0=t.clone().sub(a);let d=d0.length();const dir=d0.multiplyScalar(1/(d||1));d=Math.min(Math.max(d,.05),l1+l2-.001);
 const x=(l1*l1+d*d-l2*l2)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x));const perp=pole.clone().addScaledVector(dir,-pole.dot(dir)).normalize();
 return{j:a.clone().addScaledVector(dir,x).addScaledVector(perp,h),e:a.clone().addScaledVector(dir,d)};}
// state
const S={eq:{iceAxe:true,crampons:true,oxygen:true,downSuit:true,gloves:true},stamina:1,grip:1,sel:'RH',limbs:{},mode:'climb',pros:[],gear:null,cams:null,fallCbs:[],maxY:0,restY:0,started:false,summit:false,hip:V(),chest:V(),fall:null,startHip:0,msgT:0};
function resetGear(){const I=Infinity;S.gear={quickdraw:I,cam:I,nut:I,carabiner:I,chalk:I,rope:I,iceAxe:I,crampons:I,oxygen:I,downSuit:I,gloves:I};S.cams=[0.5,0.75,1,2,3,4];}
function poseFrom(lp){const hx=(lp.LH.x+lp.RH.x)/2,hy=(lp.LH.y+lp.RH.y)/2,fx=(lp.LF.x+lp.RF.x)/2,fy=(lp.LF.y+lp.RF.y)/2;
 const chest=V(hx*.8+fx*.2,hy-(P.arm1+P.arm2)*.78,0),hip=V(fx*.5+hx*.5,fy+(P.leg1+P.leg2)*.82,0);
 const m=chest.clone().add(hip).multiplyScalar(.5);let dir=chest.clone().sub(hip);if(dir.y<.8)dir.y=.8;dir.normalize();
 chest.copy(m).addScaledVector(dir,P.torso/2);hip.copy(m).addScaledVector(dir,-P.torso/2);
 chest.z=wallZ(chest.x,chest.y)+.42*P.s;hip.z=wallZ(hip.x,hip.y)+.4*P.s;return{chest,hip};}
function roots(ps){const r={};const sd=V(1,0,0);r.LH=ps.chest.clone().addScaledVector(sd,-P.sw/2);r.RH=ps.chest.clone().addScaledVector(sd,P.sw/2);
 r.LF=ps.hip.clone().addScaledVector(sd,-P.hw/2);r.RF=ps.hip.clone().addScaledVector(sd,P.hw/2);return r;}
function valid(lp){const ps=poseFrom(lp),r=roots(ps);for(const L of LIMBS){const len=L[1]==='H'?P.arm1+P.arm2:P.leg1+P.leg2;if(lp[L].distanceTo(r[L])>len*1.4)return false;}
 if(Math.min(lp.LH.y,lp.RH.y)<Math.max(lp.LF.y,lp.RF.y)+.15)return false;if(Math.abs(lp.LH.x-lp.RH.x)>1.5||Math.abs(lp.LF.x-lp.RF.x)>1.2)return false;return true;}
function curLP(){const o={};for(const L of LIMBS)o[L]=(S.limbs[L].to||S.limbs[L].pos).clone();return o;}
function canMove(L,h){if(h.type==='crack'&&L[1]==='F'&&false)return false;for(const K of LIMBS)if(K!==L&&S.limbs[K].hold===h&&h.type!=='ledge'&&h.type!=='jug')return false;const lp=curLP();lp[L]=h.pos.clone();return valid(lp);}
function msg(t){(window.CLIMB_UI&&window.CLIMB_UI.toast)?window.CLIMB_UI.toast(t):(hudMsg.textContent=t,hudMsg.style.opacity=1,S.msgT=1.4);}
function moveLimb(L,h,auto){const l=S.limbs[L];if(S.mode!=='climb')return false;if(!canMove(L,h)){msg('Out of reach');return false;}
 l.from=l.pos.clone();l.to=h.pos.clone();l.t=0;l.hold=null;l.next=h;return true;}
function attachNear(p){const pick=(tx,ty,excl)=>{let b=null,bd=1e9;for(const h of holds){if(excl.includes(h))continue;const d=(h.pos.x-tx)**2+(h.pos.y-ty)**2+(1-Math.min(1,h.q))*.25;if(d<bd){bd=d;b=h;}}return b;};
 const used=[];const set=(L,tx,ty)=>{const h=pick(tx,ty,used);used.push(h);S.limbs[L]={hold:h,pos:h.pos.clone()};};
 set('LF',p.x-.2,p.y-.75);set('RF',p.x+.2,p.y-.75);set('LH',p.x-.3,p.y+.75);set('RH',p.x+.3,p.y+.75);
 for(const L of ['LH','RH'])if(S.limbs[L].pos.y<Math.max(S.limbs.LF.pos.y,S.limbs.RF.pos.y)+.4){const h=pick(p.x+(L==='LH'?-.3:.3),p.y+1.1,used);used.push(h);S.limbs[L]={hold:h,pos:h.pos.clone()};}}
// ---------- rope & gear ----------
const ROPE_MAX=80;const ropeGeo=new THREE.BufferGeometry();ropeGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(ROPE_MAX*3),3));
const rope=new THREE.Line(ropeGeo,new THREE.LineBasicMaterial({color:0x8b3fd9}));rope.frustumCulled=false;scene.add(rope);
const belayAnchor=V(.9,0.95,1.25);
{const g=new THREE.Group(),M=c=>new THREE.MeshStandardMaterial({color:c,roughness:.8});const jk=M(0xd9542b),pn=M(0x2b3440),sk=M(0xe0b08e),bt=M(0x222222);
 const add=(geo,m,x,y,z,rx=0,rz=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.set(rx,0,rz);g.add(o);return o;};
 add(new THREE.CylinderGeometry(.16,.13,.6,8),jk,0,1.2,0);add(new THREE.SphereGeometry(.11,10,8),sk,0,1.65,0);add(new THREE.SphereGeometry(.12,10,6,0,6.3,0,1.6),M(0x2a6fdb),0,1.68,0);
 add(new THREE.CylinderGeometry(.06,.05,.85,6),pn,-.09,.45,0,0,.05);add(new THREE.CylinderGeometry(.06,.05,.85,6),pn,.09,.45,0,0,-.05);
 add(new THREE.BoxGeometry(.11,.07,.24),bt,-.1,.04,-.04);add(new THREE.BoxGeometry(.11,.07,.24),bt,.1,.04,-.04);
 add(new THREE.CylinderGeometry(.045,.04,.55,6),jk,-.2,1.2,-.12,-.9,.2);add(new THREE.CylinderGeometry(.045,.04,.55,6),jk,.2,1.2,-.12,-.9,-.2);
 add(new THREE.TorusGeometry(.15,.02,5,12),M(0xf2b01e),0,.92,0,Math.PI/2);g.position.set(.9,0,1.4);g.rotation.y=Math.PI;scene.add(g);
 const rk=new THREE.MeshStandardMaterial({color:0x6d6760,roughness:1,flatShading:true}),rr=rng(5);for(let i=0;i<60;i++){const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.15+rr()*.6,0),rk);
  r.position.set((rr()*2-1)*18,0,1+rr()*14);r.scale.y=.5+rr()*.4;r.rotation.set(rr()*3,rr()*3,0);scene.add(r);}}
function updateRope(harn){const pts=[belayAnchor,...S.pros.map(p=>p.clip),harn];const a=ropeGeo.attributes.position.array;let n=0;
 for(let i=0;i<pts.length-1&&n<ROPE_MAX-2;i++){const p=pts[i],q=pts[i+1];const steps=Math.min(8,1+Math.ceil(p.distanceTo(q)/1.5));
  for(let k=0;k<steps&&n<ROPE_MAX-1;k++){const t=k/steps;const s=Math.sin(t*Math.PI)*Math.min(.25,p.distanceTo(q)*.03);a[n*3]=p.x+(q.x-p.x)*t;a[n*3+1]=p.y+(q.y-p.y)*t-s;a[n*3+2]=p.z+(q.z-p.z)*t+.03;n++;}}
 a[n*3]=harn.x;a[n*3+1]=harn.y;a[n*3+2]=harn.z;n++;ropeGeo.setDrawRange(0,n);ropeGeo.attributes.position.needsUpdate=true;}
const biner=()=>new THREE.Mesh(new THREE.TorusGeometry(.022,.005,4,10),metal);
function makeDraw(b){const g=new THREE.Group();const top=biner();top.scale.y=1.5;top.position.set(0,-.03,.02);g.add(top);
 const sling=new THREE.Mesh(new THREE.BoxGeometry(.018,.1,.006),new THREE.MeshStandardMaterial({color:0x2f9e5a}));sling.position.set(0,-.1,.025);g.add(sling);
 const bot=biner();bot.scale.y=1.5;bot.position.set(0,-.17,.03);g.add(bot);const side=Math.sign(b.pos.x-S.hip.x)||1; // gate faces away from climber
 const gate=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.04,4),new THREE.MeshStandardMaterial({color:0xd03030,metalness:.6,roughness:.3}));gate.position.set(.022*side,-.17,.03);g.add(gate);
 g.position.copy(b.pos);scene.add(g);return{mesh:g,clip:b.pos.clone().add(V(0,-.17,.04))};}
function makePiece(h,type,size){const g=new THREE.Group();const col=type==='cam'?[0x8b5cf6,0x9ca3af,0x9b111e,0x0f9d58,0x2563eb,0xd4a017,0x7c3aed][[0.5,0.75,1,2,3,4].indexOf(size)+1]:0x9aa3ad;
 const head=new THREE.Mesh(type==='cam'?new THREE.CylinderGeometry(.03,.03,.05,8):new THREE.BoxGeometry(.03,.035,.02),new THREE.MeshStandardMaterial({color:col,metalness:.7,roughness:.3}));
 if(type==='cam')head.rotation.z=Math.PI/2;g.add(head);const st=new THREE.Mesh(new THREE.BoxGeometry(.012,.12,.008),new THREE.MeshStandardMaterial({color:type==='cam'?col:0x1f7a9e}));st.position.y=-.07;g.add(st);
 const bn=biner();bn.position.y=-.14;g.add(bn);g.position.copy(h.pos).add(V(0,.05,0));scene.add(g);return{mesh:g,clip:g.position.clone().add(V(0,-.15,.03))};}
function harnessPos(){return S.hip.clone().add(V(0,.02,.12));}
function placeGear(type){if(!S.gear)resetGear();if(S.mode!=='climb')return false;const hp=harnessPos();
 if(type==='chalk'){S.grip=Math.min(1,S.grip+.5);A()?.chalk?.();return true;}
 if(type==='quickdraw'){if(S.gear.quickdraw<=0)return false;let best=null,bd=1.7;for(const b of bolts){if(b.used)continue;const d=b.pos.distanceTo(hp);if(d<bd&&b.pos.y>hp.y-.6){bd=d;best=b;}}
  if(!best){msg('No bolt in reach');return false;}best.used=1;const d=makeDraw(best);S.pros.push({type:'quickdraw',q:'good',pos:best.pos,...d,bolt:best});
  A()?.clip?.();setTimeout(()=>A()?.clip?.(),260);return true;}
 if(type==='cam'||type==='nut'){if(S.gear[type]<=0)return false;
  let best=null,bd=1.5;for(const h of holds){if(h.type!=='crack'||h.prot)continue;const d=h.pos.distanceTo(hp);if(d<bd&&h.pos.y>hp.y-.6){bd=d;best=h;}}
  if(!best){msg('No crack in reach');return false;}let q,size;
  if(type==='cam'){size=S.cams.reduce((a,c)=>Math.abs(c-best.w)<Math.abs(a-best.w)?c:a,S.cams[0]);const df=Math.abs(size-best.w)/best.w;q=df<.2?'good':df<.6?'okay':'bad';A()?.cam?.();}
  else{q=best.taper?(best.w<=1?'good':'okay'):'bad';A()?.nut?.();}
  best.prot=1;const d=makePiece(best,type,size);S.pros.push({type,q,size,pos:best.pos.clone(),hold:best,...d});msg(type+' placed ('+q+')');return true;}
 if(['iceAxe','crampons'].includes(type)){S.eq[type]=true;msg((type==='iceAxe'?'Ice axe':'Crampons')+' equipped for ice');type==='iceAxe'?A()?.iceAxe?.():A()?.crampon?.();return true;}
 if(['oxygen','downSuit','gloves'].includes(type)){S.eq[type]=!S.eq[type];msg(type+(S.eq[type]?' on':' off'));return true;}
 if(type==='carabiner'){msg('Carabiner racked');return true;}
 if(type==='rope'){A()?.ropeFeed?.();msg('Rope fed');return true;}return false;}
// ---------- fall ----------
function startFall(reason){if(S.mode!=='climb')return;S.mode='fall';A()?.slip?.();A()?.fall?.();const hp=S.hip.clone();
 let anchor=null,idx=-1;for(let i=S.pros.length-1;i>=0;i--){const p=S.pros[i];const holdsIt=p.q==='good'||(p.q==='okay'&&Math.random()<.7);if(holdsIt){anchor=p;idx=i;break;}
  p.popped=1;}
 S.fall={p:hp.clone(),v:V(0,0,.3),t:0,anchor,idx,L:anchor?anchor.clip.distanceTo(hp)+0.8:0,y0:hp.y,reason,caught:false,maxF:0};
 msg(reason||'Fell!');}
function stepFall(dt){const f=S.fall;f.t+=dt;f.v.y-=9.8*dt;f.v.multiplyScalar(1-dt*.3);
 if(f.anchor){const d=f.p.clone().sub(f.anchor.clip);const len=d.length();if(len>f.L){const ext=len-f.L;d.normalize();const F=ext*90;f.maxF=Math.max(f.maxF,F);
   f.v.addScaledVector(d,-F*dt);f.v.addScaledVector(d,-f.v.dot(d)*Math.min(1,dt*6));if(!f.caught){f.caught=true;A()?.belayCatch?.(Math.min(1,(f.y0-f.p.y)/8));
    S.pros.forEach((p,i)=>{if(p.popped){A()?.camPop?.();scene.remove(p.mesh);}});S.pros=S.pros.filter(p=>!p.popped);}}}
 // popped pieces removed at catch; with no anchor fall to rest
 for(const p of S.pros)if(p.popped&&f.t>.15){A()?.camPop?.();scene.remove(p.mesh);}S.pros=S.pros.filter(p=>!(p.popped&&f.t>.15));
 f.p.addScaledVector(f.v,dt);const wz=wallZ(f.p.x,f.p.y)+.35;if(f.p.z<wz){f.p.z=wz;f.v.z=Math.abs(f.v.z)*.3;}if(f.p.z>wz+1.2)f.v.z-=dt*3;
 const floor=f.anchor?-1e9:S.restY+0.95*P.s;
 if(f.p.y<floor){f.p.y=floor;if(!f.landed){f.landed=1;A()?.land?.();f.endT=f.t+.8;}f.v.set(0,0,0);}
 if(f.p.y<0.95){f.p.y=.95;if(!f.landed){f.landed=1;A()?.land?.();f.endT=f.t+.8;}f.v.set(0,0,0);}
 const settled=f.caught&&f.t>2.2&&f.v.length()<.6;
 if(settled||(f.endT&&f.t>f.endT)||f.t>6){endFall();const lp={};for(const L of LIMBS)lp[L]=S.limbs[L].pos;return poseFrom(lp);}
 const ps={hip:f.p.clone(),chest:f.p.clone().add(V(0,P.torso,0))};const w=Math.sin(f.t*9)*.15;
 const lp={LH:ps.chest.clone().add(V(-.35,.35+w,.15)),RH:ps.chest.clone().add(V(.35,.35-w,.15)),LF:ps.hip.clone().add(V(-.2,-.75,.2-w)),RF:ps.hip.clone().add(V(.2,-.75,.2+w))};
 for(const L of LIMBS)S.limbs[L]={pos:lp[L],hold:null};return ps;}
function endFall(){const f=S.fall;const dist=Math.max(0,f.y0-f.p.y);S.mode='climb';S.fall=null;attachNear(f.p.clone().add(V(0,.3,0)));
 S.grace=3;S.follow=null;S.stamina=Math.max(S.stamina,.85);S.grip=Math.max(S.grip,.8);const info={caught:f.caught,distance:+dist.toFixed(2),height:getHeight(),protection:f.anchor?f.anchor.type:null,reason:f.reason};
 S.fallCbs.forEach(cb=>{try{cb(info)}catch(e){}});}
// ---------- input ----------
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
function pickHold(cx,cy){const r=renderer.domElement.getBoundingClientRect();ndc.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
 const hit=ray.intersectObjects(holdMeshes,false)[0];if(hit)return hit.object.userData.hold;const w=ray.intersectObjects(wallMeshes,false)[0];if(!w)return null;
 let b=null,bd=.45*.45;for(const h of holds){const d=h.pos.distanceToSquared(w.point);if(d<bd){bd=d;b=h;}}return b;}
let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};A()?.unlock?.();A()?.resume?.();});
renderer.domElement.addEventListener('pointerup',e=>{if(!down)return;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)<15){const h=pickHold(e.clientX,e.clientY);if(h)tapHold(h);}down=null;});
function tapHold(h){if(S.mode!=='climb')return;if(canMove(S.sel,h)){moveLimb(S.sel,h);return;}
 // auto-pick another limb if selected can't reach
 for(const L of LIMBS)if(L!==S.sel&&canMove(L,h)){selectLimb(L);moveLimb(L,h);return;}msg('Out of reach');}
function bestMove(L){let best=null,bs=-1e9;for(const h of holds){if(Math.abs(h.pos.y-S.limbs[L].pos.y)>2)continue;if(!canMove(L,h))continue;const s=h.pos.y-S.limbs[L].pos.y+h.q*.15-Math.abs(h.pos.x)*.2;if(s>bs){bs=s;best=h;}}return best;}
function autoMove(){if(S.mode!=='climb')return false;const order=[...['LH','RH'].sort((a,b)=>S.limbs[a].pos.y-S.limbs[b].pos.y),'LF','RF'];
 for(const L of order){const h=bestMove(L);if(h&&h.pos.y>S.limbs[L].pos.y+.05){selectLimb(L);return moveLimb(L,h);}}return false;}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();const m={'1':'LH','2':'RH','3':'LF','4':'RF',q:'LH',w:'RH',a:'LF',s:'RF'};
 if(m[k])selectLimb(m[k]);else if(k===' '){autoMove();e.preventDefault();}else if(k==='c')placeGear('chalk');else if(k==='g'){placeGear('quickdraw')||placeGear('cam')||placeGear('nut');}else if(k==='e')placeGear('quickdraw');else if(k==='r')placeGear('cam');else if(k==='t')placeGear('nut');});
// fallback HUD
const hud=document.createElement('div');hud.innerHTML=`<div id="hud-bars" class="climb-hud">Stamina<div class="bar"><i id="hb-s" style="background:#4ade80"></i></div>Grip<div class="bar"><i id="hb-g" style="background:#60a5fa"></i></div><span id="hb-h">0 m</span></div>
<div id="hud-limbs" class="climb-hud">${LIMBS.map(L=>`<button data-l="${L}">${L}</button>`).join('')}</div>
<div id="hud-gear" class="climb-hud"><button data-g="quickdraw">Draw</button><button data-g="cam">Cam</button><button data-g="nut">Nut</button><button data-g="chalk">Chalk</button><button data-a="auto">Up ▲</button></div><div id="hud-msg" class="climb-hud"></div>`;
document.body.appendChild(hud);const hudMsg=hud.querySelector('#hud-msg');
hud.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>selectLimb(b.dataset.l));hud.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{placeGear(b.dataset.g)||msg('Can\'t place '+b.dataset.g);});
hud.querySelector('[data-a]').onclick=()=>autoMove();
function selectLimb(n){const L=NAME[n];if(!L)return false;S.sel=L;hud.querySelectorAll('[data-l]').forEach(b=>b.classList.toggle('on',b.dataset.l===L));return true;}
// reach markers
const markGeo=new THREE.RingGeometry(.07,.095,12),markMat=new THREE.MeshBasicMaterial({color:0xffd23a,transparent:true,opacity:.85,depthTest:false});const marks=[];
for(let i=0;i<40;i++){const m=new THREE.Mesh(markGeo,markMat);m.visible=false;m.renderOrder=5;scene.add(m);marks.push(m);}
const selMark=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:0xffd23a,transparent:true,opacity:.5,depthTest:false}));selMark.renderOrder=6;scene.add(selMark);
let markT=0;function updateMarks(){let n=0;if(S.mode==='climb')for(const h of holds){if(n>=marks.length)break;if(Math.abs(h.pos.y-S.limbs[S.sel].pos.y)>1.5||h===S.limbs[S.sel].hold)continue;if(h.type==='ledge'&&h.pos.x*10%6)continue;
 if(canMove(S.sel,h)){const m=marks[n++];m.visible=true;m.position.copy(h.pos).add(V(0,0,.06));}}for(;n<marks.length;n++)marks[n].visible=false;}
// ---------- main loop ----------
const SCALE=1;const BASE=5300,TOP=8849;function getHeight(){return Math.round((BASE+Math.max(0,S.hip.y-S.startHip)*SCALE)*10)/10;}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,250));
let last=performance.now(),audT=0,camY=1.5;
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
 let ps;if(S.mode==='fall')ps=stepFall(dt);else{
  for(const L of LIMBS){const l=S.limbs[L];if(l.to){l.t+=dt/.35;const t=Math.min(1,l.t);l.pos.lerpVectors(l.from,l.to,t);l.pos.z+=Math.sin(t*Math.PI)*.15;
   if(t>=1){l.pos.copy(l.to);l.hold=l.next;l.to=l.next=null;L[1]==='H'?A()?.grip?.(l.hold.q):A()?.footstep?.();{const sn=snowAt(l.hold.pos.x,l.hold.pos.y);const sf=sn>0?(vn(l.hold.pos.x*.7+50,l.hold.pos.y*.7)>.6?'ice':'snow'):'rock';if(sf!==S.surf){S.surf=sf;A()?.surface?.(sf);}if(sf==='ice')(L[1]==='H'?A()?.iceAxe?.():A()?.crampon?.());}if(L[1]==='H')S.follow=['LF','RF'];if(l.hold.ledge!==undefined){S.restY=Math.max(S.restY,l.hold.ledge);}}}}
  if(S.follow&&S.follow.length&&!LIMBS.some(K=>S.limbs[K].to)){const ft=[...S.follow].sort((a,b)=>S.limbs[a].pos.y-S.limbs[b].pos.y)[0];S.follow=S.follow.filter(x=>x!==ft);const h=bestMove(ft);if(h&&h.pos.y>S.limbs[ft].pos.y+.08)moveLimb(ft,h,true);}
  ps=poseFrom(curLP());const lp={};for(const L of LIMBS)lp[L]=S.limbs[L].pos;ps=poseFrom(lp);
  // stamina model
  let hq=0,fq=0,hc=0,fc=0;for(const L of LIMBS){const h=S.limbs[L].hold;if(!h)continue;if(L[1]==='H'){hq+=h.q;hc++;}else{fq+=h.q;fc++;}}
  const gripF=.4+.6*S.grip,support=hq*gripF+fq*.7;const onLedge=fc===2&&S.limbs.LF.hold.type==='ledge'&&S.limbs.RF.hold.type==='ledge';
  const altF=getHeight()>=8000?(S.eq.oxygen?.6:1.4):1,coldF=1+Math.min(1,(getHeight()-5300)/3549)*(.3+(S.eq.downSuit?0:.5)+(S.eq.gloves?0:.5));const effort=Math.max(0,Math.min(1,(2.6-support)/2.2));S.effort=effort;
  if(onLedge){S.stamina=Math.min(1,S.stamina+dt*.15);S.grip=Math.min(1,S.grip+dt*.05);}
  else{S.stamina+= support>2.4?dt*.02:-dt*altF*(.004+.05*effort*effort+(fc===0?.05:0));S.grip-=dt*coldF*(.004+.012*effort);}
  S.stamina=Math.max(0,Math.min(1,S.stamina));S.grip=Math.max(0,Math.min(1,S.grip));
  S.grace=(S.grace||0)-dt;if(S.grace<=0){if(hc===0&&!S.limbs.LH.to&&!S.limbs.RH.to)startFall('Lost hold!');else if(hc===0&&fc<2)startFall('Peeled off!');
   else if(S.stamina<=0)startFall('Pumped out!');else if(S.grip<.08&&hq<2)startFall('Hands slipped!');}
 }
 S.hip.copy(ps.hip);S.chest.copy(ps.chest);if(S.mode==='climb')S.maxY=Math.max(S.maxY,ps.hip.y);
 // pose body
 const r=roots(ps);seg(parts.torso,ps.hip,ps.chest);parts.pelvis.position.copy(ps.hip);const sp=ps.chest.clone().sub(ps.hip).normalize();
 parts.pelvis.quaternion.setFromUnitVectors(up,sp);parts.harness.position.copy(ps.hip).addScaledVector(sp,.05);parts.harness.quaternion.setFromUnitVectors(V(0,0,1),sp);
 const hd=ps.chest.clone().addScaledVector(sp,.2*P.s);hd.z+=.03;parts.head.position.copy(hd);parts.helmet.position.copy(hd).addScaledVector(sp,.015);parts.helmet.quaternion.setFromUnitVectors(up,sp.clone().add(V(0,0,.2)).normalize());
 parts.hair.position.copy(hd).add(V(0,-.02,.03));if(parts.pony)parts.pony.position.copy(hd).add(V(0,-.08,.11));
 for(const L of LIMBS){const arm=L[1]==='H',side=L[0]==='L'?-1:1;const pole=arm?V(side,-1,.6):V(side*.2,.35,-1);
  const s=ik(r[L],S.limbs[L].pos,arm?P.arm1:P.leg1,arm?P.arm2:P.leg2,pole);const pt=parts[L];seg(pt.a,r[L],s.j);seg(pt.b,s.j,s.e);pt.e.position.copy(s.e);
  if(!arm){pt.e.position.copy(S.limbs[L].pos).add(V(0,.03,.08*P.s));pt.e.rotation.set(0,0,0);pt.loop.position.copy(r[L].clone().lerp(s.j,.12));pt.loop.quaternion.setFromUnitVectors(V(0,0,1),s.j.clone().sub(r[L]).normalize());}}
 updateRope(harnessPos());
 const sl=S.limbs[S.sel];selMark.visible=S.mode==='climb';selMark.position.copy(sl.pos).add(V(0,0,.05));
 markT-=dt;if(markT<=0){markT=.2;updateMarks();}
 // camera
 const portrait=innerHeight>innerWidth;camY+=(ps.hip.y+.4-2*Math.max(0,1-(ps.hip.y-S.startHip)/5)-camY)*Math.min(1,dt*3);const dist=portrait?12:10;
 camera.fov=portrait?66:55;camera.updateProjectionMatrix();camera.position.set(ps.hip.x*.6+(portrait?2.2:3.5),camY+(portrait?-.6:-.6),wallZ(ps.hip.x,ps.hip.y)+dist);camera.lookAt(ps.hip.x*.6+(portrait?.9:.6),camY+(portrait?.6:.2),wallZ(ps.hip.x,camY));
 sky.position.copy(camera.position);{const a=Math.min(1,(getHeight()-BASE)/(TOP-BASE));sky.material.uniforms.alt.value=a;scene.fog.color.setRGB(.66-.3*a,.76-.3*a,.87-.25*a);}mountains.position.y=camY*.92;ground.visible=camY<120;sun.position.set(camera.position.x-12,camY+9,4);sun.target.position.set(0,camY,0);
 updateChunks(Math.min(camY,S.mode==='fall'?ps.hip.y:camY));
 // hud
 hud.querySelector('#hb-s').style.width=S.stamina*100+'%';hud.querySelector('#hb-g').style.width=S.grip*100+'%';hud.querySelector('#hb-h').textContent=Math.round(getHeight()).toLocaleString('en-US')+' m';
 if(S.msgT>0){S.msgT-=dt;if(S.msgT<=0)hudMsg.style.opacity=0;}
 audT-=dt;if(audT<=0){audT=.2;const au=A();if(au){const alt=getHeight();au.wind?.(alt);au.breathing?.(S.effort||0);if(S.stamina<.3)au.heartbeat?.(1-S.stamina);au.weather?.('clear');au.setMusicIntensity?.(Math.min(1,(S.effort||0)*.6+(S.mode==='fall'?1:0)));
  if(!S.summit&&alt>=8849){S.summit=true;au.summit?.();msg('Summit! 8,849 m');}}}
 renderer.render(scene,camera);}
// ---------- init / API ----------
function start(opts={}){setProps(opts.climber==='boy'?'boy':'girl');buildBody();for(const p of S.pros)scene.remove(p.mesh);S.pros=[];for(const b of bolts)b.used=0;for(const h of holds)h.prot=0;
 resetGear();S.stamina=1;S.grip=1;S.mode='climb';S.fall=null;S.restY=0;S.summit=false;S.started=true;updateChunks(0);attachNear(V(0,4.2,0));
 const lp={};for(const L of LIMBS)lp[L]=S.limbs[L].pos;S.startHip=poseFrom(lp).hip.y;A()?.surface?.('rock');selectLimb('RH');return true;}
setProps('girl');updateChunks(0);start({climber:'girl'});S.started=false;resize();requestAnimationFrame(frame);
{let n=0;const iv=setInterval(()=>{if(document.getElementById('cl-ui')){document.body.classList.add('has-ui');clearInterval(iv);}if(++n>40)clearInterval(iv);},250);}
window.CLIMB={getStamina:()=>S.stamina,getGrip:()=>S.grip,getGear:()=>({...S.gear}),placeGear,selectLimb,onFall:cb=>{if(typeof cb==='function')S.fallCbs.push(cb);},
 start,getHeight,getCamSizes:()=>[...S.cams],autoMove,getSelectedLimb:()=>S.sel,isFalling:()=>S.mode==='fall',testFall:()=>startFall('Test fall'),_setClimbed:m=>{S.startHip=S.hip.y-m/SCALE;}};
window.dispatchEvent(new Event('climb-ready'));
