/* global planck */
document.addEventListener('DOMContentLoaded', () => {
  const pl = planck;
  const scale = 40; // 1m = 40px

  const canvas = document.getElementById('game');
  if (!canvas) { console.error('[playground] #game não encontrado'); return; }
  const ctx = canvas.getContext('2d');

  // UI
  const btnPlay   = document.getElementById('btnPlay');
  const btnReset  = document.getElementById('btnReset');
  const bannerWin = document.getElementById('bannerWin');
  const triesEl   = document.querySelector('#tries');
  const timeEl    = document.querySelector('#time');

// === BUCKET: pré-carregamento ===
const imgBucket = new Image();
let bucketReady = false;
imgBucket.onload = () => { bucketReady = true; };
imgBucket.onerror = (e) => console.error('[bucket] erro ao carregar assets/png/bucket.png', e);
imgBucket.src = './assets/png/bucket.png'; // caminho relativo ao HTML


  // Ajuste DPR para desenhar em px CSS (ghost segue o mouse certinho)
  function fitCanvas() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width  * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  // Estado geral
  let world;
  let editing = true;
  let tries = 0, levelStartTime = 0, timerInterval = null;

  // Coleções
  let ball;
  let ramps = [];      // { body, w, h }
  let seesaws = [];    // { pivot, plank, joint, w, h }
  let goalSensor;
  let bucketBodies = [];

  // Colocação (ghost corrente)
  let placing = null;   // { type: 'ramp'|'seesaw', body|pivot/plank, w, h, pointerId? }

  // Seleção/drag de itens existentes
  let selecting = null; // { kind:'ramp'|'seesaw', item, pointerId, grabDX, grabDY }

  // Posição visual do sprite do balde (mesma usada antes)
  const BUCKET_ANCHOR = { x: 760, y: 420 };
  const BUCKET_SCALE  = 0.75;

  const toRad = d => d*Math.PI/180;
  const px2m = (px) => px / scale;
  const m2px = (m)  => m * scale;

  // ===== Setup do mundo =====
  function setup(){
    if (!window.planck) { console.error('[playground] planck.min.js não carregado'); return; }

    world = new pl.World({ gravity: pl.Vec2(0, 10) });

    // chão
    {
      const floor = world.createBody();
      floor.createFixture(pl.Box(px2m(960/2), px2m(60/2)), {density:0, friction:0.5});
      floor.setPosition(pl.Vec2(px2m(480), px2m(610)));
    }

    // bola
    {
      ball = world.createDynamicBody(pl.Vec2(px2m(25), px2m(25)));
      ball.createFixture(pl.Circle(px2m(20)), { density: 1, friction: 0.05, restitution: 0.2 });
      ball.setLinearDamping(0.01);
    }

    // balde + sensor (físico)
    {
      const bx=800, by=540, wallH=90, wallT=12, innerW=90;

      const left  = world.createBody(); left.setPosition(pl.Vec2(px2m(bx - innerW/2), px2m(by - wallH/2)));
      const right = world.createBody(); right.setPosition(pl.Vec2(px2m(bx + innerW/2), px2m(by - wallH/2)));
      const base  = world.createBody(); base.setPosition(pl.Vec2(px2m(bx), px2m(by)));
      left.createFixture(pl.Box(px2m(wallT/2), px2m(wallH/2)));
      right.createFixture(pl.Box(px2m(wallT/2), px2m(wallH/2)));
      base.createFixture(pl.Box(px2m(innerW/2), px2m(wallT/2)));
      bucketBodies = [left, right, base];

      goalSensor = world.createBody();
      goalSensor.setPosition(pl.Vec2(px2m(bx), px2m(by-10)));
      const f = goalSensor.createFixture(pl.Box(px2m((innerW-12)/2), px2m(10)), { isSensor: true });
      goalSensor._sensorFixture = f;
    }

    // vitória: bola parada ~1s dentro do sensor
    let insideFlag=false, insideTime=0;
    world.on('begin-contact', (c)=>{
      const a=c.getFixtureA(), b=c.getFixtureB();
      if((a===goalSensor._sensorFixture && b.getBody()===ball) ||
         (b===goalSensor._sensorFixture && a.getBody()===ball)){
        insideFlag = true; insideTime = performance.now();
      }
    });
    world.on('end-contact', (c)=>{
      const a=c.getFixtureA(), b=c.getFixtureB();
      if((a===goalSensor._sensorFixture && b.getBody()===ball) ||
         (b===goalSensor._sensorFixture && a.getBody()===ball)){
        insideFlag = false;
      }
    });
    setInterval(()=>{
      if(!editing && insideFlag){
        const v = ball.getLinearVelocity();
        const speed = Math.hypot(v.x, v.y);
        if(speed < 0.3 && (performance.now()-insideTime) > 1000){
          showWin();
        }
      }
    }, 120);

    // input
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup',   onPointerUp);

    // teclado: Q/E para girar (prioriza selecionado; senão, ghost de rampa)
    window.addEventListener('keydown', onKeyRotateQE);

    // toolbox → criar ghost já sob o cursor (usa clientX/clientY)
    document.addEventListener('toolbox:start', (e) => {
      if(!editing) return;
      const { type, clientX, clientY } = e.detail || {};
      if (type === 'ramp')   startPlacingRamp({ clientX, clientY });
      if (type === 'seesaw') startPlacingSeesaw({ clientX, clientY });
      // ao iniciar novo placement, cancela seleção atual
      selecting = null;
    });

    // timer ui
    levelStartTime = performance.now();
    updateTimer(true);

    requestAnimationFrame(loop);
  }

  function updateTimer(reset=false){
    if(reset && timerInterval) clearInterval(timerInterval);
    timerInterval=setInterval(()=>{
      const secs=(performance.now()-levelStartTime)/1000;
      if(timeEl) timeEl.textContent = secs.toFixed(1)+'s';
    },100);
  }

  // ===== Criação do ghost: Rampa =====
  function startPlacingRamp(init = {}){
    if (placing) return; // evita dois ghosts
    const w=180, h=16;
    const body = world.createBody(); // ghost estático
    // posição inicial: sob o cursor (se houver), senão off-screen para não "piscar"
    let cx, cy;
    if (Number.isFinite(init.clientX) && Number.isFinite(init.clientY)) {
      const p = screenToCanvas(init.clientX, init.clientY);
      cx = p.x; cy = p.y;
    } else {
      cx = -9999; cy = -9999;
    }
    body.setPosition(pl.Vec2(px2m(cx), px2m(cy)));
    body.setAngle(toRad(-20));
    body.createFixture(pl.Box(px2m(w/2), px2m(h/2)), { friction: 0.5 });
    placing = { type:'ramp', body, w, h };
  }

  // ===== Criação do ghost: Gangorra =====
  function startPlacingSeesaw(init = {}){
    if (placing) return;
    const w=200, h=16;

    // posição inicial idem (sob cursor ou off-screen)
    let cx, cy;
    if (Number.isFinite(init.clientX) && Number.isFinite(init.clientY)) {
      const p = screenToCanvas(init.clientX, init.clientY);
      cx = p.x; cy = p.y;
    } else {
      cx = -9999; cy = -9999;
    }
    const x0 = px2m(cx), y0 = px2m(cy);

    const pivot = world.createBody(); pivot.setPosition(pl.Vec2(x0, y0)); // estático
    const plank = world.createDynamicBody(pl.Vec2(x0, y0));               // dinâmico
    plank.createFixture(pl.Box(px2m(w/2), px2m(h/2)), { density:1, friction:0.3, restitution:0.2 });
    const joint = world.createJoint(pl.RevoluteJoint({}, pivot, plank, pl.Vec2(x0, y0)));

    placing = { type:'seesaw', pivot, plank, joint, w, h };
  }

  // ===== Hit Testing =====
  function pointInRotatedRect(px, py, cx, cy, w, h, ang){
    const dx = px - cx;
    const dy = py - cy;
    const cos = Math.cos(-ang);
    const sin = Math.sin(-ang);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    return Math.abs(lx) <= w/2 && Math.abs(ly) <= h/2;
  }

  function hitTestAt(cssX, cssY){
    for (let i = seesaws.length - 1; i >= 0; i--){
      const s = seesaws[i];
      const p = s.plank.getPosition();
      const cx = m2px(p.x), cy = m2px(p.y), ang = s.plank.getAngle();
      if (pointInRotatedRect(cssX, cssY, cx, cy, s.w, s.h, ang)) {
        return { kind:'seesaw', item: s };
      }
    }
    for (let i = ramps.length - 1; i >= 0; i--){
      const r = ramps[i];
      const p = r.body.getPosition();
      const cx = m2px(p.x), cy = m2px(p.y), ang = r.body.getAngle();
      if (pointInRotatedRect(cssX, cssY, cx, cy, r.w, r.h, ang)) {
        return { kind:'ramp', item: r };
      }
    }
    return null;
  }

  // ===== Pointer =====
  function onPointerDown(ev){
    canvas.setPointerCapture?.(ev.pointerId);

    if (placing) {
      placing.pointerId = ev.pointerId;
      selecting = null;
      return;
    }
    if (!editing) return;

    const pt = screenToCanvas(ev.clientX, ev.clientY);
    const hit = hitTestAt(pt.x, pt.y);
    if (hit) {
      if (hit.kind === 'ramp') {
        const b   = hit.item.body;
        const pos = b.getPosition();
        const cx = m2px(pos.x), cy = m2px(pos.y);
        selecting = { kind:'ramp', item: hit.item, pointerId: ev.pointerId, grabDX: pt.x - cx, grabDY: pt.y - cy };
      } else if (hit.kind === 'seesaw') {
        const b   = hit.item.plank;
        const pos = b.getPosition();
        const cx = m2px(pos.x), cy = m2px(pos.y);
        selecting = { kind:'seesaw', item: hit.item, pointerId: ev.pointerId, grabDX: pt.x - cx, grabDY: pt.y - cy };
      }
    } else {
      selecting = null;
    }
  }

  function onPointerMove(ev){
    if(placing && editing){
      if (placing.pointerId && ev.pointerId !== placing.pointerId) return;
      const p = screenToCanvas(ev.clientX, ev.clientY);
      if (placing.type === 'ramp') {
        placing.body.setTransform(pl.Vec2(px2m(p.x), px2m(p.y)), placing.body.getAngle());
      } else if (placing.type === 'seesaw') {
        const pos = pl.Vec2(px2m(p.x), px2m(p.y));
        placing.pivot.setTransform(pos, 0);
        placing.plank.setTransform(pos, placing.plank.getAngle());
      }
      return;
    }

    if (selecting && editing) {
      if (ev.pointerId !== selecting.pointerId) return;
      const p = screenToCanvas(ev.clientX, ev.clientY);
      const nx = p.x - selecting.grabDX;
      const ny = p.y - selecting.grabDY;
      if (selecting.kind === 'ramp') {
        const b = selecting.item.body;
        b.setTransform(pl.Vec2(px2m(nx), px2m(ny)), b.getAngle());
      } else if (selecting.kind === 'seesaw') {
        const s = selecting.item;
        const pos = pl.Vec2(px2m(nx), px2m(ny));
        s.pivot.setTransform(pos, 0);
        s.plank.setTransform(pos, s.plank.getAngle());
      }
      return;
    }
  }

  function onPointerUp(ev){
    if(placing){
      try { canvas.releasePointerCapture?.(ev.pointerId); } catch(_) {}
      const r = canvas.getBoundingClientRect();
      const inside = ev.clientX>=r.left && ev.clientX<=r.right && ev.clientY>=r.top && ev.clientY<=r.bottom;
      if (inside) {
        if (placing.type === 'ramp') {
          ramps.push({ body: placing.body, w: placing.w, h: placing.h });
          document.dispatchEvent(new CustomEvent('toolbox:consume', { detail:{ type:'ramp' } }));
        } else if (placing.type === 'seesaw') {
          seesaws.push({ pivot: placing.pivot, plank: placing.plank, joint: placing.joint, w: placing.w, h: placing.h });
          document.dispatchEvent(new CustomEvent('toolbox:consume', { detail:{ type:'seesaw' } }));
        }
      } else {
        if (placing.type === 'ramp') {
          world.destroyBody(placing.body);
          document.dispatchEvent(new CustomEvent('toolbox:refund', { detail:{ type:'ramp' } }));
        } else if (placing.type === 'seesaw') {
          world.destroyJoint(placing.joint);
          world.destroyBody(placing.plank);
          world.destroyBody(placing.pivot);
          document.dispatchEvent(new CustomEvent('toolbox:refund', { detail:{ type:'seesaw' } }));
        }
      }
      placing = null;
      return;
    }

    if (selecting && ev.pointerId === selecting.pointerId) {
      try { canvas.releasePointerCapture?.(ev.pointerId); } catch(_) {}
      selecting.pointerId = null;
    }
  }

  // ===== Rotação: Q/E =====
  function onKeyRotateQE(e){
    if (!editing) return;

    const k = e.key.toLowerCase();
    if (k !== 'q' && k !== 'e') return;

    const stepDeg = e.shiftKey ? 15 : 5;
    const delta = (k === 'q' ? -stepDeg : stepDeg);

    if (selecting) {
      rotateSelected(delta);
      return;
    }
    if (placing && placing.type === 'ramp') {
      const a = placing.body.getAngle();
      placing.body.setTransform(placing.body.getPosition(), a + toRad(delta));
    }
  }

  function rotateSelected(deltaDeg){
    if (!selecting) return;
    const delta = toRad(deltaDeg);

    if (selecting.kind === 'ramp') {
      const b = selecting.item.body;
      const pos = b.getPosition();
      const ang = b.getAngle() + delta;
      b.setTransform(pos, ang);
    } else if (selecting.kind === 'seesaw') {
      const s = selecting.item;
      const pos = s.plank.getPosition();
      const ang = s.plank.getAngle() + delta;
      s.plank.setTransform(pos, ang);
    }
  }

  // controles
  btnPlay?.addEventListener('click', ()=>{
    if(editing){
      editing=false; bannerWin?.classList.remove('show');
      selecting = null;
      tries++; if(triesEl) triesEl.textContent=tries;
    }
  });
  btnReset?.addEventListener('click', ()=>{
    editing=true; bannerWin?.classList.remove('show');
    selecting = null;
    ball.setTransform(pl.Vec2(px2m(25), px2m(25)), 0);
    ball.setLinearVelocity(pl.Vec2(0,0));
    ball.setAngularVelocity(0);
    levelStartTime=performance.now(); updateTimer(true);
  });

  // utils
  function screenToCanvas(cx, cy){
    const r = canvas.getBoundingClientRect();
    return { x: cx - r.left, y: cy - r.top };
  }
  function showWin(){ editing=true; bannerWin?.classList.add('show'); }

  // ===== Render =====
  function loop(){
    if(!editing){ world.step(1/60); }
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
    drawGrid();

    // rampas
    for(const item of ramps){
      const b = item.body, p = b.getPosition();
      const cx = m2px(p.x), cy = m2px(p.y), ang = b.getAngle();
      const selected = selecting && selecting.kind==='ramp' && selecting.item===item;
      drawPlank(cx, cy, item.w, item.h, ang, '#f1d9b8', false, selected);
    }
    // gangorras
    for(const s of seesaws){
      const p = s.plank.getPosition();
      const cx = m2px(p.x), cy = m2px(p.y), ang = s.plank.getAngle();
      const selected = selecting && selecting.kind==='seesaw' && selecting.item===s;
      drawPlank(cx, cy, s.w, s.h, ang, '#a8d1f1', false, selected);
      drawPivot(m2px(s.pivot.getPosition().x), m2px(s.pivot.getPosition().y));
    }
    // ghost
    if(placing){
      if(placing.type === 'ramp'){
        const p = placing.body.getPosition();
        drawPlank(m2px(p.x), m2px(p.y), placing.w, placing.h, placing.body.getAngle(), 'rgba(241,217,184,.7)', true);
      } else if (placing.type === 'seesaw'){
        const p = placing.plank.getPosition();
        drawPlank(m2px(p.x), m2px(p.y), placing.w, placing.h, placing.plank.getAngle(), 'rgba(168,209,241,.7)', true);
        drawPivot(m2px(placing.pivot.getPosition().x), m2px(placing.pivot.getPosition().y), true);
      }
    }
    // bola
    {
      const p = ball.getPosition();
      drawBall(m2px(p.x), m2px(p.y), 20);
    }
    // bucket sprite (restaurado)
    drawBucketSprite();

    requestAnimationFrame(loop);
  }

  // helpers de desenho
  function drawGrid(){
    const step=40;
    ctx.save();
    ctx.globalAlpha=.18;
    ctx.beginPath();
    for(let x=0;x<=canvas.clientWidth;x+=step){ ctx.moveTo(x,0); ctx.lineTo(x,canvas.clientHeight); }
    for(let y=0;y<=canvas.clientHeight;y+=step){ ctx.moveTo(0,y); ctx.lineTo(canvas.clientWidth,y); }
    ctx.strokeStyle='#a9cfcf'; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();
  }
  function drawPlank(x,y,w,h,ang,fill,ghost=false,selected=false){
    ctx.save(); ctx.translate(x,y); ctx.rotate(ang);
    ctx.fillStyle=fill; ctx.strokeStyle='#8a5a3b'; ctx.lineWidth=2;
    roundRect(ctx,-w/2,-h/2,w,h,6); ctx.fill(); ctx.stroke();
    if(!ghost){
      ctx.globalAlpha=.25; ctx.beginPath();
      for(let i=-w/2+6;i<w/2-6;i+=10){ ctx.moveTo(i,-h/2+3); ctx.lineTo(i+8,h/2-3); }
      ctx.strokeStyle='#8a5a3b'; ctx.lineWidth=1; ctx.stroke();
      ctx.globalAlpha=1;
      if (selected){
        ctx.setLineDash([6,4]);
        ctx.strokeStyle='#00a4a6';
        ctx.lineWidth=2;
        ctx.strokeRect(-w/2-4,-h/2-4,w+8,h+8);
        ctx.setLineDash([]);
      }
    } else {
      ctx.setLineDash([6,6]); ctx.strokeStyle='#20b2aa'; ctx.lineWidth=2;
      ctx.strokeRect(-w/2,-h/2,w,h); ctx.setLineDash([]);
    }
    ctx.restore();
  }
  function drawPivot(x,y,ghost=false){
    ctx.save();
    ctx.beginPath();
    ctx.arc(x,y,5,0,Math.PI*2);
    ctx.fillStyle = ghost ? 'rgba(32,178,170,.7)' : '#8a5a3b';
    ctx.fill();
    ctx.restore();
  }
  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }
  function drawBall(x,y,r){
    ctx.save(); ctx.translate(x,y);
    ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
    ctx.fillStyle='#f3852e'; ctx.fill();
    ctx.lineWidth=3; ctx.strokeStyle='#d26e1f'; ctx.stroke();
    ctx.globalAlpha=.25;
    for(let i=0;i<14;i++){ ctx.beginPath();
      ctx.arc(0,0,r-2-i*0.8, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=.7; ctx.stroke();
    }
    ctx.restore();
  }

function drawBucketSprite(){
  // desenha quando a imagem já existe (mesmo que tenha vindo do cache)
  if (!imgBucket.complete || imgBucket.naturalWidth === 0) return;

  const w = 300 * BUCKET_SCALE;
  const h = 300 * BUCKET_SCALE;

  // ancora no canto inferior direito do canvas visível
  const margin = 20;
  const x = canvas.clientWidth  - w - margin;
  const y = canvas.clientHeight - h - margin;

  ctx.drawImage(imgBucket, x, y, w, h);
}


  // inicia
  setup();
});
