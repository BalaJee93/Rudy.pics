// ABC time! Shows each letter big with a picture and reads it out loud.
(function () {
  const ABC = [
    ["A", "Apple", "🍎"], ["B", "Ball", "⚽"], ["C", "Cow", "🐄"], ["D", "Dog", "🐶"],
    ["E", "Elephant", "🐘"], ["F", "Fish", "🐟"], ["G", "Grapes", "🍇"], ["H", "Horse", "🐴"],
    ["I", "Ice cream", "🍦"], ["J", "Juice", "🧃"], ["K", "Kite", "🪁"], ["L", "Lion", "🦁"],
    ["M", "Monkey", "🐒"], ["N", "Noodles", "🍜"], ["O", "Orange", "🍊"], ["P", "Parrot", "🦜"],
    ["Q", "Queen", "👸"], ["R", "Rabbit", "🐰"], ["S", "Sun", "☀️"], ["T", "Tiger", "🐯"],
    ["U", "Umbrella", "☂️"], ["V", "Van", "🚐"], ["W", "Watch", "⌚"], ["X", "Xylophone", "🎶"],
    ["Y", "Yo-yo", "🪀"], ["Z", "Zebra", "🦓"],
  ];
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

  let index = 0;
  let timer = null;
  let run = 0; // bumps on every change so stale "next" callbacks are ignored

  function voice() {
    const voices = speech ? speech.getVoices() : [];
    return (
      voices.find((v) => /en[-_](IN|GB|US)/i.test(v.lang) && /female|samantha|veena|karen|moira|google/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      null
    );
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
      const u = new SpeechSynthesisUtterance(letter + ". " + letter + " for " + word + ".");
      const v = voice();
      if (v) u.voice = v;
      u.lang = v ? v.lang : "en-US";
      u.rate = 0.8;
      u.pitch = 1.2;
      u.onend = next;
      u.onerror = next;
      speech.speak(u);
      // Safety net in case the browser never reports the end of speech.
      setTimeout(next, 6000);
    } else {
      timer = setTimeout(next, 2200);
    }
  }

  function cheer() {
    letterEl.textContent = "🎉";
    picEl.textContent = "⭐";
    wordEl.textContent = "Yay Rudy! A to Z!";
    card.classList.remove("in");
    void card.offsetWidth;
    card.classList.add("in");
    if (speech) {
      speech.cancel();
      const u = new SpeechSynthesisUtterance("Yay! Well done Rudy!");
      const v = voice();
      if (v) u.voice = v;
      u.rate = 0.9;
      u.pitch = 1.3;
      speech.speak(u);
    }
  }

  function open() {
    stage.hidden = false;
    show(0, true);
  }

  function close() {
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
