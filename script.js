const canvas=document.getElementById("gameCanvas"), ctx=canvas.getContext("2d");
canvas.width=window.innerWidth; canvas.height=window.innerHeight;

let faseSelect=document.getElementById("faseSelect");
let maxFases=100;
let unlockedFase=parseInt(localStorage.getItem("faseDesbloqueada"))||1;
let currentPhase=1;
let playing=false, paused=false;
let asteroids=[], bullets=[];
let ship={x:canvas.width/2, y:canvas.height/2, angle:0, size:20, speed:5};
let faseTime=60*1000; // 1 minuto
let faseStartTime;
let lastTime;
let score=0;
let record=parseInt(localStorage.getItem("recorde"))||0;

document.getElementById("record").textContent="Recorde: "+record;

function populateFaseSelect(){ faseSelect.innerHTML="";// limpa opções
  for(let i=1;i<=maxFases;i++){ let opt=document.createElement("option"); opt.value=i; opt.textContent="Fase "+i; if(i>unlockedFase) opt.disabled=true; if(i===currentPhase) opt.selected=true; faseSelect.appendChild(opt); }
}

function startGame(){// inicia o jogo
  currentPhase = parseInt(faseSelect.value, 10);
  score=0;
  setupPhase(currentPhase);
  document.getElementById("menu").style.display = "none";
  document.getElementById("hud").style.display = "block";
  playing = true;
  paused = false;
  lastTime = performance.now();
  loop();
}
// Reseta o progresso
function resetProgress(){localStorage.setItem("faseDesbloqueada",1); unlockedFase=1; populateFaseSelect(); alert("Progresso resetado!");}
// Volta ao menu
function returnMenu(){playing=false; document.getElementById("menu").style.display="block"; document.getElementById("hud").style.display="none";}
// Pausa o jogo
function togglePause(){ paused=!paused; if(!paused) lastTime=performance.now(); }
// Configura a fase
function setupPhase(phase){
  asteroids=[]; bullets=[];
  spawnAsteroids(phase);
  faseStartTime = performance.now();
}
// Gera asteroids
function spawnAsteroids(phase){
  let count=Math.min(5+phase*2,30+phase*2); // gera mais asteroids por fase
  for(let i=0;i<count;i++){
    let ax, ay;
    do {
      ax = Math.random()*canvas.width;
      ay = Math.random()*canvas.height;
    } while(Math.hypot(ax-ship.x, ay-ship.y) < 150); // evita spawnar perto da nave
    asteroids.push({
      x: ax,
      y: ay,
      radius: 10+Math.random()*20,
      angle: Math.random()*Math.PI*2,
      speed: 1 + 0.2*(phase-1) + Math.random()*0.5
    });
  }
}
// Loop principal
function loop(){
  if(!playing) return; requestAnimationFrame(loop);
  let now=performance.now(); let dt=now-lastTime; lastTime=now;
  if(paused) return;
  // Mantém a nave no centro
  ship.x = canvas.width/2;
  ship.y = canvas.height/2;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawShip(); drawAsteroids(); drawBullets();
  updateBullets(); updateAsteroids(); checkCollisions(); updateHUD();
  checkPhaseCompletion(now);
  if(asteroids.length===0){ spawnAsteroids(currentPhase); }
}
// Desenha a nave
function drawShip(){ ctx.save(); ctx.translate(ship.x,ship.y); ctx.rotate(ship.angle);
  ctx.beginPath(); ctx.moveTo(ship.size,0); ctx.lineTo(-ship.size/2,ship.size/2); ctx.lineTo(-ship.size/2,-ship.size/2); ctx.closePath(); ctx.fillStyle="#0f0"; ctx.fill(); ctx.restore(); }
