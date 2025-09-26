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

  // BUCKET (mantém código, mas sprite comentado no render)
  const imgBucket = new Image();
  let bucketReady = false;
  imgBucket.onload = () => { bucketReady = true; };
  imgBucket.src = './assets/png/bucket.png';

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

  // ===== Estado geral =====
  let world;
  let editing = true;
  let tries = 0, levelStartTime = 0, timerInterval = null;

  // Coleções
  let ball;
  let ramps   = [];  // { body, w, h }
  let boosts  = [];  // { body, w, h, fixture }
  let seesaws = [];  // { pivot, plank, joint, w, h }
  let goalSensor;
  let bucketBodies = [];

  // Contatos com boost ativos
  const activeBoosts = new Set();

  // Colocação e seleção
  let placing   = null; // { type, ... }
  let selecting = null; // { kind, item, pointerId, grabDX, grabDY }

  // Snapshot de gangorras (para restaurar no Reset)
  let seesawSnapshot = null;

  const BUCKET_ANCHOR = { x: 760, y: 420 };
  const BUCKET_SCALE  = 0.75;

  const toRad = d => d*Math.PI/180;
  const px2m  = px => px / scale;
  const m2px  = m  => m * scale;

  // ===== Setup =====
  function setup(){
    if (!window.planck) { console.error('[playground] planck.min.js não carregado'); return; }

    world = new pl.World({ gravity: pl.Vec2(0, 10) });

    // chão
    {
      const floor = world.createBody();
      floor.createFixture(pl.Box(px2m(960/2), px2m(60/2)), {density:0, friction:0.5});
      floor.setPosition(pl.Vec2(px2m(480), px2m(610)));
    }

    // bola (posição inicial alterada)
    {
      ball = world.createDynamicBody(pl.Vec2(px2m(25), px2m(25)));
      ball.createFixture(pl.Circle(px2m(20)), { density: 1, friction: 0.05, restitution: 0.2 });
      ball.setLinearDamping(0.01);
    }

    // balde + sensor (mantidos, mas sprite desativado no render)
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

    // vitória e contatos
    let insideFlag=false, insideTime=0;
    world.on('begin-contact', c => {
      const a=c.getFixtureA(), b=c.getFixtureB();
      if((a===goalSensor._sensorFixture && b.getBody()===ball) ||
         (b===goalSensor._sensorFixture && a.getBody()===ball)){
        insideFlag = true; insideTime = performance.now();
      }
      handleBoostContactChange(c, true);
    });
    world.on('end-contact', c => {
      const a=c.getFixtureA(), b=c.getFixtureB();
      if((a===goalSensor._sensorFixture && b.getBody()===ball) ||
         (b===goalSensor._sensorFixture && a.getBody()===ball)){
        insideFlag = false;
      }
      handleBoostContactChange(c, false);
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

    // eventos
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup',   onPointerUp);
    window.addEventListener('keydown', onKeyRotateQE);

    document.addEventListener('toolbox:start', (e) => {
      if(!editing) return;
      const { type, clientX, clientY } = e.detail || {};
      if (type === 'ramp')   startPlacingRamp({ clientX, clientY });
      if (type === 'seesaw') startPlacingSeesaw({ clientX, clientY });
      if (type === 'boost')  startPlacingBoost({ clientX, clientY });
      selecting = null;
    });

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

  // ===== Criação de Ghosts =====
  function cursorOrOff(init){
    if (Number.isFinite(init.clientX) && Number.isFinite(init.clientY)) {
      return screenToCanvas(init.clientX, init.clientY);
    }
    return { x:-9999, y:-9999 };
  }

  function startPlacingRamp(init = {}){
    if (placing) return;
    const w=180, h=16;
    const body = world.createBody();
    let {x:cx, y:cy} = cursorOrOff(init);
    body.setPosition(pl.Vec2(px2m(cx), px2m(cy)));
    body.setAngle(toRad(-20));
    body.createFixture(pl.Box(px2m(w/2), px2m(h/2)), { friction: 0.5 });
    placing = { type:'ramp', body, w, h };
  }

  function startPlacingBoost(init = {}){
    if (placing) return;
    const w=180, h=24; // boost mais "gordo"
    const body = world.createBody();
    let {x:cx, y:cy} = cursorOrOff(init);
    body.setPosition(pl.Vec2(px2m(cx), px2m(cy)));
    body.setAngle(toRad(-20));
    const fx = body.createFixture(pl.Box(px2m(w/2), px2m(h/2)), { friction: 0.2 });
    fx.setUserData({ kind:'boost' });
    placing = { type:'boost', body, w, h, fixture: fx };
  }

  function startPlacingSeesaw(init = {}){
    if (placing) return;
    const w=200, h=16;
    let {x:cx, y:cy} = cursorOrOff(init);
    const x0 = px2m(cx), y0 = px2m(cy);
    const pivot = world.createBody(); pivot.setPosition(pl.Vec2(x0, y0));
    const plank = world.createDynamicBody(pl.Vec2(x0, y0));
    plank.createFixture(pl.Box(px2m(w/2), px2m(h/2)), { density:1, friction:0.3, restitution:0.2 });
    const joint = world.createJoint(pl.RevoluteJoint({}, pivot, plank, pl.Vec2(x0, y0)));
    placing = { type:'seesaw', pivot, plank, joint, w, h };
  }

  // ===== Hit Test =====
  function pointInRotatedRect(px, py, cx, cy, w, h, ang){
    const dx = px - cx, dy = py - cy;
    const cos = Math.cos(-ang), sin = Math.sin(-ang);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    return Math.abs(lx) <= w/2 && Math.abs(ly) <= h/2;
  }

  function hitTestAt(cssX, cssY){
    for (let i = seesaws.length - 1; i >= 0; i--){
      const s = seesaws[i];
      const p = s.plank.getPosition();
      if (pointInRotatedRect(cssX, cssY, m2px(p.x), m2px(p.y), s.w, s.h, s.plank.getAngle())) {
        return { kind:'seesaw', item: s };
      }
    }
    for (let i = boosts.length - 1; i >= 0; i--){
      const r = boosts[i];
      const p = r.body.getPosition();
      if (pointInRotatedRect(cssX, cssY, m2px(p.x), m2px(p.y), r.w, r.h, r.body.getAngle())) {
        return { kind:'boost', item: r };
      }
    }
    for (let i = ramps.length - 1; i >= 0; i--){
      const r = ramps[i];
      const p = r.body.getPosition();
      if (pointInRotatedRect(cssX, cssY, m2px(p.x), m2px(p.y), r.w, r.h, r.body.getAngle())) {
        return { kind:'ramp', item: r };
      }
    }
    return null;
  }

  // ===== Pointer =====
  function onPointerDown(ev){
    canvas.setPointerCapture?.(ev.pointerId);

    if (placing) { placing.pointerId = ev.pointerId; selecting = null; return; }
    if (!editing) return;

    const pt = screenToCanvas(ev.clientX, ev.clientY);
    const hit = hitTestAt(pt.x, pt.y);
    if (hit) {
      let b, pos;
      if (hit.kind === 'ramp' || hit.kind === 'boost')   b = hit.item.body;
      if (hit.kind === 'seesaw')                         b = hit.item.plank;
      pos = b.getPosition();
      selecting = {
        kind: hit.kind,
        item: hit.item,
        pointerId: ev.pointerId,
        grabDX: pt.x - m2px(pos.x),
        grabDY: pt.y - m2px(pos.y),
      };
    } else {
      selecting = null;
    }
  }

  function onPointerMove(ev){
    if(placing && editing){
      if (placing.pointerId && ev.pointerId !== placing.pointerId) return;
      const p = screenToCanvas(ev.clientX, ev.clientY);
      if (placing.type === 'ramp' || placing.type === 'boost') {
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
      if (selecting.kind === 'ramp' || selecting.kind === 'boost') {
        selecting.item.body.setTransform(pl.Vec2(px2m(nx), px2m(ny)), selecting.item.body.getAngle());
      } else if (selecting.kind === 'seesaw') {
        const s = selecting.item;
        s.pivot.setTransform(pl.Vec2(px2m(nx), px2m(ny)), 0);
        s.plank.setTransform(pl.Vec2(px2m(nx), px2m(ny)), s.plank.getAngle());
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
        } else if (placing.type === 'boost') {
          boosts.push({ body: placing.body, w: placing.w, h: placing.h, fixture: placing.fixture });
          document.dispatchEvent(new CustomEvent('toolbox:consume', { detail:{ type:'boost' } }));
        } else if (placing.type === 'seesaw') {
          seesaws.push({ pivot: placing.pivot, plank: placing.plank, joint: placing.joint, w: placing.w, h: placing.h });
          document.dispatchEvent(new CustomEvent('toolbox:consume', { detail:{ type:'seesaw' } }));
        }
      } else {
        if (placing.type === 'ramp' || placing.type === 'boost') {
          world.destroyBody(placing.body);
          document.dispatchEvent(new CustomEvent('toolbox:refund', { detail:{ type: placing.type } }));
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

  // ===== Rotação =====
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
    if (placing && (placing.type === 'ramp' || placing.type === 'boost')) {
      const a = placing.body.getAngle();
      placing.body.setTransform(placing.body.getPosition(), a + toRad(delta));
    }
  }

  function rotateSelected(deltaDeg){
    if (!selecting) return;
    const delta = toRad(deltaDeg);
    if (selecting.kind === 'ramp' || selecting.kind === 'boost') {
      const b = selecting.item.body;
      b.setTransform(b.getPosition(), b.getAngle() + delta);
    } else if (selecting.kind === 'seesaw') {
      const s = selecting.item;
      s.plank.setTransform(s.plank.getPosition(), s.plank.getAngle() + delta);
    }
  }

  // ===== Snapshot de gangorras =====
  function snapshotSeesaws() {
    // guarda pose de cada gangorra em METROS e RADIANOS
    seesawSnapshot = seesaws.map(s => {
      const pp = s.pivot.getPosition();
      const bp = s.plank.getPosition();
      const ang = s.plank.getAngle();
      return {
        pivot: { x: pp.x, y: pp.y },
        plank: { x: bp.x, y: bp.y, angle: ang }
      };
    });
  }

  function restoreSeesaws() {
    if (!seesawSnapshot) return;
    const n = Math.min(seesaws.length, seesawSnapshot.length);
    for (let i = 0; i < n; i++) {
      const s    = seesaws[i];
      const snap = seesawSnapshot[i];
      s.pivot.setTransform(pl.Vec2(snap.pivot.x, snap.pivot.y), 0);
      s.plank.setTransform(pl.Vec2(snap.plank.x, snap.plank.y), snap.plank.angle);
      s.plank.setLinearVelocity(pl.Vec2(0, 0));
      s.plank.setAngularVelocity(0);
    }
  }

  // ===== Boost =====
  function handleBoostContactChange(contact, isBegin){
    const fa = contact.getFixtureA();
    const fb = contact.getFixtureB();
    const ba = fa.getBody(), bb = fb.getBody();
    let boostFixture = null;
    if (ba === ball && fb.getUserData()?.kind === 'boost') boostFixture = fb;
    else if (bb === ball && fa.getUserData()?.kind === 'boost') boostFixture = fa;
    if (!boostFixture) return;
    const item = boosts.find(it => it.body === boostFixture.getBody());
    if (!item) return;
    if (isBegin) activeBoosts.add(item); else activeBoosts.delete(item);
  }

  function applyBoostForces(){
    if (editing || activeBoosts.size === 0) return;
    const mass = ball.getMass();
    const F = 15 * mass;
    for (const it of activeBoosts) {
      const ang = it.body.getAngle();
      const dir = pl.Vec2(Math.cos(ang), Math.sin(ang));
      ball.applyForceToCenter(pl.Vec2(dir.x * F, dir.y * F));
    }
  }

  // ===== Controles (robustos) =====
  function handlePlay() {
    console.log('[playground] Play clicado');
    if (!editing) return;

    // salva pose atual das gangorras ajustadas na edição
    snapshotSeesaws();

    editing = false;
    bannerWin?.classList.remove('show');
    selecting = null;
    tries++;
    if (triesEl) triesEl.textContent = tries;
  }

  function handleReset() {
    console.log('[playground] Reset clicado');
    editing = true;
    bannerWin?.classList.remove('show');
    selecting = null;

    // restaura pose das gangorras salva antes do Play
    restoreSeesaws();

    // bola volta à posição inicial
    if (ball) {
      ball.setTransform(pl.Vec2(px2m(25), px2m(25)), 0);
      ball.setLinearVelocity(pl.Vec2(0, 0));
      ball.setAngularVelocity(0);
    }

    activeBoosts.clear?.();
    levelStartTime = performance.now();
    updateTimer(true);
  }

  // liga por ID (se existir)
  btnPlay?.addEventListener('click', handlePlay);
  btnReset?.addEventListener('click', handleReset);

  // delegação global (fallback)
  document.addEventListener('click', (e) => {
    const playBtn  = e.target.closest('#btnPlay,[data-action="play"]');
    const resetBtn = e.target.closest('#btnReset,[data-action="reset"]');
    if (playBtn)  { e.preventDefault(); handlePlay(); }
    if (resetBtn) { e.preventDefault(); handleReset(); }
  });

  // atalho teclado: Espaço alterna Play/Reset
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      if (editing) handlePlay(); else handleReset();
    }
  });

  // ===== Render/loop =====
  function loop(){
    if(!editing){
      world.step(1/60);
      applyBoostForces();
    }
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
    drawGrid();

    // rampas
    for(const item of ramps){
      const b = item.body, p = b.getPosition();
      drawPlank(m2px(p.x), m2px(p.y), item.w, item.h, b.getAngle(), '#f1d9b8', false,
        selecting && selecting.kind==='ramp' && selecting.item===item);
    }

    // boosts (cinza + seta laranja)
    for (const item of boosts) {
      const b = item.body, p = b.getPosition();
      const x = m2px(p.x), y = m2px(p.y), ang = b.getAngle();
      const selected = selecting && selecting.kind==='boost' && selecting.item===item;
      drawPlank(x, y, item.w, item.h, ang, '#b6b8bf', false, selected);
      drawBoostArrow(x, y, item.w, item.h, ang);
    }

    // gangorras
    for(const s of seesaws){
      const p = s.plank.getPosition();
      drawPlank(m2px(p.x), m2px(p.y), s.w, s.h, s.plank.getAngle(), '#a8d1f1', false,
        selecting && selecting.kind==='seesaw' && selecting.item===s);
      drawPivot(m2px(s.pivot.getPosition().x), m2px(s.pivot.getPosition().y));
    }

    // ghost
    if(placing){
      if(placing.type === 'ramp' || placing.type === 'boost'){
        const p = placing.body.getPosition();
        const x = m2px(p.x), y = m2px(p.y), ang = placing.body.getAngle();
        if (placing.type === 'boost') {
          drawPlank(x, y, placing.w, placing.h, ang, 'rgba(182,184,191,.7)', true);
          drawBoostArrow(x, y, placing.w, placing.h, ang, true);
        } else {
          drawPlank(x, y, placing.w, placing.h, ang, 'rgba(241,217,184,.7)', true);
        }
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

    // bucket sprite (desativado)
    // if (imgBucket.complete && imgBucket.naturalWidth > 0) {
    //   const w = 300 * BUCKET_SCALE, h = 300 * BUCKET_SCALE;
    //   const margin = 20;
    //   const x = canvas.clientWidth  - w - margin;
    //   const y = canvas.clientHeight - h - margin;
    //   ctx.drawImage(imgBucket, x, y, w, h);
    // }

    requestAnimationFrame(loop);
  }

  // ===== Helpers de desenho =====
  function drawGrid(){
    const step=40;
    ctx.save();
    ctx.globalAlpha=.18;
    ctx.beginPath();
    for(let x=0;x<=canvas.clientWidth;x+=step){ ctx.moveTo(x,0); ctx.lineTo(x,canvas.clientHeight); }
    for(let y=0;y<=canvas.clientHeight;y+=step){ ctx.moveTo(0,y); ctx.lineTo(x=canvas.clientWidth,y); }
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

  function drawBoostArrow(cx, cy, w, h, ang, ghost=false){
    const arrowLen = Math.max(36, Math.min(64, w * 0.35));
    const shaft = 4;
    const head  = 10;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);

    // Laranja (normal) / translúcido (ghost)
    ctx.lineWidth = shaft;
    ctx.lineCap = 'round';
    ctx.strokeStyle = ghost ? 'rgba(242,140,40,.6)' : '#f28c28';
    ctx.fillStyle   = ghost ? 'rgba(242,140,40,.6)' : '#f28c28';

    // haste
    ctx.beginPath();
    ctx.moveTo(-arrowLen/2 + 6, 0);
    ctx.lineTo(+arrowLen/2 - head, 0);
    ctx.stroke();

    // cabeça
    ctx.beginPath();
    ctx.moveTo(+arrowLen/2 - head, -8);
    ctx.lineTo(+arrowLen/2, 0);
    ctx.lineTo(+arrowLen/2 - head, +8);
    ctx.closePath();
    ctx.fill();

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

  function screenToCanvas(cx, cy){
    const r = canvas.getBoundingClientRect();
    return { x: cx - r.left, y: cy - r.top };
  }

  function showWin(){ editing=true; bannerWin?.classList.add('show'); }

  // Boot
  setup();
});
