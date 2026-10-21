// ABC time! Shows each letter big with a picture and reads it out loud.
(function () {
  const ABC = [
    ["A", "Apple", "🍎"], ["B", "Ball", "⚽"], ["C", "Cow", "🐄"], ["D", "Dog", "🐶"],
    ["E", "Elephant", "🐘"], ["F", "Fish", "🐟"], ["G", "Grapes", "🍇"], ["H", "Horse", "🐴"],
    ["I", "Insect", "🐞"], ["J", "Juice", "🧃"], ["K", "Kite", "🪁"], ["L", "Lion", "🦁"],
    ["M", "Monkey", "🐒"], ["N", "Noodles", "🍜"], ["O", "Orange", "🍊"], ["P", "Parrot", "🦜"],
    ["Q", "Queen", "👸"], ["R", "Rabbit", "🐰"], ["S", "Sun", "☀️"], ["T", "Tiger", "🐯"],
    ["U", "Umbrella", "☂️"], ["V", "Van", "🚐"], ["W", "Watch", "⌚"], ["X", "Xylophone", "🎶"],
    ["Y", "Yo-yo", "🪀"], ["Z", "Zebra", "🦓"],
  ];
  // Letter sounds (phonics), spelled so the phone voice says the sound, not the name.
  const SOUNDS = {
    A: "ah", B: "buh", C: "kuh", D: "duh", E: "eh", F: "fuh", G: "guh", H: "huh", I: "ih",
    J: "juh", K: "kuh", L: "luh", M: "muh", N: "nuh", O: "aw", P: "puh", Q: "kwuh", R: "ruh",
    S: "sss", T: "tuh", U: "uh", V: "vuh", W: "wuh", X: "ks", Y: "yuh", Z: "zuh",
  };
  const COLORS = ["#ff8a5c", "#5cc8ff", "#7bd389", "#c77dff", "#ffb703", "#ff8fab"];
  const speech = window.speechSynthesis;

  const button = document.createElement("button");
  button.className = "abc-button";
  button.type = "button";
  button.innerHTML = '<span class="abc-a">A</span><span class="abc-b">B</span><span class="abc-c">C</span>';
  button.setAttribute("aria-label", "Start ABC");
  document.body.appendChild(button);

  const stage = document.createElement("div");
  stage.className = "abc-stage";
  stage.hidden = true;
  stage.innerHTML =
    '<button class="abc-close" type="button" aria-label="Stop ABC">&times;</button>' +
    '<button class="abc-card" type="button" aria-label="Say it again">' +
    '<span class="abc-letter"></span><span class="abc-pic"></span><span class="abc-word"></span>' +
    '<span class="abc-sound"></span>' +
    "</button>" +
    '<div class="abc-nav">' +
    '<button class="abc-prev" type="button" aria-label="Previous letter">&#8249;</button>' +
    '<button class="abc-next" type="button" aria-label="Next letter">&#8250;</button>' +
    "</div>";
  document.body.appendChild(stage);

  const card = stage.querySelector(".abc-card");
  const letterEl = stage.querySelector(".abc-letter");
  const picEl = stage.querySelector(".abc-pic");
  const wordEl = stage.querySelector(".abc-word");
  const soundEl = stage.querySelector(".abc-sound");

  let index = 0;
  let timer = null;
  let run = 0; // bumps on every change so stale "next" callbacks are ignored

  // Browsers have no real child voices, so pick a bright female voice and pitch it
  // up high, with short excited phrases, to sound like a little kid teaching.
  function voice() {
    const voices = speech ? speech.getVoices() : [];
    const english = voices.filter((v) => /^en/i.test(v.lang) && !/male\b|daniel|alex|fred|rishi|aaron|arthur|guy|david|mark/i.test(v.name));
    return (
      english.find((v) => /samantha|karen|tessa|moira|veena|aria|jenny|ana|zira|female/i.test(v.name)) ||
      english.find((v) => /google/i.test(v.name)) ||
      english[0] ||
      null
    );
  }

  function say(text, pitch, rate, onend) {
    const u = new SpeechSynthesisUtterance(text);
    const v = voice();
    if (v) u.voice = v;
    u.lang = v ? v.lang : "en-US";
    u.pitch = pitch;
    u.rate = rate;
    if (onend) {
      u.onend = onend;
      u.onerror = onend;
    }
    speech.speak(u);
  }

  function show(i, autoNext) {
    index = (i + ABC.length) % ABC.length;
    const [letter, word, pic] = ABC[index];
    const myRun = ++run;
    clearTimeout(timer);
    let moved = false;

    stage.style.setProperty("--abc", COLORS[index % COLORS.length]);
    letterEl.textContent = letter + letter.toLowerCase();
    picEl.textContent = pic;
    wordEl.innerHTML = "<b>" + letter + "</b> for " + word;
    const lower = letter.toLowerCase();
    soundEl.textContent = lower + " · " + lower + " · " + word.toLowerCase();
    card.classList.remove("in");
    void card.offsetWidth; // restart the pop-in animation
    card.classList.add("in");

    const next = () => {
      if (moved || myRun !== run || stage.hidden || !autoNext) return;
      moved = true;
      timer = setTimeout(() => {
        if (myRun !== run || stage.hidden) return;
        if (index === ABC.length - 1) {
          cheer();
        } else {
          show(index + 1, true);
        }
      }, 900);
    };

    if (speech) {
      speech.cancel();
      // Like the phonics song: "A for Apple! ah, ah, apple!"
      // Spell "A" as it sounds, or some voices read it as "uh for apple".
      const spoken = letter === "A" ? "Ay" : letter;
      const sound = SOUNDS[letter];
      say(spoken + " for " + word + "!", 1.8, 0.95);
      say(sound + ", " + sound + ", " + word.toLowerCase() + "!", 1.9, 1, next);
      // Safety net in case the browser never reports the end of speech.
      setTimeout(next, 9000);
    } else {
      timer = setTimeout(next, 2200);
    }
  }

  function cheer() {
    letterEl.textContent = "🎉";
    picEl.textContent = "⭐";
    wordEl.textContent = "Yay Rudy! A to Z!";
    soundEl.textContent = "";
    card.classList.remove("in");
    void card.offsetWidth;
    card.classList.add("in");
    if (speech) {
      speech.cancel();
      say("Yaaay!", 2, 0.9);
      say("Well done Rudy!", 1.8, 0.95);
    }
  }

  // A soft bouncy beat under the voice, like a kids' song: boom, clap, with a bass line.
  let beat = null;

  function startBeat() {
    const a = window.rudyAudio && window.rudyAudio();
    if (!a || beat) return;
    const out = a.createGain();
    out.gain.value = 0.5;
    out.connect(a.destination);
    const step = 60 / 104 / 2; // eighth notes at 104 bpm
    const bass = [131, 131, 196, 196, 220, 220, 175, 175]; // C C G G A A F F
    let n = 0;
    let at = a.currentTime + 0.1;

    function hit(t, i) {
      const beatInBar = i % 8;
      if (beatInBar === 0 || beatInBar === 4) { // boom
        const o = a.createOscillator();
        const g = a.createGain();
        o.frequency.setValueAtTime(130, t);
        o.frequency.exponentialRampToValueAtTime(45, t + 0.15);
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + 0.2);
      }
      if (beatInBar === 2 || beatInBar === 6) { // clap
        const len = Math.floor(a.sampleRate * 0.08);
        const buf = a.createBuffer(1, len, a.sampleRate);
        const d = buf.getChannelData(0);
        for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / len);
        const src = a.createBufferSource();
        const f = a.createBiquadFilter();
        const g = a.createGain();
        src.buffer = buf;
        f.type = "bandpass";
        f.frequency.value = 1500;
        g.gain.value = 0.25;
        src.connect(f).connect(g).connect(out);
        src.start(t);
      }
      if (i % 2 === 0) { // bouncy bass note
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = "triangle";
        o.frequency.value = bass[Math.floor(i / 4) % bass.length];
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + step * 1.6);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + step * 1.6);
      }
    }

    beat = {
      out,
      id: setInterval(() => {
        while (at < a.currentTime + 0.3) {
          hit(at, n++);
          at += step;
        }
      }, 100),
    };
  }

  function stopBeat() {
    if (!beat) return;
    clearInterval(beat.id);
    beat.out.disconnect();
    beat = null;
  }

  function open() {
    stage.hidden = false;
    startBeat();
    show(0, true);
  }

  function close() {
    stopBeat();
    run++;
    clearTimeout(timer);
    if (speech) speech.cancel();
    stage.hidden = true;
  }

  button.addEventListener("click", open);
  stage.querySelector(".abc-close").addEventListener("click", close);
  stage.querySelector(".abc-prev").addEventListener("click", () => show(index - 1, true));
  stage.querySelector(".abc-next").addEventListener("click", () => show(index + 1, true));
  card.addEventListener("click", () => show(index, true));
  document.addEventListener("keydown", (e) => {
    if (stage.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(index - 1, true);
    if (e.key === "ArrowRight") show(index + 1, true);
  });
})();