// Desenha asteroids
function drawAsteroids(){ asteroids.forEach(a=>{ ctx.beginPath(); ctx.arc(a.x,a.y,a.radius,0,Math.PI*2); ctx.strokeStyle="#fff"; ctx.stroke(); }); }
// Desenha balas
function drawBullets(){ bullets.forEach(b=>{ ctx.beginPath(); ctx.arc(b.x,b.y,3,0,Math.PI*2); ctx.fillStyle="rgb(243, 2, 2)"; ctx.fill(); }); }
// Atira ao clicar
canvas.addEventListener("click",e=>{
  let dx=e.clientX-ship.x, dy=e.clientY-ship.y;
  ship.angle=Math.atan2(dy,dx);
  bullets.push({x:ship.x, y:ship.y, angle:ship.angle, speed:10});
});
// Atualiza balas
function updateBullets(){ bullets.forEach((b,i)=>{ b.x+=Math.cos(b.angle)*b.speed; b.y+=Math.sin(b.angle)*b.speed;
  if(b.x<0||b.x>canvas.width||b.y<0||b.y>canvas.height) bullets.splice(i,1); }); }
// Atualiza asteroids
function updateAsteroids(){ asteroids.forEach(a=>{ a.x+=Math.cos(a.angle)*a.speed; a.y+=Math.sin(a.angle)*a.speed;
  if(a.x<0) a.x=canvas.width; if(a.x>canvas.width) a.x=0;
  if(a.y<0) a.y=canvas.height; if(a.y>canvas.height) a.y=0; }); }
// Checa colisões
function checkCollisions(){
  asteroids.forEach((a,ai)=>{
    bullets.forEach((b,bi)=>{ if(Math.hypot(a.x-b.x,a.y-b.y)<a.radius){ asteroids.splice(ai,1); bullets.splice(bi,1); score++; if(score>record){ record=score; localStorage.setItem("recorde",record); document.getElementById("record").textContent="Recorde: "+record; }}});
    if(Math.hypot(a.x-ship.x,a.y-ship.y)<a.radius+ship.size){ alert("Game Over!"); returnMenu(); }
  });
}
// Checa se a fase foi completada
function checkPhaseCompletion(now){
  let elapsed=now-faseStartTime;
  if(elapsed>=faseTime){
    if(currentPhase>=unlockedFase){
      unlockedFase=currentPhase+1;
      localStorage.setItem("faseDesbloqueada",unlockedFase);
      populateFaseSelect(); // atualiza opções do select
    }
    currentPhase++;
    if(currentPhase>maxFases){
      alert("Você completou todas as fases!");
      returnMenu();
    } else setupPhase(currentPhase); 
  }
}
// Atualiza HUD
function updateHUD(){
  document.getElementById("fase").textContent="Fase: "+currentPhase;
  let remaining=Math.max(0,Math.ceil((faseTime-(performance.now()-faseStartTime))/1000));
  document.getElementById("tempo").textContent="Tempo: "+Math.floor(remaining/60)+":"+(remaining%60).toString().padStart(2,'0');
  document.getElementById("score").textContent="Pontuação: "+score;
}
// Ajusta canvas ao redimensionar
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ship.x = canvas.width / 2;
  ship.y = canvas.height / 2;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

populateFaseSelect();

// Analógico virtual
let joystick = document.getElementById("joystick");
let stick = document.getElementById("stick");
let dragging = false;
let joyCenter = { x: 50, y: 50 };

joystick.addEventListener("touchstart", function(e){
  dragging = true;
  e.preventDefault();
});
joystick.addEventListener("touchmove", function(e){
  if(!dragging) return;
  let touch = e.touches[0];
  let rect = joystick.getBoundingClientRect();
  let x = touch.clientX - rect.left;
  let y = touch.clientY - rect.top;
  // Limita o stick dentro do círculo
  let dx = x - joyCenter.x;
  let dy = y - joyCenter.y;
  let dist = Math.min(Math.hypot(dx,dy), 40);
  let angle = Math.atan2(dy,dx);
  let sx = joyCenter.x + Math.cos(angle)*dist;
  let sy = joyCenter.y + Math.sin(angle)*dist;
  stick.style.left = (sx-15)+"px";
  stick.style.top = (sy-15)+"px";
  // Apenas gira a nave, não move!
  ship.angle = angle;
  e.preventDefault();
});
joystick.addEventListener("touchend", function(e){
  dragging = false;
  stick.style.left = "35px";
  stick.style.top = "35px";
  e.preventDefault();
});

// Botão de disparo
document.getElementById("fireBtn").addEventListener("touchstart", function(e){
  bullets.push({x:ship.x, y:ship.y, angle:ship.angle, speed:10});
  e.preventDefault();
});