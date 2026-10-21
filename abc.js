// Learning time! ABC shows each letter with a picture and its sound, and 123 counts
// from 1 to 10. Both read out loud in a kid-style voice over a soft beat.
(function () {
  const LETTERS = [
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
  const NUMBER_WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  const COUNT_THINGS = [
    ["cow", "cows", "🐄"], ["ball", "balls", "⚽"], ["car", "cars", "🚗"], ["duck", "ducks", "🦆"],
    ["apple", "apples", "🍎"], ["fish", "fish", "🐟"], ["star", "stars", "⭐"],
    ["balloon", "balloons", "🎈"], ["banana", "bananas", "🍌"], ["teddy", "teddies", "🧸"],
  ];
  const cap = (w) => w[0].toUpperCase() + w.slice(1);

  const DECKS = {
    abc: {
      done: "Yay Rudy! A to Z!",
      items: LETTERS.map(([letter, word, pic]) => {
        const lower = letter.toLowerCase();
        const sound = SOUNDS[letter];
        // Spell "A" as it sounds, or some voices read it as "uh for apple".
        const spoken = letter === "A" ? "Ay" : letter;
        return {
          big: letter + lower,
          pics: [pic],
          word: "<b>" + letter + "</b> for " + word,
          sub: lower + " · " + lower + " · " + word.toLowerCase(),
          // Like the phonics song: "A for Apple! ah, ah, apple!"
          lines: [spoken + " for " + word + "!", sound + ", " + sound + ", " + word.toLowerCase() + "!"],
        };
      }),
    },
    count: {
      done: "Yay Rudy! You counted to 10!",
      items: COUNT_THINGS.map(([one, many, pic], i) => {
        const n = i + 1;
        const name = n === 1 ? one : many;
        const counting = NUMBER_WORDS.slice(0, n);
        return {
          big: String(n),
          pics: Array(n).fill(pic),
          word: "<b>" + n + "</b> " + name,
          sub: counting.join(" · "),
          // "Three! one, two, three! Three cars!"
          lines: [cap(NUMBER_WORDS[i]) + "!"]
            .concat(n > 1 ? [counting.join(", ") + "!"] : [])
            .concat([cap(NUMBER_WORDS[i]) + " " + name + "!"]),
        };
      }),
    },
  };

  const COLORS = ["#ff8a5c", "#5cc8ff", "#7bd389", "#c77dff", "#ffb703", "#ff8fab"];
  const speech = window.speechSynthesis;
  const RATE = 0.75; // a little slow so Rudy can follow along

  const bar = document.createElement("div");
  bar.className = "learn-bar";
  bar.innerHTML =
    '<button class="learn-button" type="button" data-deck="abc" aria-label="Start ABC">' +
    '<span class="c1">A</span><span class="c2">B</span><span class="c3">C</span></button>' +
    '<button class="learn-button" type="button" data-deck="count" aria-label="Start counting">' +
    '<span class="c1">1</span><span class="c2">2</span><span class="c3">3</span></button>';
  document.body.appendChild(bar);

  const stage = document.createElement("div");
  stage.className = "abc-stage";
  stage.hidden = true;
  stage.innerHTML =
    '<button class="abc-close" type="button" aria-label="Stop">&times;</button>' +
    '<button class="abc-card" type="button" aria-label="Say it again">' +
    '<span class="abc-letter"></span><span class="abc-pic"></span><span class="abc-word"></span>' +
    '<span class="abc-sound"></span>' +
    "</button>" +
    '<div class="abc-nav">' +
    '<button class="abc-prev" type="button" aria-label="Previous">&#8249;</button>' +
    '<button class="abc-next" type="button" aria-label="Next">&#8250;</button>' +
    "</div>";
  document.body.appendChild(stage);

  const card = stage.querySelector(".abc-card");
  const letterEl = stage.querySelector(".abc-letter");
  const picEl = stage.querySelector(".abc-pic");
  const wordEl = stage.querySelector(".abc-word");
  const soundEl = stage.querySelector(".abc-sound");

  let deck = DECKS.abc;
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

  function popCard() {
    card.classList.remove("in");
    void card.offsetWidth; // restart the pop-in animation
    card.classList.add("in");
  }

  function show(i, autoNext) {
    const items = deck.items;
    index = (i + items.length) % items.length;
    const item = items[index];
    const myRun = ++run;
    clearTimeout(timer);
    let moved = false;

    stage.style.setProperty("--abc", COLORS[index % COLORS.length]);
    letterEl.textContent = item.big;
    picEl.innerHTML = item.pics.map((p, k) => '<span style="--k:' + k + '">' + p + "</span>").join("");
    picEl.classList.toggle("many", item.pics.length > 1);
    picEl.classList.toggle("lots", item.pics.length > 5);
    wordEl.innerHTML = item.word;
    soundEl.textContent = item.sub;
    popCard();

    const next = () => {
      if (moved || myRun !== run || stage.hidden || !autoNext) return;
      moved = true;
      timer = setTimeout(() => {
        if (myRun !== run || stage.hidden) return;
        if (index === items.length - 1) {
          cheer();
        } else {
          show(index + 1, true);
        }
      }, 1000);
    };

    if (speech) {
      speech.cancel();
      item.lines.forEach((line, k) => {
        const last = k === item.lines.length - 1;
        say(line, k === 0 ? 1.9 : 1.8, RATE, last ? next : null);
      });
      // Safety net in case the browser never reports the end of speech.
      setTimeout(next, 14000);
    } else {
      timer = setTimeout(next, 3000);
    }
  }

  function cheer() {
    letterEl.textContent = "🎉";
    picEl.innerHTML = "<span>⭐</span>";
    picEl.classList.remove("many", "lots");
    wordEl.textContent = deck.done;
    soundEl.textContent = "";
    popCard();
    if (speech) {
      speech.cancel();
      say("Yaaay!", 2, RATE);
      say("Well done Rudy!", 1.8, RATE);
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

  function open(name) {
    deck = DECKS[name];
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

  bar.querySelectorAll(".learn-button").forEach((b) => b.addEventListener("click", () => open(b.dataset.deck)));
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
