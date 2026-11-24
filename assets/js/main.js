/* =========================================================
   Chef Nana Barreto · Buffet & Consultoria Gastronômica
   - hero: sequência de quadros que avança com o scroll (canvas)
   - animações de entrada, carrossel, marquee, linha do tempo
   - formulário qualificador que termina no WhatsApp
   ========================================================= */

// >>> TROCAR pelo WhatsApp da chef (DDI + DDD + número, só dígitos)
const NANA_WHATSAPP = "5561000000000";
// Endereço opcional para receber o lead (CRM, planilha, e-mail). Vazio = não envia.
const NANA_LEAD_ENDPOINT = "";

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const root = document.documentElement;
root.classList.add("js");

const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = matchMedia("(hover: none)").matches;
const track = (name, data = {}) => {
  try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: name, ...data }); } catch (_) {}
};

/* ---------- Smooth scroll (Lenis) ---------- */
let lenis = null;
if (hasGsap) gsap.registerPlugin(ScrollTrigger);
if (window.Lenis && !reduce) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95 });
  if (hasGsap) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}
const scrollToEl = (el) => {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: el.id === "filosofia" ? 0 : -60, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
};
$$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
  const id = a.getAttribute("href");
  if (id.length < 2) { e.preventDefault(); lenis ? lenis.scrollTo(0) : scrollTo({ top: 0, behavior: "smooth" }); return; }
  const el = $(id);
  if (!el) return;
  e.preventDefault();
  if (root.classList.contains("menu-open")) closeMenu();
  scrollToEl(el);
}));

function lockScroll(on) {
  root.classList.toggle("is-locked", on);
  if (lenis) on ? lenis.stop() : lenis.start();
}

