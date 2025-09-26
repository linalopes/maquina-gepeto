/* global planck */
const pl = planck;
const scale = 40; // 1m = 40px

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// UI (mantido)
const btnPlay   = document.getElementById('btnPlay');
const btnReset  = document.getElementById('btnReset');
const bannerWin = document.getElementById('bannerWin');
const triesEl   = document.querySelector('#tries');
const timeEl    = document.querySelector('#time');

// Assets (mantido)
const imgBucket = new Image(); imgBucket.src = 'bucket.png';

// ===== Canvas: retina-safe + sync com CSS =====
let dpr = Math.max(1, window.devicePixelRatio || 1);
function fitCanvas() {
  const r = canvas.getBoundingClientRect();
  dpr = Math.max(1, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(r.width  * dpr));
  const h = Math.max(1, Math.round(r.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  // Ajusta a escala do contexto para o DPR
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

// Estado geral
let world;
let editing = true; // em edição = mundo congelado (sem step), mas tudo renderiza
let tries = 0, levelStartTime = 0, timerInterval = null;

// Coleções
let ball;
let ramps = [];      // { body, w, h }
let seesaws = [];    // { pivot, plank, joint, w, h }
let goalSensor;
let bucketBodies = [];

// Colocação (ghost)
let placing = null;  // { type: 'ramp'|'seesaw', body|pivot/plank, w, h, pointerId? }

// Helpers
const toRad = d => d*Math.PI/180;
const px2m = (px) => px / scale;
const m2px = (m)  => m * scale;

const BUCKET_ANCHOR = { x: 760, y: 420 };
const BUCKET_SCALE  = 0.75;

// ===== Setup =====
function setup(){
  world = new pl.World({ gravity: pl.Vec2(0, 10) });

  // Chão (mantido)
  {
    const floor = world.createBody();
    floor.createFixture(pl.Box(px2m(960/2), px2m(60/2)), {density:0, friction:0.5});
    floor.setPosition(pl.Vec2(px2m(480), px2m(610)));
  }

  // Bola (mantido)
  {
    ball = world.createDynamicBody(pl.Vec2(px2m(120), px2m(160)));
    ball.createFixture(pl.Circle(px2m(20)), { density: 1, friction: 0.05, restitution: 0.2 });
    ball.setLinearDamping(0.01);
  }

  // Balde + sensor (mantido)
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

  // Vitória quando a bola fica parada ~1s dentro do sensor
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

  // Input
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup',   onPointerUp);
  window.addEventListener('keydown', onKeyRotate);

  // Toolbox → iniciar posicionamento
  document.addEventListener('toolbox:start', (e) => {
    if(!editing) return;
    const { type } = e.detail || {};
    if (type === 'ramp')   startPlacingRamp();
    if (type === 'seesaw') startPlacingSeesaw();
  });

  // Timer
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

// ===== Placing: Rampa =====
function startPlacingRamp(){
  if (placing) return; // evita dois ghosts
  const w=180, h=16;
  const body = world.createBody(); // static (ghost)
  body.setPosition(pl.Vec2(px2m(canvas.clientWidth/2), px2m(canvas.clientHeight/2)));
  body.setAngle(toRad(-20));
  body.createFixture(pl.Box(px2m(w/2), px2m(h/2)), { friction: 0.5 });
  placing = { type:'ramp', body, w, h };
}

// ===== Placing: Gangorra =====
function startPlacingSeesaw(){
  if (placing) return;
  const w=200, h=16;

  const x0 = px2m(canvas.clientWidth/2), y0 = px2m(canvas.clientHeight/2);

  // Pivô estático
  const pivot = world.createBody();
  pivot.setPosition(pl.Vec2(x0, y0));

  // Tábua dinâmica (ghost não simula porque estamos em editing=true)
  const plank = world.createDynamicBody(pl.Vec2(x0, y0));
  plank.createFixture(pl.Box(px2m(w/2), px2m(h/2)), { density:1, friction:0.3, restitution:0.2 });

  // Junta revoluta
  const joint = world.createJoint(pl.RevoluteJoint({}, pivot, plank, pl.Vec2(x0, y0)));

  placing = { type:'seesaw', pivot, plank, joint, w, h };
}

// ===== Pointer =====
function onPointerDown(ev){
  // Captura para garantir que os moves/up cheguem ao canvas
  canvas.setPointerCapture?.(ev.pointerId);
  if (placing) placing.pointerId = ev.pointerId;
}

function onPointerMove(ev){
  if(!placing || !editing) return;
  // Só move se é o pointer que iniciou (evita multi-touch bagunçar)
  if (placing.pointerId && ev.pointerId !== placing.pointerId) return;

  const p = screenToWorld(ev.clientX, ev.clientY);
  if (placing.type === 'ramp') {
    placing.body.setTransform(pl.Vec2(px2m(p.x), px2m(p.y)), placing.body.getAngle());
  } else if (placing.type === 'seesaw') {
    const pos = pl.Vec2(px2m(p.x), px2m(p.y));
    placing.pivot.setTransform(pos, 0);
    placing.plank.setTransform(pos, placing.plank.getAngle());
  }
}

function onPointerUp(ev){
  if(!placing) return;
  // Libera a captura
  try { canvas.releasePointerCapture?.(ev.pointerId); } catch (_) {}

  const r = canvas.getBoundingClientRect();
  const inside = ev.clientX>=r.left && ev.clientX<=r.right && ev.clientY>=r.top && ev.clientY<=r.bottom;

  if (inside) {
    // confirma (consome da toolbox)
    if (placing.type === 'ramp') {
      ramps.push({ body: placing.body, w: placing.w, h: placing.h });
      document.dispatchEvent(new CustomEvent('toolbox:consume', { detail:{ type:'ramp' } }));
    } else if (placing.type === 'seesaw') {
      seesaws.push({ pivot: placing.pivot, plank: placing.plank, joint: placing.joint, w: placing.w, h: placing.h });
      document.dispatchEvent(new CustomEvent('toolbox:consume', { detail:{ type:'seesaw' } }));
    }
    placing = null;
  } else {
    // cancela (refunda na toolbox)
    if (placing.type === 'ramp') {
      world.destroyBody(placing.body);
      document.dispatchEvent(new CustomEvent('toolbox:refund', { detail:{ type:'ramp' } }));
    } else if (placing.type === 'seesaw') {
      world.destroyJoint(placing.joint);
      world.destroyBody(placing.plank);
      world.destroyBody(placing.pivot);
      document.dispatchEvent(new CustomEvent('toolbox:refund', { detail:{ type:'seesaw' } }));
    }
    placing = null;
  }
}

// ===== Rotação do ghost da rampa =====
function onKeyRotate(e){
  if(!editing || !placing) return;
  if(placing.type !== 'ramp') return;
  const k = e.key.toLowerCase();
  const a = placing.body.getAngle();
  if(k==='q'){ placing.body.setTransform(placing.body.getPosition(), a + toRad(-5)); }
  else if(k==='e'){ placing.body.setTransform(placing.body.getPosition(), a + toRad(+5)); }
}

// ===== Controles =====
btnPlay?.addEventListener('click', ()=>{
  if(editing){
    editing=false; bannerWin?.classList.remove('show');
    tries++; if(triesEl) triesEl.textContent=tries;
  }
});
btnReset?.addEventListener('click', ()=>{
  editing=true; bannerWin?.classList.remove('show');
  ball.setTransform(pl.Vec2(px2m(120), px2m(160)), 0);
  ball.setLinearVelocity(pl.Vec2(0,0));
  ball.setAngularVelocity(0);
  levelStartTime=performance.now(); updateTimer(true);
});

// ===== Utils =====
function screenToWorld(cx, cy){
  // Converte coordenada de tela para coordenada de canvas *independente de DPR*
  const r = canvas.getBoundingClientRect();
  const xCSS = cx - r.left;
  const yCSS = cy - r.top;
  // Como setamos ctx.setTransform(dpr,0,0,dpr,0,0), trabalhamos em "unidades CSS" no desenho,
  // então aqui devolvemos valores em CSS pixels (não em pixels físicos do canvas).
  return { x: xCSS, y: yCSS };
}

function showWin(){
  editing=true;
  bannerWin?.classList.add('show');
}

// ===== Render =====
function loop(){
  // Mundo só simula quando NÃO está editando
  if(!editing){
    world.step(1/60);
  }

  // Limpa usando unidade CSS (ctx já está escalado pelo DPR)
  ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
  drawGrid();

  // RAMPAS
  for(const item of ramps){
    const b = item.body;
    const p = b.getPosition();
    drawPlank(m2px(p.x), m2px(p.y), item.w, item.h, b.getAngle(), '#f1d9b8', false);
  }

  // GANGORRAS
  for(const s of seesaws){
    const p = s.plank.getPosition();
    drawPlank(m2px(p.x), m2px(p.y), s.w, s.h, s.plank.getAngle(), '#a8d1f1', false);
    drawPivot(m2px(s.pivot.getPosition().x), m2px(s.pivot.getPosition().y));
  }

  // Ghost
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

  // Bola
  {
    const p = ball.getPosition();
    drawBall(m2px(p.x), m2px(p.y), 20);
  }

  // Balde
  drawBucketSprite();

  requestAnimationFrame(loop);
}

// ===== Draw helpers =====
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
function drawPlank(x,y,w,h,ang,fill,ghost=false){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang);
  ctx.fillStyle=fill; ctx.strokeStyle='#8a5a3b'; ctx.lineWidth=2;
  roundRect(ctx,-w/2,-h/2,w,h,6); ctx.fill(); ctx.stroke();
  if(!ghost){
    ctx.globalAlpha=.25; ctx.beginPath();
    for(let i=-w/2+6;i<w/2-6;i+=10){ ctx.moveTo(i,-h/2+3); ctx.lineTo(i+8,h/2-3); }
    ctx.strokeStyle='#8a5a3b'; ctx.lineWidth=1; ctx.stroke();
    ctx.globalAlpha=1;
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
  const w = 300*BUCKET_SCALE, h = 300*BUCKET_SCALE;
  ctx.drawImage(imgBucket, BUCKET_ANCHOR.x, BUCKET_ANCHOR.y, w, h);
}

// Boot
setup();
