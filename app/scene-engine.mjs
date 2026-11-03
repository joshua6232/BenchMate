import * as T from 'three';
import { scenePixelRatio, qualityProfiles } from './scene-quality.mjs';
import { createSceneScheduler } from './scene-scheduler.mjs';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Interactive room geometry with a distant skyline image.
export function createDesk(host, { onPick, onHover, onReady, onFailure, anchors }) {
  let scheduler;
  const invalidate=()=>scheduler?.invalidate();
  const scene = new T.Scene();
  scene.background = new T.Color('#372744');
  scene.fog = new T.Fog('#5c4263', 42, 100);
  const camera = new T.PerspectiveCamera(37, 1, .1, 140);
  const renderer = new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power',failIfMajorPerformanceCaveat:true});
  renderer.setPixelRatio(1);
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=false;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.domElement.setAttribute('aria-label','Interactive 3D PC desk');
  host.appendChild(renderer.domElement);
  const environment=new RoomEnvironment();const pmrem=new T.PMREMGenerator(renderer);const envTarget=pmrem.fromScene(environment,.045);scene.environment=envTarget.texture;scene.environmentIntensity=.32;
  environment.dispose();pmrem.dispose();
  const geometries=new Set(),materials=new Set(),textures=new Set(),interactive=[],fans=[],screens=[],glows=[],rgbMaterials=[];
  const points={};const objectGroups={};
  const metal=mat('#141c25',.65,.31), black=mat('#080c11',.3,.43), edge=mat('#334553',.85,.25), rubber=mat('#070b10',.05,.78), wall=mat('#11171d',.1,.85), fabric=mat('#101922',.1,.92);
  const blue=mat('#badfff',.2,.32,'#a795ff',2.2), white=mat('#e1f4ff',.1,.3,'#b6e2ff',2), board=mat('#122026',.5,.62), copper=mat('#385763',.7,.4);
  function mat(color,metalness=0,roughness=.5,emissive='#000000',emissiveIntensity=0){const m=new T.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity});materials.add(m);return m;}
  function mesh(geometry,material,parent=scene,x=0,y=0,z=0){geometries.add(geometry);const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(w,h,d,material,parent,x=0,y=0,z=0,r=.025){return mesh(r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d),material,parent,x,y,z);}
  function cylinder(radius,height,material,parent,x,y,z){return mesh(new T.CylinderGeometry(radius,radius,height,32),material,parent,x,y,z);}
  function ring(radius,tube,material,parent,x,y,z){return mesh(new T.TorusGeometry(radius,tube,8,48),material,parent,x,y,z);}
  function group(id,x,y,z){const g=new T.Group();g.position.set(x,y,z);scene.add(g);if(id){g.userData.action=id;interactive.push(g);objectGroups[id]=g;}return g;}
  function anchor(id,x,y,z){points[id]=new T.Vector3(x,y,z);}
  function tube(points,radius,material,parent=scene){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,radius,6,false),material,parent);}
  // Tileable surface maps supply fine material detail without extra geometry.
  function surfaceTexture(kind){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');
    let seed=kind==='carpet'?91:205;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const data=ctx.createImageData(512,512);
    for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4;let v;
      if(kind==='carpet')v=55+rand()*80+Math.sin(x*2.8+y*.7)*13;
      else if(kind==='wood')v=100+22*Math.sin(y*.32+Math.sin(x*.015)*2)+13*Math.sin(y*1.8+x*.008)+rand()*17;
      else v=120+rand()*25+Math.sin(y*3)*13;
      data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=255;
    }ctx.putImageData(data,0,0);
    const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='carpet'?5:2,kind==='carpet'?4:2);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.add(t);return t;
  }
  const carpetMap=surfaceTexture('carpet'),woodMap=surfaceTexture('wood'),brushedMap=surfaceTexture('metal');
  metal.roughnessMap=brushedMap;metal.bumpMap=brushedMap;metal.bumpScale=.007;
  edge.roughnessMap=brushedMap;edge.bumpMap=brushedMap;edge.bumpScale=.003;
  fabric.bumpMap=carpetMap;fabric.bumpScale=.009;
  // Cinematic exterior plate sits beyond the real, interactive room geometry.
  // It is deliberately a distant image, not misrepresented as reconstructed 3D.
  const vistaMaterial=new T.MeshBasicMaterial({color:'#ffffff',toneMapped:false,fog:false});materials.add(vistaMaterial);
  const vista=mesh(new T.PlaneGeometry(64,36),vistaMaterial,scene,0,5,-30);vista.castShadow=false;vista.receiveShadow=false;
  new T.TextureLoader().load('/sunset-metropolis.png',texture=>{if(disposed){texture.dispose();return;}texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.add(texture);vistaMaterial.map=texture;vistaMaterial.needsUpdate=true;invalidate();});
  const floor=new T.MeshPhysicalMaterial({color:'#030303',metalness:0,roughness:1,specularIntensity:0,envMapIntensity:0,map:carpetMap,bumpMap:carpetMap,bumpScale:.035});materials.add(floor);box(34,.1,20,floor,scene,0,-.06,6,0);
  // Large glazing openings preserve the view; structural mullions frame the skyline.
  const trim=mat('#242030',.7,.28), rose=mat('#ef9a96',.3,.3,'#f77785',1.4);
  for(const x of [-10,-5.8,0,5.8,10]){box(.12,13,.22,trim,scene,x,5.8,-4.1,.008);box(.018,11,.025,rose,scene,x+.068,5.8,-3.97,0);}
  box(22,.18,.3,trim,scene,0,9.1,-4.1,.01);box(22,.15,.42,trim,scene,0,.18,-4.1,.01);
  box(22,.025,.03,rose,scene,0,8.98,-3.92,0);
  scene.add(new T.HemisphereLight('#efbfd6','#353049',1.3));
  const key=new T.DirectionalLight('#ffd1ad',3.3);key.position.set(6,8,-3);key.castShadow=false;key.shadow.mapSize.set(512,512);Object.assign(key.shadow.camera,{left:-9,right:9,top:7,bottom:-6});key.shadow.radius=4;key.shadow.bias=-.0005;key.shadow.normalBias=.035;scene.add(key);
  const fill=new T.PointLight('#9ca7ff',38,15,2);fill.position.set(-4,5,3);scene.add(fill);
  const warm=new T.PointLight('#ff8599',48,16,2);warm.position.set(4,5,1);scene.add(warm);
  const backlight=new T.PointLight('#e685ff',23,10,2);backlight.position.set(0,3,-1.6);scene.add(backlight);
  const deskmat=mat('#30282a',.12,.47);deskmat.map=woodMap;deskmat.bumpMap=woodMap;deskmat.bumpScale=.015;deskmat.roughnessMap=woodMap;box(11.7,.17,3.8,deskmat,scene,0,2.12,0,.04);
  box(11.45,.035,.025,blue,scene,0,2.09,1.91,.005);
  for(const x of [-4.35,4.35]){box(1.7,2.05,2.95,metal,scene,x,1.02,.03,.06);for(let i=0;i<3;i++){box(1.57,.48,.04,black,scene,x,.4+i*.59,1.53,.025);box(.53,.025,.05,edge,scene,x,.57+i*.59,1.57,.008);}box(1.6,.1,2.83,black,scene,x,.07,.03,.025);}
  // Monitor shelf and a wide mat establish the same composition as the reference.
  box(6.3,.13,1.03,metal,scene,-.65,2.43,-.62,.025);for(const x of [-3.55,2.2])box(.2,.26,.85,black,scene,x,2.29,-.62,.012);
  box(5.6,.027,1.55,fabric,scene,-.25,2.223,.85,.1);
  function screenTexture(label,sub){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=640;const ctx=canvas.getContext('2d');ctx.fillStyle='#08121d';ctx.fillRect(0,0,1024,640);const gradient=ctx.createRadialGradient(700,240,10,700,240,700);gradient.addColorStop(0,'#88506d');gradient.addColorStop(.48,'#342951');gradient.addColorStop(1,'#10172c');ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,640);ctx.strokeStyle='#477992';ctx.lineWidth=1.3;for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(1000,640,420+i*88,330+i*50,-.45,0,Math.PI*2);ctx.stroke();}ctx.fillStyle='#7da1b9';ctx.font='19px Arial';ctx.fillText('B E N C H M A T E',60,73);ctx.fillStyle='#e0f2ff';ctx.font='500 51px Arial';ctx.fillText(label,60,325);ctx.fillStyle='#90b6d2';ctx.font='23px Arial';ctx.fillText(sub,63,372);ctx.fillStyle='#a6d8f8';ctx.fillRect(63,414,56,2);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.add(texture);return texture;}
  function monitor(id,x,angle,label,sub){const g=group(id,x,3.69,-.74);g.rotation.y=angle;box(2.88,1.83,.12,black,g);box(2.84,1.79,.04,edge,g,0,0,-.075,.04);const material=new T.MeshStandardMaterial({map:screenTexture(label,sub),emissive:'#a8d6ff',emissiveMap:null,emissiveIntensity:.18,roughness:.32,metalness:.15});material.emissiveMap=material.map;materials.add(material);mesh(new T.PlaneGeometry(2.74,1.67),material,g,0,.02,.067);screens.push({id,material});box(.15,.43,.14,edge,g,0,-1.1,-.02);box(1,.045,.57,metal,g,0,-1.25,.11,.04);box(.9,.06,.09,edge,g,0,.99,.04,.025);box(.78,.012,.025,white,g,0,.96,.075,.004);const power=cylinder(.016,.008,blue,g,1.27,-.855,.073);power.rotation.x=Math.PI/2;anchor(id,x,3.7,-.58);}
  monitor('display',-2.13,.055,'Find your fix.','Troubleshooting');monitor('build',.84,-.055,'Build something great.','Parts & budgets');
  // Glass chassis with modeled motherboard, GPU, cables and animated fan blades.
  const tower=group('tower',4,3.18,-.42);tower.rotation.y=-.24;
  const rgbColors=['#ae6bff','#55dfff','#fa64b4'];
  function rgbMaterial(index){const m=mat(rgbColors[index%3],.15,.3,rgbColors[index%3],1.5);rgbMaterials.push({material:m,offset:index/3});return m;}
  const chassisW=1.47,chassisH=2.02,chassisD=1.62;
  box(chassisW,.11,chassisD,metal,tower,0,-chassisH/2,0);box(chassisW,.085,chassisD,metal,tower,0,chassisH/2,0);
  for(const x of [-.7,.7])for(const z of [-.76,.76])box(.075,2,.075,edge,tower,x,0,z,.012);
  box(.06,1.94,1.5,black,tower,.7,0,0);box(1.4,1.94,.06,black,tower,0,0,-.77);
  const glass=new T.MeshPhysicalMaterial({color:'#93b8d0',metalness:0,roughness:.08,transparent:true,opacity:.1,depthWrite:false,side:T.DoubleSide});materials.add(glass);
  const sideGlass=box(.017,1.91,1.47,glass,tower,-.745,0,0,0);sideGlass.castShadow=false;
  const frontGlass=box(1.33,1.91,.015,glass,tower,0,0,.8,0);frontGlass.castShadow=false;
  box(.05,1.55,1.21,board,tower,.51,.12,-.08,.01);
  for(let i=0;i<4;i++)box(.08,1.02,.045,i%2?edge:copper,tower,.39,.22,-.43+i*.13,.003);
  box(1.12,.17,1.15,metal,tower,0,-.35,.05,.035);box(1.05,.018,.025,blue,tower,0,-.29,.64,.003);
  box(1.31,.34,1.43,black,tower,0,-.77,0,.035);box(.4,.04,.025,edge,tower,.23,-.77,.735,.004);
  for(let i=0;i<12;i++)box(.9,.016,.011,edge,tower,0,.99,-.6+i*.095,.003);
  function fan(parent,x,y,z,r=.26,side=false){const f=new T.Group();f.position.set(x,y,z);if(side)f.rotation.y=Math.PI/2;parent.add(f);const housing=box(r*2.27,r*2.27,.08,black,f,0,0,-.035,.035);const rgb=rgbMaterial(fans.length);ring(r,.019,rgb,f,0,0,.025);ring(r*.83,.009,rgb,f,0,0,.028);const blades=new T.Group();f.add(blades);for(let i=0;i<7;i++){const b=box(r*.48,r*.9,.022,edge,blades,0,0,0,.04);const a=i*Math.PI*2/7;b.position.set(Math.cos(a)*r*.46,Math.sin(a)*r*.46,.02);b.rotation.z=a-.65;}const hub=cylinder(r*.24,.09,metal,f,0,0,.04);hub.rotation.x=Math.PI/2;fans.push(blades);return f;}
  for(const y of [-.57,.03,.63])fan(tower,.21,y,.695,.257);
  fan(tower,.41,.36,-.06,.265,true);
  tube([[-.25,.55,-.12],[.05,.8,-.4],[.4,.77,-.5],[.4,.6,-.5]],.026,rubber,tower);tube([[-.25,.5,-.04],[.02,.68,-.32],[.32,.68,-.5],[.35,.6,-.5]],.026,rubber,tower);
  box(1.17,.018,.022,rgbMaterial(1),tower,0,.91,.48,.004);box(1.15,.018,.022,rgbMaterial(2),tower,0,-.56,.62,.004);
  const rgbLight=new T.PointLight('#b478ff',4,2.8,2);rgbLight.position.set(0,.3,.4);tower.add(rgbLight);
  for(const x of [-.5,.5])for(const z of [-.55,.55])box(.2,.14,.2,rubber,tower,x,-1.11,z,.025);
  anchor('tower',4.2,3.45,.5);
  // Individual keycaps, subtle backlighting and the mouse are independent meshes.
  const keyboard=group('keyboard',-.55,2.29,.91);keyboard.rotation.x=.065;box(2.51,.1,.89,metal,keyboard,0,0,0,.06);box(2.42,.013,.8,blue,keyboard,0,.052,0,.03);
  const keys=new T.InstancedMesh(new RoundedBoxGeometry(.142,.07,.137,1,.013),black,70);geometries.add(keys.geometry);const matrix=new T.Matrix4();let keyIndex=0;for(let r=0;r<5;r++)for(let c=0;c<14;c++){matrix.makeTranslation(-1.12+c*.17,.09,-.32+r*.157);keys.setMatrixAt(keyIndex++,matrix);}keys.castShadow=true;keyboard.add(keys);box(.85,.075,.13,edge,keyboard,-.15,.091,.312,.013);anchor('keyboard',-.55,2.48,.95);
  const mouse=group('mouse',1.32,2.29,1.02);const mouseShell=mesh(new T.SphereGeometry(.28,32,20),metal,mouse);mouseShell.scale.set(.72,.37,1.18);box(.008,.01,.28,black,mouse,0,.105,-.085,.002);const wheel=cylinder(.045,.038,rubber,mouse,0,.113,-.1);wheel.rotation.z=Math.PI/2;box(.007,.008,.17,blue,mouse,0,.113,.13,.002);anchor('mouse',1.32,2.52,1.02);
  function speaker(id,x){const g=group(id,x,2.76,-.52);box(.61,1.11,.57,black,g,0,0,0,.05);for(const [y,r] of [[-.16,.215],[.3,.11]]){const cone=cylinder(r,.038,edge,g,0,y,.3);cone.rotation.x=Math.PI/2;const inner=cylinder(r*.76,.045,rubber,g,0,y,.33);inner.rotation.x=Math.PI/2;ring(r,.015,metal,g,0,y,.335);const cap=mesh(new T.SphereGeometry(r*.35,20,12),metal,g,0,y,.354);cap.scale.z=.4;}anchor(id,x,2.98,-.12);}
  speaker('speaker-left',-4);speaker('speaker',2.73);
  const headphones=group('headphones',-5.06,2.97,.2);cylinder(.32,.045,metal,headphones,0,-.73,0);box(.035,.93,.04,edge,headphones,0,-.25,0,.015);box(.43,.05,.12,metal,headphones,0,.24,0,.024);
  const band=mesh(new T.TorusGeometry(.4,.057,12,36,Math.PI),black,headphones,0,.02,.06);band.rotation.z=0;
  const bandEdge=mesh(new T.TorusGeometry(.4,.018,8,36,Math.PI),edge,headphones,0,.035,.097);
  for(const x of [-.4,.4]){const cup=mesh(new T.SphereGeometry(.205,24,18),metal,headphones,x,-.14,.06);cup.scale.set(.65,1,.78);const cushion=mesh(new T.SphereGeometry(.19,24,16),rubber,headphones,x+(x<0?.06:-.06),-.14,.06);cushion.scale.set(.4,1,.75);const trim=ring(.154,.012,blue,headphones,x,-.14,.204);trim.scale.x=.7;}
  anchor('headphones',-5.02,3.13,.45);
  // A single clean world-space halo on each interactive object.
  Object.entries(points).forEach(([id,p])=>{const halo=ring(.062,.0035,white,scene,p.x,p.y+.18,p.z+.08);halo.castShadow=false;halo.userData.action=id;glows.push({id,mesh:halo});});
  let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches, paused=true, active=null, hovered=null, disposed=false;
  let quality='balanced';
  let width=1,height=1,time=0,lastTime=0,dragging=false,moved=false,downX=0,offsetX=0,targetOffset=0;
  const pointer=new T.Vector2(),raycaster=new T.Raycaster(),look=new T.Vector3(0,2.7,0),cameraGoal=new T.Vector3(),lookGoal=new T.Vector3();
  const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');const reducedChange=e=>{reduced=e.matches;invalidate();};reducedQuery.addEventListener('change',reducedChange);
  function resize(){width=Math.max(1,host.clientWidth);height=Math.max(1,host.clientHeight);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setPixelRatio(scenePixelRatio(width,height,window.devicePixelRatio,quality,renderer.capabilities.maxTextureSize));renderer.setSize(width,height,false);invalidate();}
  window.addEventListener('resize',resize);
  const ro=new ResizeObserver(resize);ro.observe(host);resize();camera.position.set(0,5.3,14);camera.lookAt(look);
  function pick(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const intersections=raycaster.intersectObjects(interactive,true);for(const hit of intersections){let o=hit.object;while(o){if(o.userData.action)return o.userData.action;o=o.parent;}}return null;}
  function hover(id){if(id===hovered)return;hovered=id;invalidate();renderer.domElement.style.cursor=id?'pointer':'grab';onHover(id);}
  function move(e){invalidate();if(dragging){const delta=e.clientX-downX;if(Math.abs(delta)>5)moved=true;if(width<700)targetOffset=T.MathUtils.clamp(offsetX-delta*.008,-3.8,3.8);}if(e.pointerType==='mouse'&&!dragging){const r=host.getBoundingClientRect();pointer.x=(e.clientX-r.left)/width*2-1;pointer.y=(e.clientY-r.top)/height*2-1;hover(pick(e));}}
  function down(e){dragging=true;moved=false;downX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);}
  function up(e){dragging=false;offsetX=targetOffset;if(!moved){const id=pick(e);if(id)onPick(id);}if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);}
  const leave=()=>{if(!dragging){pointer.set(0,0);hover(null);invalidate();}};
  renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointerleave',leave);
  const contextLost=e=>{e.preventDefault();scheduler?.dispose();onFailure();};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  function frame(ms){if(disposed||document.hidden)return;const dt=Math.min((ms-lastTime)/1000||.016,.05);lastTime=ms;if(!paused&&!reduced)time+=dt;
    const narrow=width<700;const parallax=paused||reduced||active?0:1;const baseX=narrow?targetOffset:0;
    const distance=narrow?12.6:Math.max(13.7,6.4/(Math.tan(T.MathUtils.degToRad(18.5))*camera.aspect));
    cameraGoal.set(baseX+pointer.x*.26*parallax,2.8+2.38*distance/13.7-pointer.y*.1*parallax,distance);
    lookGoal.set(baseX,2.8,0);
    if(active&&points[active]&&!reduced){const p=points[active];cameraGoal.set(p.x*.42,2.8+1.9*distance/13.7,distance*.88);lookGoal.set(p.x*.35,2.95,0);}
    camera.position.lerp(cameraGoal,reduced?1:1-Math.exp(-dt*5));look.lerp(lookGoal,reduced?1:1-Math.exp(-dt*5));camera.lookAt(look);
    if(!paused&&!reduced)fans.forEach((f,i)=>f.rotation.z=time*(1.5+i*.15));
    rgbMaterials.forEach(({material,offset})=>{material.emissive.setHSL((.57+offset*.22+time*.025)%1,.95,.43);material.color.copy(material.emissive).multiplyScalar(.35);});rgbLight.color.copy(rgbMaterials[0].material.emissive);
    screens.forEach(s=>{s.material.emissiveIntensity=T.MathUtils.lerp(s.material.emissiveIntensity,s.id===hovered?.7:.18,.12);});
    glows.forEach(({id,mesh})=>{mesh.quaternion.copy(camera.quaternion);const pulse=paused||reduced?1:1+Math.sin(time*1.5)*.08;mesh.scale.setScalar(hovered===id?1.45:pulse);});
    sideGlass.position.x=T.MathUtils.lerp(sideGlass.position.x,hovered==='tower'&&!paused&&!reduced?-1.06:-.745,.055);
    for(const [id,p] of Object.entries(points)){const el=anchors[id];if(!el)continue;const projected=p.clone().add(new T.Vector3(0,.18,.08)).project(camera);el.style.left=((projected.x*.5+.5)*width)+'px';el.style.top=((-projected.y*.5+.5)*height)+'px';el.style.visibility=projected.z>1||projected.x<-1.05||projected.x>1.05?'hidden':'visible';}
    renderer.render(scene,camera);
  }
  scheduler=createSceneScheduler({render:frame,isMoving:()=>!paused&&!reduced&&!active,isHidden:()=>document.hidden});
  const visibilityChange=()=>scheduler.visibilityChanged();document.addEventListener('visibilitychange',visibilityChange);
  scheduler.invalidate();onReady();
  return {setQuality(value){quality=Object.hasOwn(qualityProfiles,value)?value:'balanced';resize();},setActive(value){active=value;invalidate();},setPaused(value){paused=value;invalidate();},setHover(id){hover(id);},focus(id){if(width<700&&points[id])targetOffset=T.MathUtils.clamp(points[id].x,-3.8,3.8);invalidate();},dispose(){disposed=true;scheduler.dispose();document.removeEventListener('visibilitychange',visibilityChange);ro.disconnect();window.removeEventListener('resize',resize);reducedQuery.removeEventListener('change',reducedChange);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('webglcontextlost',contextLost);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());envTarget.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}