/* ---------- Header ---------- */
const hdr = $(".hdr"), hero = $(".hero"), fab = $(".fab");
let lastY = 0;
function onScroll() {
  const y = scrollY;
  const pastHero = y > hero.offsetHeight - innerHeight * 0.9;
  hdr.classList.toggle("is-solid", pastHero);
  hdr.classList.toggle("is-hidden", pastHero && y > lastY + 4 && !root.classList.contains("menu-open"));
  if (y < lastY - 4) hdr.classList.remove("is-hidden");
  fab.classList.toggle("is-on", y > hero.offsetHeight - innerHeight * 0.5);
  lastY = y;
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// link ativo no menu
const navLinks = $$(".nav a");
const io = new IntersectionObserver((ents) => ents.forEach((en) => {
  if (!en.isIntersecting) return;
  navLinks.forEach((a) => a.classList.toggle("is-on", a.getAttribute("href") === "#" + en.target.id));
}), { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach((s) => io.observe(s));

/* ---------- Menu mobile ---------- */
const burger = $(".burger"), mnav = $(".mnav");
function openMenu() { root.classList.add("menu-open"); burger.setAttribute("aria-expanded", "true"); mnav.setAttribute("aria-hidden", "false"); lockScroll(true); }
function closeMenu() { root.classList.remove("menu-open"); burger.setAttribute("aria-expanded", "false"); mnav.setAttribute("aria-hidden", "true"); lockScroll(false); }
burger.addEventListener("click", () => root.classList.contains("menu-open") ? closeMenu() : openMenu());

/* =========================================================
   HERO · quadros no canvas guiados pelo scroll
   ========================================================= */
const FRAMES = 221;
const canvas = $(".hero__canvas"), ctx = canvas.getContext("2d");
const loadBar = $(".hero__load");
const mobileSeq = () => innerWidth / innerHeight < 0.8;
let seqDir = mobileSeq() ? "seq-m" : "seq";
let imgs = [], loaded = 0, current = 0, drawn = -1;

function frameSrc(i) { return `assets/${seqDir}/f${String(i + 1).padStart(3, "0")}.webp`; }
function loadSeq() {
  imgs = new Array(FRAMES); loaded = 0; drawn = -1;
  const order = [];
  // carrega primeiro quadros espaçados (prévia rápida), depois preenche o resto
  for (let step = 16; step >= 1; step = Math.floor(step / 2)) {
    for (let i = 0; i < FRAMES; i += step) if (!order.includes(i)) order.push(i);
    if (step === 1) break;
  }
  let k = 0;
  const next = () => {
    if (k >= order.length) return;
    const i = order[k++];
    const im = new Image();
    im.decoding = "async";
    im.onload = im.onerror = () => {
      if (im.naturalWidth) imgs[i] = im;
      loaded++;
      loadBar.firstElementChild.style.width = `${(loaded / FRAMES) * 100}%`;
      if (loaded >= FRAMES) loadBar.classList.add("is-done");
      if (i === 0 || drawn < 0) render(true);
      next();
    };
    im.src = frameSrc(i);
  };
  for (let p = 0; p < 6; p++) next(); // 6 downloads em paralelo
}
function nearest(i) {
  if (imgs[i]) return imgs[i];
  for (let d = 1; d < FRAMES; d++) {
    if (imgs[i - d]) return imgs[i - d];
    if (imgs[i + d]) return imgs[i + d];
  }
  return null;
}
function sizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  render(true);
}
function render(force) {
  const i = Math.max(0, Math.min(FRAMES - 1, Math.round(current)));
  if (!force && i === drawn) return;
  const im = nearest(i);
  if (!im) return;
  const cw = canvas.width, ch = canvas.height, iw = im.naturalWidth, ih = im.naturalHeight;
  const s = Math.max(cw / iw, ch / ih);
  const w = iw * s, h = ih * s;
  ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
  drawn = imgs[i] ? i : -2;
}
let rsz;
addEventListener("resize", () => {
  clearTimeout(rsz);
  rsz = setTimeout(() => {
    const want = mobileSeq() ? "seq-m" : "seq";
    if (want !== seqDir) { seqDir = want; loadSeq(); }
    sizeCanvas();
  }, 150);
});
loadSeq();
sizeCanvas();

const chaps = $$(".chap"), stepsLi = $$(".steps li:not(.steps__lbl)");
function setChapter(p) {
  const idx = p < 0.29 ? 0 : p < 0.575 ? 1 : 2;
  stepsLi.forEach((li, k) => li.classList.toggle("is-on", k === idx));
}

if (hasGsap) {
  const seq = { f: 0 };
  const shade = $(".hero__shade");
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: hero, start: "top top", end: "bottom bottom", scrub: 0.6,
      onUpdate: (st) => setChapter(st.progress),
    },
  });
  tl.to(seq, { f: FRAMES - 1, duration: 10, onUpdate: () => { current = seq.f; render(); } }, 0);

  // opacidade no bloco; movimento nos filhos (o bloco mantém o próprio posicionamento)
  const kids = (c) => [...c.children];
  // capítulo 1: já visível, sai
  gsap.set(chaps[0], { autoAlpha: 1 });
  tl.to(kids(chaps[0]), { y: -60, filter: "blur(6px)", duration: 0.6, stagger: 0.04, ease: "power1.in" }, 2.2)
    .to(chaps[0], { autoAlpha: 0, duration: 0.6, ease: "power1.in" }, 2.25)
    .to(".hero__hint", { autoAlpha: 0, duration: 0.4 }, 0.2);
  // capítulo 2
  tl.fromTo(chaps[1], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 3.0)
    .fromTo(kids(chaps[1]), { y: 70, filter: "blur(6px)" }, { y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.12, ease: "power2.out" }, 3.0)
    .fromTo($("em", chaps[1]), { x: 60, display: "inline-block" }, { x: 0, duration: 1.3, ease: "power2.out" }, 3.0)
    .to(kids(chaps[1]), { y: -60, filter: "blur(6px)", duration: 0.6, stagger: 0.04, ease: "power1.in" }, 5.1)
    .to(chaps[1], { autoAlpha: 0, duration: 0.6, ease: "power1.in" }, 5.15);
  // capítulo 3
  tl.fromTo(chaps[2], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 5.9)
    .fromTo(kids(chaps[2]), { y: 80, filter: "blur(6px)" }, { y: 0, filter: "blur(0px)", duration: 0.9, stagger: 0.14, ease: "power2.out" }, 5.9);
  // saída: o vídeo escurece e desfoca, como na referência
  tl.to(canvas, { scale: 1.08, filter: "blur(5px)", duration: 1.6 }, 8.4)
    .to(shade, { "--dim": 0.72, duration: 1.6 }, 8.4)
    .to(kids(chaps[2]), { y: -40, duration: 1.6 }, 8.4)
    .to(".steps", { autoAlpha: 0, duration: 0.6 }, 9.2);
  chaps.forEach((c) => c.classList.add("is-on"));
} else {
  // sem GSAP: calcula o progresso direto do scroll
  chaps.forEach((c) => { c.classList.add("is-on"); c.style.opacity = 0; });
  const upd = () => {
    const r = hero.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / (hero.offsetHeight - innerHeight)));
    current = p * (FRAMES - 1); render();
    setChapter(p);
    const idx = p < 0.29 ? 0 : p < 0.575 ? 1 : 2;
    chaps.forEach((c, k) => { c.style.opacity = k === idx ? 1 : 0; });
  };
  addEventListener("scroll", upd, { passive: true });
  upd();
}

