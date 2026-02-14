// =========================
// CONFIGURAÇÕES
// =========================
const WHATSAPP_NUMBER = "5565996834279";
const WHATSAPP_MSG_BASE =
  "Olá! Eu girei a Roleta de Carnaval da Evolua+ Profissões e quero resgatar meu prêmio. ";

// Prêmios (com pesos para controlar chances)
const PRIZES = [
  { label: "Bolsa 100% - Excel Básico ao Avançado", short: "Bolsa 100% Excel", weight: 1 },
  { label: "Bolsa 50% - Informática", short: "Bolsa 50% Informática", weight: 2 },
  { label: "R$150 de desconto", short: "Desconto R$150", weight: 3 },
  { label: "R$350 de desconto", short: "Desconto R$350", weight: 2 },
  { label: "Curso gratuito de IA", short: "IA Gratuito", weight: 1 },
  { label: "Bolsa 50% - Jovem Aprendiz Administrativo", short: "Bolsa 50% Jovem Aprendiz", weight: 2 },
  { label: "35% de desconto em qualquer curso", short: "35% OFF qualquer curso", weight: 3 },
];

// =========================
// UTIL
// =========================
function $(id){ return document.getElementById(id); }

function weightedPick(items){
  const total = items.reduce((s, it) => s + (it.weight ?? 1), 0);
  let r = Math.random() * total;
  for(const it of items){
    r -= (it.weight ?? 1);
    if(r <= 0) return it;
  }
  return items[items.length - 1];
}

function pad4(n){ return String(n).padStart(4,"0"); }

function makeCode(){
  const n = Math.floor(Math.random()*10000);
  return `EVO-CARNAVAL-${pad4(n)}`;
}

function waLink({code, prizeLabel}){
  const msg =
    `${WHATSAPP_MSG_BASE}\n` +
    `🎁 Prêmio: ${prizeLabel}\n` +
    `🔐 Código: ${code}\n\n` +
    `Quero validar e já garantir minha matrícula/benefício.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function openWhatsAppInstant({code, prizeLabel}){
  // abre o WhatsApp automaticamente após o resultado
  window.open(waLink({code, prizeLabel}), "_blank", "noopener");
}

// =========================
// UI ELEMENTS
// =========================
const canvas = $("wheel");
const ctx = canvas.getContext("2d");
const confettiCanvas = $("confetti");
const cctx = confettiCanvas.getContext("2d");

const spinBtn = $("spinBtn");
const resetBtn = $("resetBtn");
const statusBadge = $("statusBadge");
const prizeList = $("prizeList");

const modalBackdrop = $("modalBackdrop");
const closeModal = $("closeModal");
const resultText = $("resultText");
const resultCode = $("resultCode");
const redeemBtn = $("redeemBtn");
const copyCodeBtn = $("copyCodeBtn");
const spinAgainBtn = $("spinAgainBtn");

const btnWhatsTop = $("btnWhatsTop");
const btnWhatsBottom = $("btnWhatsBottom");

// =========================
// PREENCHE LISTA DE PRÊMIOS
// =========================
PRIZES.forEach(p => {
  const li = document.createElement("li");
  li.textContent = p.label;
  prizeList.appendChild(li);
});

// Botões gerais de WhatsApp (antes do giro)
btnWhatsTop.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Quero saber mais sobre a Roleta de Carnaval da Evolua+ Profissões.")}`;
btnWhatsBottom.href = btnWhatsTop.href;

// =========================
// LUZINHAS
// =========================
const lightsEl = $("lights");
const LIGHTS_COUNT = 42;
for(let i=0;i<LIGHTS_COUNT;i++){
  const b = document.createElement("span");
  b.className = "bulb";
  lightsEl.appendChild(b);
}
function layoutLights(){
  const bulbs = [...lightsEl.querySelectorAll(".bulb")];
  const rect = lightsEl.getBoundingClientRect();
  const r = Math.min(rect.width, rect.height)/2;
  const cx = rect.width/2;
  const cy = rect.height/2;
  bulbs.forEach((b,i)=>{
    const ang = (i / bulbs.length) * Math.PI*2;
    const rr = r - 10;
    const x = cx + Math.cos(ang) * rr;
    const y = cy + Math.sin(ang) * rr;
    b.style.left = `${x}px`;
    b.style.top  = `${y}px`;
  });
}
window.addEventListener("resize", layoutLights);

let lightsTick = 0;
function animateLights(isSpinning){
  const bulbs = [...lightsEl.querySelectorAll(".bulb")];
  lightsTick++;
  bulbs.forEach((b,i)=>{
    const on = ((i + lightsTick) % 6) < 3;
    const fast = isSpinning ? 1 : 0;
    b.style.opacity = on ? (fast ? "1" : ".85") : (fast ? ".25" : ".35");
    b.style.transform = `translate(-50%,-50%) scale(${on ? 1 : 0.85})`;
  });
}
function styleLights(){
  const css = document.createElement("style");
  css.textContent = `
    .bulb{
      position:absolute;
      width:14px;height:14px;
      border-radius:999px;
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.95), rgba(255,255,255,.25));
      box-shadow:
        0 0 14px rgba(108,240,255,.35),
        0 0 22px rgba(168,85,247,.22);
      transform: translate(-50%,-50%);
      transition: opacity .12s linear, transform .12s linear;
    }
  `;
  document.head.appendChild(css);
}
styleLights();

// =========================
// ROLETA (CANVAS)
// =========================
const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
function resizeCanvas(){
  const size = 760;
  canvas.width = size * DPR;
  canvas.height = size * DPR;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.setTransform(DPR,0,0,DPR,0,0);
  drawWheel(currentAngle);
  layoutLights();
}
window.addEventListener("resize", resizeCanvas);

const segments = PRIZES.map(p => p.short);
const segCount = segments.length;

function drawWheel(angle){
  const w = 760, h = 760;
  const cx = w/2, cy = h/2;
  const radius = w*0.46;

  ctx.clearRect(0,0,w,h);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const step = (Math.PI*2) / segCount;
  for(let i=0;i<segCount;i++){
    const start = i*step;
    const end = start + step;

    const baseColors = [
      "rgba(108,240,255,.85)",
      "rgba(168,85,247,.85)",
      "rgba(48,231,169,.85)",
      "rgba(255,92,122,.85)",
      "rgba(255,209,102,.85)",
    ];
    const c = baseColors[i % baseColors.length];

    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,radius,start,end);
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,.16)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + step/2);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(6,16,42,.95)";
    ctx.font = "900 18px ui-sans-serif, system-ui";
    ctx.shadowColor = "rgba(255,255,255,.28)";
    ctx.shadowBlur = 6;
    ctx.fillText(segments[i], radius - 18, 6);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0,0,radius*0.10,0,Math.PI*2);
  ctx.fillStyle = "rgba(255,255,255,.12)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0,0,radius,0,Math.PI*2);
  ctx.strokeStyle = "rgba(255,255,255,.20)";
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.restore();
}

