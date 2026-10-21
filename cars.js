// Floating toy cars. Tap one to make it spin and zoom away!
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const TOYS = ["🚗", "🚙", "🏎️", "🚕", "🚓", "🚑", "🚒", "🚌", "🚜", "🛻", "🚚", "🚐"];
  const layer = document.createElement("div");
  layer.className = "toy-layer";
  document.body.appendChild(layer);

  const count = Math.min(18, Math.max(8, Math.round((innerWidth * innerHeight) / 70000)));
  const cars = [];

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  for (let i = 0; i < count; i++) {
    const el = document.createElement("button");
    el.className = "toy";
    el.type = "button";
    el.setAttribute("aria-label", "Toy car");
    el.textContent = TOYS[i % TOYS.length];
    layer.appendChild(el);

    const dir = Math.random() < 0.5 ? -1 : 1;
    const car = {
      el,
      x: rand(0, innerWidth),
      y: rand(0, innerHeight),
      vx: dir * rand(25, 70),
      vy: rand(-8, 8),
      size: rand(26, 46),
      phase: rand(0, Math.PI * 2),
      boost: 0,
      spin: 0,
    };
    el.style.fontSize = car.size + "px";
    el.addEventListener("click", () => zoom(car));
    cars.push(car);
  }

  function zoom(car) {
    car.boost = 1;
    car.spin = 0;
    puff(car.x, car.y);
    if (window.rudySound) window.rudySound("vroom");
  }

  function puff(x, y) {
    const p = document.createElement("span");
    p.className = "puff";
    p.textContent = "💨";
    p.style.left = x + "px";
    p.style.top = y + "px";
    layer.appendChild(p);
    p.addEventListener("animationend", () => p.remove());
  }

  let last = performance.now();

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const w = innerWidth;
    const h = innerHeight;

    for (const c of cars) {
      const speed = 1 + c.boost * 8;
      c.x += c.vx * speed * dt;
      c.y += c.vy * dt;
      c.phase += dt * 2;

      // Wrap around the edges so the parade never ends.
      const pad = c.size * 1.5;
      if (c.x < -pad) c.x = w + pad;
      if (c.x > w + pad) c.x = -pad;
      if (c.y < -pad) c.y = h + pad;
      if (c.y > h + pad) c.y = -pad;

      if (c.boost > 0) {
        c.boost = Math.max(0, c.boost - dt * 0.8);
        c.spin += dt * 900;
      }

      const bob = Math.sin(c.phase) * 8;
      const tilt = Math.sin(c.phase * 1.3) * 6 + (c.boost > 0 ? c.spin : 0);
      // Emoji cars face left, so flip the ones driving right.
      const flip = c.vx > 0 ? -1 : 1;
      c.el.style.transform =
        `translate(${c.x}px, ${c.y + bob}px) translate(-50%, -50%) rotate(${tilt}deg) scaleX(${flip})`;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
