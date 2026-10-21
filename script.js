(function () {
  const photos = window.PHOTOS || [];
  const gallery = document.getElementById("gallery");
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbCap = document.getElementById("lb-cap");
  let current = 0;

  if (!photos.length) {
    document.getElementById("empty").hidden = false;
    return;
  }

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  photos.forEach((p, i) => {
    const fig = document.createElement("figure");
    fig.className = "photo";

    const img = document.createElement("img");
    img.src = p.src;
    img.alt = p.caption || "Rudy";
    img.loading = "lazy";
    fig.appendChild(img);

    if (p.caption || p.date) {
      const cap = document.createElement("figcaption");
      cap.textContent = p.caption || "";
      if (p.date) {
        const t = document.createElement("time");
        t.dateTime = p.date;
        t.textContent = formatDate(p.date);
        cap.appendChild(t);
      }
      fig.appendChild(cap);
    }

    fig.addEventListener("click", () => open(i));
    gallery.appendChild(fig);
  });

  function show(i) {
    current = (i + photos.length) % photos.length;
    const p = photos[current];
    lbImg.src = p.src;
    lbImg.alt = p.caption || "Rudy";
    lbCap.textContent = p.caption || "";
  }

  function open(i) {
    show(i);
    lightbox.hidden = false;
  }

  function close() {
    lightbox.hidden = true;
  }

  lightbox.querySelector(".lb-close").addEventListener("click", close);
  lightbox.querySelector(".lb-prev").addEventListener("click", () => show(current - 1));
  lightbox.querySelector(".lb-next").addEventListener("click", () => show(current + 1));
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
})();