/* =========================================================
   ANIMAÇÕES DE ENTRADA
   ========================================================= */
// quebra os títulos em palavras (mantém <em> e <br>)
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "w";
          const i = document.createElement("span"); i.textContent = p;
          w.appendChild(i); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
    });
  };
  walk(el);
}

if (hasGsap && !reduce) {
  $$(".split").forEach((el) => {
    splitWords(el);
    gsap.from($$(".w > span", el), {
      yPercent: 110, duration: 1.1, ease: "power3.out", stagger: 0.045,
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
  $$(".fade-up").forEach((el) => gsap.to(el, {
    opacity: 1, y: 0, duration: 1.1, ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 90%" },
  }));
  $$(".reveal-img").forEach((el) => {
    gsap.to(el, { clipPath: "inset(0% 0 0 0)", duration: 1.6, ease: "power3.inOut", scrollTrigger: { trigger: el, start: "top 80%" } });
    const img = $("img", el);
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
  });
  // cards do carrossel
  gsap.from(".card", { y: 80, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.09, scrollTrigger: { trigger: ".rail", start: "top 85%" } });
  // serviços
  $$(".serv__list li").forEach((li, k) => gsap.from(li, { y: 50, opacity: 0, duration: 1, ease: "power3.out", delay: (k % 2) * 0.12, scrollTrigger: { trigger: li, start: "top 90%" } }));
  // contato: parallax do fundo e lista
  gsap.fromTo(".cta__bg", { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".cta__box", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(".cta__list li", { x: 40, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: ".cta__list", start: "top 85%" } });
  // rodapé: assinatura gigante desliza
  gsap.fromTo(".ftr__big", { xPercent: 12 }, { xPercent: -6, ease: "none", scrollTrigger: { trigger: ".ftr", start: "top bottom", end: "bottom bottom", scrub: true } });
} else {
  $$(".fade-up").forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
  $$(".reveal-img").forEach((el) => { el.style.clipPath = "none"; });
}

/* ---------- Contadores ---------- */
$$("[data-count]").forEach((el) => {
  const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
  const fmt = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  if (!hasGsap || reduce) { el.textContent = fmt(to); return; }
  const o = { v: 0 };
  gsap.to(o, { v: to, duration: 2.2, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 92%" }, onUpdate: () => { el.textContent = fmt(o.v); } });
});

/* ---------- Carrossel de projetos ---------- */
const rail = $(".rail"), bar = $(".rail__progress i"), arrows = $$(".arrow");
function railUpd() {
  const max = rail.scrollWidth - rail.clientWidth;
  const p = max > 0 ? rail.scrollLeft / max : 0;
  const w = Math.max(14, (rail.clientWidth / rail.scrollWidth) * 100);
  bar.style.width = `${w}%`;
  bar.style.left = `${p * (100 - w)}%`;
  arrows[0].disabled = rail.scrollLeft < 8;
  arrows[1].disabled = rail.scrollLeft > max - 8;
}
rail.addEventListener("scroll", railUpd, { passive: true });
addEventListener("resize", railUpd);
railUpd();
arrows.forEach((b) => b.addEventListener("click", () => {
  const card = $(".card", rail);
  const step = card.offsetWidth + parseFloat(getComputedStyle(rail).columnGap || 24);
  rail.scrollBy({ left: step * +b.dataset.dir, behavior: "smooth" });
}));
// arrastar com o mouse
let dragX = 0, dragS = 0, dragging = false, moved = false;
rail.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse") return;
  dragging = true; moved = false; dragX = e.clientX; dragS = rail.scrollLeft;
});
addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - dragX;
  if (Math.abs(dx) > 5) { moved = true; rail.classList.add("is-drag"); }
  rail.scrollLeft = dragS - dx;
});
addEventListener("pointerup", () => {
  if (!dragging) return;
  dragging = false;
  if (moved) {
    // solta e deixa o snap encaixar no card mais próximo
    const card = $(".card", rail);
    const step = card.offsetWidth + 24;
    const target = Math.round(rail.scrollLeft / step) * step;
    rail.classList.remove("is-drag");
    rail.scrollTo({ left: target, behavior: "smooth" });
  }
});
rail.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") { e.preventDefault(); arrows[1].click(); }
  if (e.key === "ArrowLeft") { e.preventDefault(); arrows[0].click(); }
});

/* ---------- Marquee dos pratos (acelera com o scroll) ---------- */
const marqs = $$(".marq").map((m) => {
  const tr = $(".marq__track", m);
  tr.innerHTML += tr.innerHTML; // duplica para o loop contínuo
  $$("img", tr).forEach((im, k) => { if (k >= tr.children.length / 2) { im.alt = ""; im.setAttribute("aria-hidden", "true"); } });
  return { tr, dir: +m.dataset.speed, x: 0 };
});
let boost = 0, lastSY = scrollY;
function marqTick() {
  const dy = scrollY - lastSY; lastSY = scrollY;
  boost += (Math.min(40, Math.abs(dy)) * 0.12 - boost) * 0.08;
  marqs.forEach((m) => {
    const half = m.tr.scrollWidth / 2;
    if (!half) return;
    m.x -= (reduce ? 0 : 0.45 + boost) * m.dir;
    if (m.x <= -half) m.x += half;
    if (m.x > 0) m.x -= half;
    m.tr.style.transform = `translate3d(${m.x}px,0,0)`;
  });
  requestAnimationFrame(marqTick);
}
marqs.forEach((m) => { if (m.dir < 0) m.x = -m.tr.scrollWidth / 4; });
requestAnimationFrame(marqTick);

/* ---------- Linha do tempo ---------- */
const tlItems = $$(".tl__it");
if (hasGsap) {
  gsap.to(".tl__line i", { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".tl", start: "top 60%", end: "bottom 60%", scrub: true } });
  tlItems.forEach((it) => {
    ScrollTrigger.create({ trigger: it, start: "top 62%", onEnter: () => it.classList.add("is-lit"), onLeaveBack: () => it.classList.remove("is-lit") });
    if (!reduce) gsap.from(it.children, { y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: it, start: "top 85%" } });
  });
} else tlItems.forEach((it) => it.classList.add("is-lit"));