// =========================
// SPIN REALISTA
// =========================
let spinning = false;
let currentAngle = 0;
let targetAngle = 0;
let spinStart = 0;
let spinDuration = 0;

function easeOutCubic(t){
  return 1 - Math.pow(1 - t, 3);
}

function angleToIndex(angle){
  const step = (Math.PI*2)/segCount;
  const a = (Math.PI*2 - (angle % (Math.PI*2))) % (Math.PI*2);
  const idx = Math.floor(a / step) % segCount;
  return idx;
}

function computeTargetAngleForIndex(index){
  const step = (Math.PI*2)/segCount;
  const center = index*step + step/2;
  const desired = (Math.PI*2 - center);
  return desired;
}

function setStatus(text, kind="ok"){
  statusBadge.textContent = text;
  const map = {
    ok: "rgba(48,231,169,.10)",
    warn: "rgba(255,209,102,.10)",
    danger: "rgba(255,92,122,.10)"
  };
  statusBadge.style.background = map[kind] || map.ok;
}

function openModal(prizeLabel, code){
  resultText.textContent = `🎁 Prêmio: ${prizeLabel}`;
  resultCode.textContent = code;

  const link = waLink({code, prizeLabel});
  redeemBtn.href = link;
  btnWhatsBottom.href = link;

  modalBackdrop.classList.add("show");
  modalBackdrop.setAttribute("aria-hidden","false");
}

function closeModalFn(){
  modalBackdrop.classList.remove("show");
  modalBackdrop.setAttribute("aria-hidden","true");
}

