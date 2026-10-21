// Moo! Rudy's favourite FaceTime cow. Tap the cow button (or a cow walking by)
// and a big cow pops up, wiggles and moos.
(function () {
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const button = document.createElement("button");
  button.className = "cow-button";
  button.type = "button";
  button.setAttribute("aria-label", "Moo!");
  button.textContent = "🐮";
  document.body.appendChild(button);

  let showing = false;

  function bigCow() {
    if (window.rudySound) window.rudySound("moo");
    if (showing) return;
    showing = true;

    const stage = document.createElement("div");
    stage.className = "cow-stage" + (calm ? " calm" : "");
    stage.innerHTML = '<div class="cow-bubble">Mooo!</div><div class="cow-face">🐮</div>';
    document.body.appendChild(stage);

    if (!calm) {
      for (let i = 0; i < 8; i++) {
        const h = document.createElement("span");
        h.className = "cow-heart";
        h.textContent = ["💛", "🌼", "🥛", "💚"][i % 4];
        h.style.left = 20 + Math.random() * 60 + "%";
        h.style.animationDelay = Math.random() * 0.6 + "s";
        stage.appendChild(h);
      }
    }

    setTimeout(() => stage.classList.add("bye"), 1900);
    setTimeout(() => {
      stage.remove();
      showing = false;
    }, 2400);
  }

  button.addEventListener("click", bigCow);

  if (calm) return;

  // Every so often a cow strolls along the bottom of the screen.
  function walkingCow() {
    if (document.hidden) return;
    const cow = document.createElement("button");
    cow.className = "walking-cow";
    cow.type = "button";
    cow.setAttribute("aria-label", "Cow");
    cow.textContent = "🐄";
    const leftToRight = Math.random() < 0.5;
    if (leftToRight) cow.classList.add("ltr");
    document.body.appendChild(cow);
    cow.addEventListener("animationend", (e) => { if (e.animationName.startsWith("cow-walk")) cow.remove(); });
    cow.addEventListener("click", () => {
      cow.remove();
      bigCow();
    });
  }

  setTimeout(walkingCow, 4000);
  setInterval(walkingCow, 20000);
})();