/* ---------- Serviços: foto que segue o cursor ---------- */
const flt = $(".serv__float"), fltImg = $("img", flt);
if (!isTouch && flt) {
  let fx = 0, fy = 0, tx = 0, ty = 0, on = false;
  $$(".serv__list li").forEach((li) => {
    li.addEventListener("mouseenter", () => { fltImg.src = li.dataset.img; flt.classList.add("is-on"); on = true; });
    li.addEventListener("mouseleave", () => { flt.classList.remove("is-on"); on = false; });
  });
  addEventListener("mousemove", (e) => { tx = e.clientX + 150; ty = e.clientY; });
  const loop = () => {
    fx += (tx - fx) * 0.14; fy += (ty - fy) * 0.14;
    const sc = on ? 1 : 0.6;
    flt.style.transform = `translate(${fx}px, ${fy}px) translate(-50%, -50%) scale(${sc}) rotate(${(tx - fx) * 0.03}deg)`;
    requestAnimationFrame(loop);
  };
  loop();
}

/* =========================================================
   FORMULÁRIO QUALIFICADOR → WhatsApp
   ========================================================= */
const lead = $("#lead"), form = $(".lead__form", lead);
const qs = $$(".q:not(.q--done)", form);
const nextBtn = $(".lead__next", lead), backBtn = $(".lead__back", lead);
let step = 0, leadTrigger = null;
form.setAttribute("data-lenis-prevent", "");

const answered = (i) => qs[i].classList.contains("q--form") || !!$("input:checked", qs[i]);
function showStep(i) {
  step = i;
  qs.forEach((q, k) => q.classList.toggle("is-on", k === i));
  $(".q--done", form).classList.remove("is-on");
  $(".lead__progress i").style.width = `${((i + 1) / (qs.length + 1)) * 100}%`;
  $(".js-step").textContent = i + 1;
  backBtn.classList.toggle("is-on", i > 0);
  nextBtn.disabled = !answered(i);
  $("span", nextBtn).textContent = i === qs.length - 1 ? "Ir para o WhatsApp" : "Continuar";
  track("lead_step", { step: i + 1 });
}
function openLead(servico, trigger) {
  leadTrigger = trigger || document.activeElement;
  form.reset();
  $(".err", form).textContent = "";
  $$(".is-bad", form).forEach((x) => x.classList.remove("is-bad"));
  lead.classList.remove("is-done");
  let start = 0;
  if (servico) {
    const r = $$('input[name="servico"]', form).find((x) => x.value === servico);
    if (r) { r.checked = true; start = 1; }
  }
  showStep(start);
  lead.classList.add("is-open");
  lead.setAttribute("aria-hidden", "false");
  lockScroll(true);
  track("lead_open", { servico: servico || "" });
  setTimeout(() => $("input", qs[start])?.focus({ preventScroll: true }), 450);
}
function closeLead() {
  lead.classList.remove("is-open");
  lead.setAttribute("aria-hidden", "true");
  lockScroll(false);
  leadTrigger?.focus?.({ preventScroll: true });
}
$$("[data-open-lead]").forEach((b) => b.addEventListener("click", (e) => {
  e.preventDefault();
  if (root.classList.contains("menu-open")) closeMenu();
  openLead(b.dataset.servico || null, b);
}));
$$("[data-close-lead]", lead).forEach((b) => b.addEventListener("click", closeLead));

