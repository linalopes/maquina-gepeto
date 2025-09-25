/* ========= Planck.js playground =========
   - Toolbox: Rampa (4 unidades definidas em tutorial.js)
   - Colocação com “fantasma” só dentro do canvas (bug corrigido)
   - Seleção/arrasto/rotação Q/E
   - Play/Reset; sensor no balde para vitória
========================================= */

const pl = planck;
const scale = 40; // 1m = 40px

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// UI
const btnPlay = document.getElementById('btnPlay');
const btnReset = document.getElementById('btnReset');
const btnMenu = document.getElementById('btnMenu');
const bannerWin = document.getElementById('bannerWin');
const triesEl = document.querySelector('#tries');
const timeEl  = document.querySelector('#time');

// Toolbox elements (for ramp)
const toolRamp = document.getElementById('toolRamp');
const toolRampCountEl = document.getElementById('toolRampCount');

// Assets
const imgBucket = new Image(); imgBucket.src = 'bucket.png';

// Estado
let world;
let editing = true;
let tries = 0, levelStartTime = 0, timerInterval = null;

// Bodies
let ball;
let ramps = [];       // { body, w, h }
let goalSensor;
let bucketBodies = [];

// Toolbox count
let rampCount = (typeof window.initialRampCount === 'number') ? window.initialRampCount : 0;

// Seleção/drag
let selected = null;
let isDragging = false;
let dragOffset = {x:0, y:0}; // em metros

// Helpers
const toRad = d => d*Math.PI/180;
const px2m = (px) => px / scale;
const m2px = (m)  => m * scale;

// “fantasma” control
let placing = null;           // { body, w, h }
let pendingPlace = false;     // esperando mouse entrar no canvas
let mouseOverCanvas = false;  // hover state

// Balde sprite
const BUCKET_ANCHOR = { x: 760, y: 420 };
const BUCKET_SCALE  = 0.75;

// Setup
function setup(){
  world = new pl.World({ gravity: pl.Vec2(0, 10) });

  // chão
  const floor = world.createBody();
  floor.createFixture(pl.Box(px2m(960/2), px2m(60/2)), {density:0, friction:0.5});
  floor.setPosition(pl.Vec2(px2m(480), px2m(610)));

  // bola
  ball = world.createDynamicBody(pl.Vec2(px2m(120), px2m(160)));
  ball.createFixture(pl.Circle(px2m(20)), { density: 1, friction: 0.05, restitution: 0.2 });
  ball.setLinearDamping(0.01);

  // balde + sensor
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

  // vitória: bola parada dentro do sensor por 1s
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

  // eventos canvas
  canvas.addEventListener('pointerenter', () => { mouseOverCanvas = true; });
  canvas.addEventListener('pointerleave', () => { mouseOverCanvas = false; });

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('keydown', onKeyRotate);

  // Toolbox: clicar na rampa não cria corpo; apenas marca pendente
  if(toolRamp){
    toolRamp.addEventListener('pointerdown', (ev)=>{
      if(rampCount<=0 || !editing) return;
      pendingPlace = true;
      placing = null;
      toolRamp.style.opacity = .45;
      ev.preventDefault();
    });
  }

  // Timer
  levelStartTime = performance.now();
  updateTimer(true);

  // Loop
  requestAnimationFrame(loop);
}

function updateTimer(reset=false){
  if(reset && timerInterval) clearInterval(timerInterval);
  timerInterval=setInterval(()=>{
    const secs=(performance.now()-levelStartTime)/1000;
    if(timeEl) timeEl.textContent = secs.toFixed(1)+'s';
  },100);
}

// ===== Mouse move: cria fantasma somente dentro do canvas =====
function onPointerMove(ev){
  if(!editing) return;

  // cria uma única vez quando o mouse entra no canvas
  if(pendingPlace && mouseOverCanvas && !placing){
    const p = screenToWorld(ev.clientX, ev.clientY);
    const w = 180, h = 16;
    const body = world.createBody(); // estático por padrão
    body.setPosition(pl.Vec2(px2m(p.x), px2m(p.y)));
    body.setAngle(toRad(-20));
    body.createFixture(pl.Box(px2m(w/2), px2m(h/2)), { friction: 0.5 });
    placing = { body, w, h };
  }

  // move o fantasma enquanto estiver sobre o canvas
  if(placing && mouseOverCanvas){
    const p = screenToWorld(ev.clientX, ev.clientY);
    placing.body.setTransform(pl.Vec2(px2m(p.x), px2m(p.y)), placing.body.getAngle());
  }

  // drag de rampas já colocadas
  if(isDragging && selected){
    const p = screenToWorld(ev.clientX, ev.clientY);
    const newPos = pl.Vec2(px2m(p.x) - dragOffset.x, px2m(p.y) - dragOffset.y);
    selected.body.setTransform(newPos, selected.body.getAngle());
  }
}

