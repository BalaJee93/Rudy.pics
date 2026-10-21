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

  // A cow-like "Mmmoooo": a deep voice that starts with closed lips ("mm"),
  // opens into "oo", swells, then sags at the end. Formant filters shape the vowel.
  function moo(a, out, t) {
    const dur = 1.8;

    const lips = a.createBiquadFilter(); // "mm" -> "oo": lips opening and closing
    lips.type = "lowpass";
    lips.Q.value = 1;
    lips.frequency.setValueAtTime(180, t);
    lips.frequency.linearRampToValueAtTime(260, t + 0.25);
    lips.frequency.exponentialRampToValueAtTime(1400, t + 0.6);
    lips.frequency.setValueAtTime(1400, t + 1.2);
    lips.frequency.exponentialRampToValueAtTime(400, t + dur);

    const f1 = a.createBiquadFilter(); // vowel formants for a round "oo/aw"
    f1.type = "peaking";
    f1.frequency.value = 420;
    f1.Q.value = 3;
    f1.gain.value = 12;
    const f2 = a.createBiquadFilter();
    f2.type = "peaking";
    f2.frequency.value = 850;
    f2.Q.value = 4;
    f2.gain.value = 8;

    const gain = a.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.11, t + 0.12);
    gain.gain.linearRampToValueAtTime(0.19, t + 0.7);
    gain.gain.linearRampToValueAtTime(0.16, t + 1.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    lips.connect(f1).connect(f2).connect(gain).connect(out);

    // Slow, uneven wobble in the voice.
    const lfo = a.createOscillator();
    const lfoDepth = a.createGain();
    lfo.frequency.value = 4.5;
    lfoDepth.gain.value = 2.5;
    lfo.connect(lfoDepth);

    [[0, "sawtooth", 1], [1.5, "sawtooth", 0.7], [0, "square", 0.25]].forEach(([detune, type, level]) => {
      const osc = a.createOscillator();
      const lvl = a.createGain();
      osc.type = type;
      lvl.gain.value = level;
      osc.frequency.setValueAtTime(88 + detune, t);
      osc.frequency.linearRampToValueAtTime(118 + detune, t + 0.5);
      osc.frequency.linearRampToValueAtTime(112 + detune, t + 1.1);
      osc.frequency.linearRampToValueAtTime(78 + detune, t + dur);
      lfoDepth.connect(osc.frequency);
      osc.connect(lvl).connect(lips);
      osc.start(t);
      osc.stop(t + dur);
    });

    // A little breathy air on top.
    const noise = a.createBufferSource();
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const air = a.createBiquadFilter();
    air.type = "bandpass";
    air.frequency.value = 700;
    air.Q.value = 1.5;
    const airGain = a.createGain();
    airGain.gain.value = 0.04;
    noise.connect(air).connect(airGain).connect(gain);
    noise.start(t);

    lfo.start(t);
    lfo.stop(t + dur);
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
    moo: () => {
      const a = ctx();
      if (a) moo(a, a.destination, a.currentTime);
    },
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
