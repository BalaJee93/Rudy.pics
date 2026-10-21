// Extra fun for Rudy: bouncy title, balloons to pop, confetti taps and silly sounds.
(function () {
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Sounds (made with Web Audio, no files needed) ----------
  let audio = null;
  let soundOn = true;
  try { soundOn = localStorage.getItem("rudy-sound") !== "off"; } catch (e) {}

  function ctx() {
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      // Let sounds play on iPhones even when the silent switch is on.
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
      audio = new AC();
    }
    if (audio.state === "suspended") audio.resume();
    return audio;
  }

  function tone(type, from, to, dur, vol, delay) {
    const a = ctx();
    if (!a) return;
    const t = a.currentTime + (delay || 0);
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  // A cartoon "Mooo": buzzy low voice that opens up then sinks, with a little wobble.
  function moo(delay) {
    const a = ctx();
    if (!a) return;
    const t = a.currentTime + (delay || 0);
    const filter = a.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 6;
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.linearRampToValueAtTime(900, t + 0.35);
    filter.frequency.linearRampToValueAtTime(350, t + 1.3);
    const gain = a.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.15);
    gain.gain.setValueAtTime(0.4, t + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    filter.connect(gain).connect(a.destination);

    const lfo = a.createOscillator();
    const lfoDepth = a.createGain();
    lfo.frequency.value = 5;
    lfoDepth.gain.value = 3;
    lfo.connect(lfoDepth);

    [0, 3].forEach((detune) => {
      const osc = a.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(115 + detune, t);
      osc.frequency.linearRampToValueAtTime(145 + detune, t + 0.3);
      osc.frequency.linearRampToValueAtTime(100 + detune, t + 1.4);
      lfoDepth.connect(osc.frequency);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + 1.4);
    });
    lfo.start(t);
    lfo.stop(t + 1.4);
  }

  const SOUNDS = {
    pop: () => tone("sine", 900, 120, 0.15, 0.35),
    honk: () => {
      [0, 0.18].forEach((d) => {
        tone("square", 420, 420, 0.12, 0.12, d);
        tone("square", 530, 530, 0.12, 0.08, d);
      });
    },
    vroom: () => {
      SOUNDS.honk();
      tone("sawtooth", 70, 260, 0.45, 0.14, 0.35);
      tone("sawtooth", 260, 90, 0.35, 0.12, 0.8);
    },
    moo: () => moo(0),
    boing: () => tone("sine", 220, 660, 0.25, 0.3),
    sparkle: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone("triangle", f, f, 0.12, 0.15, i * 0.06)),
  };

  window.rudySound = function (name) {
    if (soundOn && SOUNDS[name]) SOUNDS[name]();
  };

  const toggle = document.createElement("button");
  toggle.className = "sound-toggle";
  toggle.type = "button";
  function paintToggle() {
    toggle.textContent = soundOn ? "🔊" : "🔇";
    toggle.setAttribute("aria-label", soundOn ? "Turn sounds off" : "Turn sounds on");
  }
  paintToggle();
  toggle.addEventListener("click", () => {
    soundOn = !soundOn;
    try { localStorage.setItem("rudy-sound", soundOn ? "on" : "off"); } catch (e) {}
    paintToggle();
    window.rudySound("boing");
  });
  document.body.appendChild(toggle);

  // ---------- Bouncy title letters ----------
  const title = document.querySelector(".hero h1");
  const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  let n = 0;
  textNodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    for (const ch of node.textContent) {
      const s = document.createElement("span");
      s.className = "letter";
      s.textContent = ch;
      s.style.setProperty("--i", n++);
      frag.appendChild(s);
    }
    node.replaceWith(frag);
  });
  title.addEventListener("click", () => {
    title.classList.remove("jump");
    void title.offsetWidth; // restart the animation
    title.classList.add("jump");
    window.rudySound("boing");
  });

  if (calm) return;

  // ---------- Photos pop in one by one ----------
  document.querySelectorAll(".photo").forEach((p, i) => {
    p.classList.add("pop-in");
    p.style.animationDelay = i * 0.15 + "s";
  });

  const layer = document.createElement("div");
  layer.className = "fun-layer";
  document.body.appendChild(layer);

  // ---------- Confetti ----------
  const SPARKS = ["⭐", "✨", "🎉", "💛", "🌈", "🎈", "🍭", "🦖"];

  function burst(x, y, amount) {
    for (let i = 0; i < amount; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      s.textContent = SPARKS[Math.floor(Math.random() * SPARKS.length)];
      s.style.left = x + "px";
      s.style.top = y + "px";
      layer.appendChild(s);
      const angle = Math.random() * Math.PI * 2;
      const dist = (innerWidth < 600 ? 40 : 60) + Math.random() * (innerWidth < 600 ? 70 : 110);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      s.animate(
        [
          { transform: "translate(-50%, -50%) scale(0.4)", opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.1) rotate(${dx * 2}deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 80}px)) scale(0.8) rotate(${dx * 3}deg)`, opacity: 0 },
        ],
        { duration: 1100, easing: "cubic-bezier(.2,.8,.3,1)" }
      ).onfinish = () => s.remove();
    }
  }

  // Tap anywhere that isn't a button, photo or the big photo viewer.
  document.addEventListener("click", (e) => {
    if (e.target.closest("button, .photo, .lightbox, .balloon, h1")) return;
    burst(e.clientX, e.clientY, 10);
    window.rudySound("sparkle");
  });

  // ---------- Balloons ----------
  const COLORS = ["#ff5c5c", "#ffb703", "#5cc8ff", "#7bd389", "#c77dff", "#ff8fab"];
  let balloons = 0;

  function launchBalloon() {
    if (document.hidden || balloons >= (innerWidth < 600 ? 3 : 6)) return;
    balloons++;
    const b = document.createElement("button");
    b.className = "balloon";
    b.type = "button";
    b.setAttribute("aria-label", "Balloon");
    b.style.setProperty("--c", COLORS[Math.floor(Math.random() * COLORS.length)]);
    b.style.left = 5 + Math.random() * 85 + "vw";
    const rise = 9 + Math.random() * 6;
    b.style.animationDuration = `${rise}s, ${2 + Math.random() * 2}s`;
    layer.appendChild(b);

    const done = () => {
      if (!b.isConnected) return;
      b.remove();
      balloons--;
    };
    b.addEventListener("animationend", (e) => { if (e.animationName === "rise") done(); });
    b.addEventListener("click", () => {
      const r = b.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 14);
      window.rudySound("pop");
      done();
    });
  }

  setInterval(launchBalloon, 2500);
  launchBalloon();
})();