// ===== Pointer up: confirma/cancela =====
function onPointerUp(ev){
  const r = canvas.getBoundingClientRect();

  // Se estava pendente e ainda não criou o fantasma (soltou fora): cancela
  if(pendingPlace && !placing){
    pendingPlace = false;
    if(toolRamp) toolRamp.style.opacity = 1;
    return;
  }

  // Se existe fantasma
  if (placing){
    const inside = (ev.clientX>=r.left && ev.clientX<=r.right && ev.clientY>=r.top && ev.clientY<=r.bottom);
    if (inside){
      ramps.push(placing);
      selected = placing;
      placing = null;
      pendingPlace = false;
      rampCount--; if(toolRampCountEl) toolRampCountEl.textContent = 'x'+rampCount;
      if (rampCount<=0 && toolRamp){ toolRamp.style.opacity=.5; toolRamp.style.pointerEvents='none'; }
    } else {
      world.destroyBody(placing.body);
      placing=null; pendingPlace=false; if(toolRamp) toolRamp.style.opacity=1;
    }
  }

  // fim do drag
  isDragging=false; canvas.style.cursor='default';
}

// ===== Seleção & drag =====
function onPointerDown(ev){
  if(!editing) return;
  const p = screenToWorld(ev.clientX, ev.clientY);
  const pWorld = pl.Vec2(px2m(p.x), px2m(p.y));

  const hits = [];
  for(let i=0;i<ramps.length;i++){
    const b = ramps[i].body;
    for(let f=b.getFixtureList(); f; f=f.getNext()){
      if(f.testPoint(pWorld)){ hits.push(ramps[i]); break; }
    }
  }
  if(hits.length){
    const picked = hits[hits.length-1];
    selected = picked;
    isDragging = true;
    const pos = picked.body.getPosition();
    dragOffset.x = pWorld.x - pos.x;
    dragOffset.y = pWorld.y - pos.y;
    canvas.style.cursor='grabbing';
  } else {
    selected = null;
  }
}

// ===== Rotação (Q/E) =====
function onKeyRotate(e){
  if(!editing || !selected) return;
  const k = e.key.toLowerCase();
  const a = selected.body.getAngle();
  if(k==='q'){ selected.body.setTransform(selected.body.getPosition(), a + toRad(-5)); }
  else if(k==='e'){ selected.body.setTransform(selected.body.getPosition(), a + toRad(+5)); }
}

// ===== Controles =====
btnPlay.addEventListener('click', ()=>{
  if(editing){
    editing=false; bannerWin.classList.remove('show');
    tries++; if(triesEl) triesEl.textContent=tries;
  }
});
btnReset.addEventListener('click', ()=>{
  editing=true; bannerWin.classList.remove('show');
  ball.setTransform(pl.Vec2(px2m(120), px2m(160)), 0);
  ball.setLinearVelocity(pl.Vec2(0,0));
  ball.setAngularVelocity(0);
  levelStartTime=performance.now(); updateTimer(true);
});
btnMenu.addEventListener('click', ()=>alert('Menu (placeholder)'));

function showWin(){
  editing=true;
  bannerWin.classList.add('show');
}

// ===== Helpers de desenho =====
function screenToWorld(cx, cy){
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / r.width;
  const scaleY = canvas.height / r.height;
  return {
    x: (cx - r.left) * scaleX,
    y: (cy - r.top)  * scaleY
  };
}

function drawGrid(){
  const step=40;
  ctx.save();
  ctx.globalAlpha=.18;
  ctx.beginPath();
  for(let x=0;x<=canvas.width;x+=step){ ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); }
  for(let y=0;y<=canvas.height;y+=step){ ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); }
  ctx.strokeStyle='#a9cfcf'; ctx.lineWidth=1; ctx.stroke();
  ctx.restore();
}
function drawPlank(x,y,w,h,ang,fill,ghost=false,selected=false){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang);
  ctx.fillStyle=fill; ctx.strokeStyle='#8a5a3b'; ctx.lineWidth=2;
  roundRect(ctx,-w/2,-h/2,w,h,6); ctx.fill(); ctx.stroke();
  // hachuras
  ctx.globalAlpha=.25; ctx.beginPath();
  for(let i=-w/2+6;i<w/2-6;i+=10){ ctx.moveTo(i,-h/2+3); ctx.lineTo(i+8,h/2-3); }
  ctx.strokeStyle='#8a5a3b'; ctx.lineWidth=1; ctx.stroke();
  ctx.globalAlpha=1;

  if(ghost){
    ctx.setLineDash([6,6]); ctx.strokeStyle='#20b2aa'; ctx.lineWidth=2;
    ctx.strokeRect(-w/2,-h/2,w,h); ctx.setLineDash([]);
  }
  if(selected){
    ctx.setLineDash([8,5]); ctx.strokeStyle='#f3852e'; ctx.lineWidth=3;
    ctx.strokeRect(-w/2-3,-h/2-3,w+6,h+6); ctx.setLineDash([]);
  }
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

// Loop
function loop(){
  if(!editing){
    world.step(1/60);
  }
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid();

  // rampas
  for(const item of ramps){
    const b = item.body;
    const p = b.getPosition();
    const ang = b.getAngle();
    drawPlank(m2px(p.x), m2px(p.y), item.w, item.h, ang, '#f1d9b8', false, item===selected);
  }

  // fantasma (só desenha se mouse estiver sobre o canvas)
  if(placing && mouseOverCanvas){
    const p = placing.body.getPosition();
    const ang = placing.body.getAngle();
    drawPlank(m2px(p.x), m2px(p.y), placing.w, placing.h, ang, 'rgba(241,217,184,.7)', true, false);
  }

  // bola
  {
    const p = ball.getPosition();
    drawBall(m2px(p.x), m2px(p.y), 20);
  }

  // balde
  drawBucketSprite();

  requestAnimationFrame(loop);
}

// Boot
setup();