form.addEventListener("change", (e) => {
  if (e.target.type !== "radio") return;
  nextBtn.disabled = false;
  const at = step;
  // portfólio ou consultoria: pula perguntas que não se aplicam
  setTimeout(() => {
    if (step !== at || !lead.classList.contains("is-open")) return;
    let nx = at + 1;
    const serv = $('input[name="servico"]:checked', form)?.value || "";
    if (at === 0 && /portfólio/i.test(serv)) nx = qs.length - 1;
    showStep(nx);
  }, 360);
});
backBtn.addEventListener("click", () => {
  if (step === 0) return;
  const serv = $('input[name="servico"]:checked', form)?.value || "";
  showStep(step === qs.length - 1 && /portfólio/i.test(serv) ? 0 : step - 1);
});
nextBtn.addEventListener("click", () => {
  if (step < qs.length - 1) { if (answered(step)) showStep(step + 1); return; }
  submitLead();
});
form.addEventListener("submit", (e) => { e.preventDefault(); if (step === qs.length - 1) submitLead(); });
$$(".q--form input", form).forEach((inp) => inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); submitLead(); } }));

// máscara do telefone
const tel = $('input[name="whatsapp"]', form);
tel.addEventListener("input", () => {
  const d = tel.value.replace(/\D/g, "").slice(0, 11);
  let out = d;
  if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length > 7) out = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  tel.value = out;
});

function submitLead() {
  const fd = new FormData(form);
  const nome = (fd.get("nome") || "").trim();
  const fone = (fd.get("whatsapp") || "").replace(/\D/g, "");
  const err = $(".err", form);
  $$(".is-bad", form).forEach((x) => x.classList.remove("is-bad"));
  if (nome.length < 2) { $('input[name="nome"]', form).classList.add("is-bad"); err.textContent = "Conte pra gente o seu nome."; return; }
  if (fone.length < 10) { tel.classList.add("is-bad"); err.textContent = "Confira o seu WhatsApp com DDD."; return; }
  if (!fd.get("lgpd")) { err.textContent = "Precisamos do seu ok para entrar em contato."; return; }
  err.textContent = "";

  const payload = {
    nome, whatsapp: fone, local: (fd.get("local") || "").trim(),
    servico: fd.get("servico") || "", pessoas: fd.get("pessoas") || "",
    quando: fd.get("quando") || "", investimento: fd.get("investimento") || "",
    origem: "Site Chef Nana Barreto", pagina: location.href, data: new Date().toISOString(),
  };
  const linhas = [
    `Olá, Chef Nana! Vim pelo site e gostaria de um orçamento.`,
    ``,
    `• Serviço: ${payload.servico || "-"}`,
    payload.pessoas ? `• Pessoas: ${payload.pessoas}` : null,
    payload.quando ? `• Quando: ${payload.quando}` : null,
    payload.investimento ? `• Investimento previsto: ${payload.investimento}` : null,
    payload.local ? `• Data e local: ${payload.local}` : null,
    ``,
    `Nome: ${nome}`,
  ].filter((l) => l !== null);
  const url = `https://wa.me/${NANA_WHATSAPP}?text=${encodeURIComponent(linhas.join("\n"))}`;
  $(".js-wa", form).href = url;
  $(".js-name", form).textContent = nome.split(" ")[0];

  if (NANA_LEAD_ENDPOINT) {
    fetch(NANA_LEAD_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
  } else {
    console.info("[lead]", payload);
  }
  track("lead_submit", { servico: payload.servico, pessoas: payload.pessoas, quando: payload.quando, investimento: payload.investimento });

  qs.forEach((q) => q.classList.remove("is-on"));
  $(".q--done", form).classList.add("is-on");
  $(".lead__progress i").style.width = "100%";
  lead.classList.add("is-done");
  window.open(url, "_blank", "noopener");
}

/* ---------- Esc fecha o que estiver aberto ---------- */
addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (lead.classList.contains("is-open")) return closeLead();
  if (root.classList.contains("menu-open")) closeMenu();
});

addEventListener("load", () => hasGsap && ScrollTrigger.refresh());
