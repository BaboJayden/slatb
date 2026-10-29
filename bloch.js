(() => {
  const canvas = document.querySelector("#bloch-canvas");
  const ctx = canvas.getContext("2d");
  let v = { x: 0, y: 0, z: 1 }, path = [], dragging = false, animation = 0;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const norm = q => { const n = Math.hypot(q.x,q.y,q.z)||1; return {x:q.x/n,y:q.y/n,z:q.z/n}; };
  const color = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const project = (q,cx,cy,r) => ({x:cx+r*(q.x*.82+q.y*.34),y:cy-r*(q.z*.88-q.y*.22)});

  function draw() {
    const d=Math.max(1,devicePixelRatio||1), box=canvas.getBoundingClientRect(), w=Math.max(300,box.width), h=Math.max(360,box.height);
    canvas.width=Math.round(w*d); canvas.height=Math.round(h*d); ctx.setTransform(d,0,0,d,0,0); ctx.clearRect(0,0,w,h);
    const cx=w/2,cy=h/2+6,r=Math.min(w*.39,h*.39),ink=color("--navy"),line=color("--line"),accent=color("--accent");
    ctx.lineWidth=1.25; ctx.strokeStyle=line; ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([6,7]);ctx.beginPath();ctx.ellipse(cx,cy,r,r*.28,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle=ink;ctx.fillStyle=ink;ctx.font="700 13px ui-monospace,monospace";
    [[{x:-1.15,y:0,z:0},{x:1.15,y:0,z:0},"x"],[{x:0,y:-1.15,z:0},{x:0,y:1.15,z:0},"y"],[{x:0,y:0,z:-1.15},{x:0,y:0,z:1.15},"z"]].forEach(([a,b,l])=>{a=project(a,cx,cy,r);b=project(b,cx,cy,r);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillText(l,b.x+5,b.y-5);});
    ctx.fillText("|0⟩",cx+10,cy-r-14);ctx.fillText("|1⟩",cx+10,cy+r+25);
    if(path.length>1){ctx.globalAlpha=.55;ctx.setLineDash([5,6]);ctx.beginPath();path.forEach((q,i)=>{q=project(q,cx,cy,r);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
    const t=project(v,cx,cy,r),a=Math.atan2(t.y-cy,t.x-cx);ctx.strokeStyle=accent;ctx.fillStyle=accent;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(t.x,t.y);ctx.stroke();ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.x-14*Math.cos(a-.45),t.y-14*Math.sin(a-.45));ctx.lineTo(t.x-14*Math.cos(a+.45),t.y-14*Math.sin(a+.45));ctx.closePath();ctx.fill();ctx.beginPath();ctx.arc(t.x,t.y,8,0,Math.PI*2);ctx.fill();
  }
  function readout(status){const th=Math.acos(Math.max(-1,Math.min(1,v.z))),ph=(Math.atan2(v.y,v.x)+Math.PI*2)%(Math.PI*2),a=Math.cos(th/2),b=Math.sin(th/2),beta=b<.0005?"0":`${b.toFixed(3)}${ph<.0005?"":`eⁱ${(ph*180/Math.PI).toFixed(1)}°`}`,p0=(1+v.z)/2;$("#ket-state").textContent=`|ψ⟩ = ${a.toFixed(3)}|0⟩ + ${beta}|1⟩`;$("#angle-state").textContent=`θ = ${(th*180/Math.PI).toFixed(1)}° · φ = ${(ph*180/Math.PI).toFixed(1)}°`;$("#vector-values").textContent=`x ${v.x.toFixed(3)} · y ${v.y.toFixed(3)} · z ${v.z.toFixed(3)}`;$("#p-zero").textContent=`${(p0*100).toFixed(1)}%`;$("#p-one").textContent=`${((1-p0)*100).toFixed(1)}%`;$("#bar-zero").style.width=`${p0*100}%`;$("#bar-one").style.width=`${(1-p0)*100}%`;if(status)$("#gate-status").textContent=status;draw();}
  function gate(q,g){const {x,y,z}=q;if(g==="X")return{x,y:-y,z:-z};if(g==="Y")return{x:-x,y,z:-z};if(g==="Z")return{x:-x,y:-y,z};if(g==="H")return{x:z,y:-y,z:x};const a=g==="S"?Math.PI/2:Math.PI/4;return{x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a),z};}
  function mix(a,b,t){return norm({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});}
  function animate(g){cancelAnimationFrame(animation);const from={...v},to=norm(gate(from,g)),start=performance.now();path=[from];$$('.gate').forEach(b=>b.classList.toggle('running',b.dataset.gate===g));const frame=now=>{const p=Math.min(1,(now-start)/620),e=1-Math.pow(1-p,3);v=mix(from,to,e);path.push({...v});readout(`${g} 게이트 적용 중`);if(p<1)animation=requestAnimationFrame(frame);else{$$('.gate').forEach(b=>b.classList.remove('running'));v=to;readout(`${g} 게이트 적용 완료`);}};animation=requestAnimationFrame(frame);}
  function drag(e){const b=canvas.getBoundingClientRect(),cx=b.width/2,cy=b.height/2+6,r=Math.min(b.width*.39,b.height*.39);let x=(e.clientX-b.left-cx)/r,z=-(e.clientY-b.top-cy)/r,n=Math.hypot(x,z);if(n>1){x/=n;z/=n}v=norm({x,y:Math.sqrt(Math.max(0,1-x*x-z*z))*(v.y<0?-1:1),z});path=[];readout("드래그로 상태 설정");}
  canvas.addEventListener('pointerdown',e=>{dragging=true;canvas.setPointerCapture(e.pointerId);cancelAnimationFrame(animation);drag(e)});canvas.addEventListener('pointermove',e=>dragging&&drag(e));canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
  $$('.gate').forEach(b=>b.addEventListener('click',()=>animate(b.dataset.gate)));
  const states={zero:{x:0,y:0,z:1},one:{x:0,y:0,z:-1},plus:{x:1,y:0,z:0},minus:{x:-1,y:0,z:0},'plus-i':{x:0,y:1,z:0}};
  $$('[data-state]').forEach(b=>b.addEventListener('click',()=>{v={...states[b.dataset.state]};path=[];readout(`${b.textContent} 기준 상태`)}));
  $('#reset-bloch').addEventListener('click',()=>{v={x:0,y:0,z:1};path=[];readout('|0⟩로 초기화')});new ResizeObserver(draw).observe(canvas);readout();
  const random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
  $('#measure-once').addEventListener('click',()=>{const p0=(1+v.z)/2,out=random()<p0?0:1;v={x:0,y:0,z:out? -1:1};path=[];$('#count-zero').textContent=out?'관측 결과 없음':'관측 결과 1회';$('#count-one').textContent=out?'관측 결과 1회':'관측 결과 없음';readout(`관측 결과 |${out}⟩ · 상태 붕괴`)});
  $('#measure-hundred').addEventListener('click',()=>{const p0=(1+v.z)/2;let n0=0;for(let i=0;i<100;i++)if(random()<p0)n0++;$('#count-zero').textContent=`100회 중 ${n0}회`;$('#count-one').textContent=`100회 중 ${100-n0}회`;$('#gate-status').textContent=`100회 표본 · |0⟩ ${n0}회 · |1⟩ ${100-n0}회`;});
})();