// =========================
// CONFETTI
// =========================
let confettiPieces = [];
function resizeConfetti(){
  confettiCanvas.width = Math.floor(window.innerWidth * DPR);
  confettiCanvas.height = Math.floor(window.innerHeight * DPR);
  confettiCanvas.style.width = "100%";
  confettiCanvas.style.height = "100%";
  cctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener("resize", resizeConfetti);

function launchConfetti(){
  confettiCanvas.classList.add("show");
  resizeConfetti();
  const W = window.innerWidth;
  const H = window.innerHeight;

  confettiPieces = Array.from({length: 160}, () => ({
    x: Math.random()*W,
    y: -20 - Math.random()*H*0.2,
    vx: (Math.random()-0.5)*2.2,
    vy: 2.2 + Math.random()*3.6,
    r: 2 + Math.random()*4,
    rot: Math.random()*Math.PI*2,
    vr: (Math.random()-0.5)*0.2,
    life: 0,
    maxLife: 220 + Math.random()*120
  }));

  let frame = 0;
  function tick(){
    frame++;
    cctx.clearRect(0,0,W,H);

    for(const p of confettiPieces){
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      const palette = [
        "rgba(108,240,255,.95)",
        "rgba(168,85,247,.95)",
        "rgba(48,231,169,.95)",
        "rgba(255,92,122,.95)",
        "rgba(255,209,102,.95)",
      ];
      const col = palette[Math.floor((p.x + p.y) % palette.length)];

      cctx.save();
      cctx.translate(p.x, p.y);
      cctx.rotate(p.rot);
      cctx.fillStyle = col;
      cctx.fillRect(-p.r, -p.r, p.r*2.2, p.r*1.2);
      cctx.restore();
    }

    confettiPieces = confettiPieces.filter(p => p.life < p.maxLife && p.y < H + 40);

    if(confettiPieces.length > 0 && frame < 520){
      requestAnimationFrame(tick);
    } else {
      confettiCanvas.classList.remove("show");
      cctx.clearRect(0,0,W,H);
    }
  }
  requestAnimationFrame(tick);
}

// =========================
// LIMITAR GIRO (1 POR SESSÃO)
// =========================
const STORAGE_KEY = "evolua_roleta_carnaval_used";
function alreadyUsed(){
  return sessionStorage.getItem(STORAGE_KEY) === "1";
}
function markUsed(){
  sessionStorage.setItem(STORAGE_KEY, "1");
}

// =========================
// LOOP LUZES
// =========================
function lightsLoop(){
  animateLights(spinning);
  requestAnimationFrame(lightsLoop);
}
requestAnimationFrame(lightsLoop);

// =========================
// AÇÃO: GIRAR
// =========================
function spin(){
  if(spinning) return;

  if(alreadyUsed()){
    setStatus("Você já girou nesta sessão. Clique em Reiniciar (testes) ou recarregue.", "warn");
    return;
  }

  spinning = true;
  setStatus("Girando... boa sorte! 🎉", "warn");
  spinBtn.disabled = true;

  const selected = weightedPick(PRIZES);
  const selectedIndex = PRIZES.indexOf(selected);

  const baseTurns = 5 + Math.random()*2; // 5..7 voltas
  const desired = computeTargetAngleForIndex(selectedIndex);

  const twoPi = Math.PI*2;
  const currentMod = ((currentAngle % twoPi) + twoPi) % twoPi;
  let delta = desired - currentMod;
  if(delta < 0) delta += twoPi;

  targetAngle = currentAngle + baseTurns*twoPi + delta;

  spinStart = performance.now();
  spinDuration = 4200 + Math.random()*900;

  function frame(now){
    const t = Math.min(1, (now - spinStart)/spinDuration);
    const eased = easeOutCubic(t);

    currentAngle = currentAngle + (targetAngle - currentAngle) * (0.08 + 0.92*(eased - (eased*0.08)));
    drawWheel(currentAngle);

    if(t < 1){
      requestAnimationFrame(frame);
    } else {
      spinning = false;
      spinBtn.disabled = false;

      currentAngle = targetAngle;
      drawWheel(currentAngle);

      const idx = angleToIndex(currentAngle);
      const prize = PRIZES[idx];
      const code = makeCode();

      markUsed();
      setStatus("Parou! Abrindo WhatsApp para resgate ✅", "ok");
      launchConfetti();

      // Mostra o modal e já abre o WhatsApp automaticamente
      openModal(prize.label, code);
      openWhatsAppInstant({ code, prizeLabel: prize.label });
    }
  }

  requestAnimationFrame(frame);
}

// =========================
// EVENTOS
// =========================
spinBtn.addEventListener("click", spin);

resetBtn.addEventListener("click", () => {
  sessionStorage.removeItem(STORAGE_KEY);
  currentAngle = 0;
  drawWheel(currentAngle);
  setStatus("Reiniciado. Pronto pra girar.", "ok");
});

closeModal.addEventListener("click", closeModalFn);
modalBackdrop.addEventListener("click", (e) => {
  if(e.target === modalBackdrop) closeModalFn();
});

copyCodeBtn.addEventListener("click", async () => {
  try{
    await navigator.clipboard.writeText(resultCode.textContent);
    copyCodeBtn.textContent = "Copiado ✅";
    setTimeout(()=> copyCodeBtn.textContent = "Copiar código", 1300);
  } catch {
    copyCodeBtn.textContent = "Copie manualmente";
    setTimeout(()=> copyCodeBtn.textContent = "Copiar código", 1300);
  }
});

spinAgainBtn.addEventListener("click", () => {
  closeModalFn();
  setStatus("Envie o código no WhatsApp para resgatar 😉", "ok");
});

// =========================
// INIT
// =========================
resizeConfetti();
resizeCanvas();
drawWheel(currentAngle);
layoutLights();
