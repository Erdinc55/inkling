const BELEGUNGEN = {
  qwertz: [
    [["^", "°"], ["1", "!"], ["2", "\""], ["3", "§"], ["4", "$"], ["5", "%"], ["6", "&"],
     ["7", "/"], ["8", "("], ["9", ")"], ["0", "="], ["ß", "?"], ["´", "`"]],
    ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p", "ü", ["+", "*"]],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ö", "ä", ["#", "'"]],
    [["<", ">"], "y", "x", "c", "v", "b", "n", "m", [",", ";"], [".", ":"], ["-", "_"]]
  ],
  qwerty: [
    [["`", "~"], ["1", "!"], ["2", "@"], ["3", "#"], ["4", "$"], ["5", "%"], ["6", "^"],
     ["7", "&"], ["8", "*"], ["9", "("], ["0", ")"], ["-", "_"], ["=", "+"]],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", ["[", "{"], ["]", "}"]],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", [";", ":"], ["'", "\""]],
    ["z", "x", "c", "v", "b", "n", "m", [",", "<"], [".", ">"], ["/", "?"]]
  ]
};

const HEBEL_ANZAHL = 28;

class Schreibmaschine {
  constructor(tastenFeld, korbFeld) {
    this.tastenFeld = tastenFeld;
    this.korbFeld = korbFeld;
    this.zeichenZuTaste = new Map();  
    this.markiert = [];
    this.hebel = [];
    this.korbBauen();
  }

  bauen(name) {
    const reihen = BELEGUNGEN[name] || BELEGUNGEN.qwertz;
    this.tastenFeld.innerHTML = "";
    this.zeichenZuTaste.clear();
    this.markiert = [];

    reihen.forEach((reihe, r) => {
      const zeile = document.createElement("div");
      zeile.className = "tasten-reihe reihe-" + r;
      reihe.forEach((eintrag, s) => {
        const [unten, oben] = Array.isArray(eintrag) ? eintrag : [eintrag, eintrag.toUpperCase()];
        const istBuchstabe = !Array.isArray(eintrag);
        const taste = this.taste(istBuchstabe ? oben : unten, istBuchstabe ? "" : oben);
        const anteil = (s + r * 0.35) / (reihe.length - 1 + 3 * 0.35);
        this.zeichenZuTaste.set(unten, { el: taste, shift: false, anteil });
        if (oben !== unten) this.zeichenZuTaste.set(oben, { el: taste, shift: true, anteil });
        zeile.appendChild(taste);
      });
      if (r === 0) {
        this.ruecktaste = this.taste("⌫", "", "breit ruecktaste");
        zeile.appendChild(this.ruecktaste);
      }
      this.tastenFeld.appendChild(zeile);
    });

    const unterste = document.createElement("div");
    unterste.className = "tasten-reihe reihe-leer";
    this.shiftLinks = this.taste("⇧", "", "breit umschalt");
    this.leertaste = this.taste("", "", "leertaste");
    this.shiftRechts = this.taste("⇧", "", "breit umschalt");
    unterste.append(this.shiftLinks, this.leertaste, this.shiftRechts);
    this.tastenFeld.appendChild(unterste);
    this.zeichenZuTaste.set(" ", { el: this.leertaste, shift: false, anteil: 0.5, leer: true });
  }

  taste(haupt, neben, extra) {
    const el = document.createElement("span");
    el.className = "taste" + (extra ? " " + extra : "");
    el.setAttribute("aria-hidden", "true");
    if (neben) {
      el.innerHTML = '<span class="taste-oben"></span><span class="taste-unten"></span>';
      el.firstChild.textContent = neben;
      el.lastChild.textContent = haupt;
    } else {
      el.innerHTML = '<span class="taste-haupt"></span>';
      el.firstChild.textContent = haupt;
    }
    return el;
  }

  korbBauen() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 400 120");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("korb-svg");

    const bogen = document.createElementNS(ns, "path");
    bogen.setAttribute("d", "M 70 120 A 130 78 0 0 1 330 120 Z");
    bogen.setAttribute("class", "korb-schale");
    svg.appendChild(bogen);

    const ziel = { x: 200, y: 4 };
    for (let i = 0; i < HEBEL_ANZAHL; i++) {
      const winkel = Math.PI + (i + 0.5) / HEBEL_ANZAHL * Math.PI; 
      const px = 200 + Math.cos(winkel) * 118;
      const py = 124 + Math.sin(winkel) * 100;
      const dx = ziel.x - px, dy = ziel.y - py;
      const laenge = Math.hypot(dx, dy);
      const richtung = Math.atan2(dy, dx) * 180 / Math.PI;

      const g = document.createElementNS(ns, "g");
      g.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${richtung.toFixed(1)})`);
      const linie = document.createElementNS(ns, "line");
      linie.setAttribute("x1", "0"); linie.setAttribute("y1", "0");
      linie.setAttribute("x2", laenge.toFixed(1)); linie.setAttribute("y2", "0");
      linie.setAttribute("class", "hebel");
      g.appendChild(linie);
      svg.appendChild(g);
      this.hebel.push(linie);
    }
    this.korbFeld.appendChild(svg);
  }

  anschlag(zeichen) {
    const t = this.zeichenZuTaste.get(zeichen);
    if (!t) return;
    const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!ruhig) {
      t.el.animate(
        [{ transform: "translateY(0)" }, { transform: "translateY(3px) scale(0.96)" }, { transform: "translateY(0)" }],
        { duration: 110, easing: "ease-out" }
      );
    }
    if (t.leer || ruhig) return;
    const i = Math.max(0, Math.min(HEBEL_ANZAHL - 1, Math.round(t.anteil * (HEBEL_ANZAHL - 1))));
    this.hebel[i].animate(
      [{ transform: "scaleX(0.2)" }, { transform: "scaleX(1)", offset: 0.4 }, { transform: "scaleX(0.2)" }],
      { duration: 130, easing: "cubic-bezier(.2,.7,.3,1)" }
    );
  }

  markiere(zeichen, fehlerStehen) {
    for (const el of this.markiert) el.classList.remove("dran");
    this.markiert = [];
    const dazu = [];
    if (fehlerStehen) {
      dazu.push(this.ruecktaste);
    } else if (zeichen !== undefined && zeichen !== null) {
      const t = this.zeichenZuTaste.get(zeichen);
      if (t) {
        dazu.push(t.el);
        if (t.shift) dazu.push(this.shiftLinks, this.shiftRechts);
      }
    }
    for (const el of dazu) {
      if (!el) continue;
      el.classList.add("dran");
      this.markiert.push(el);
    }
  }

  hitze(fehler) {
    this.hitzeWeg();
    const proTaste = new Map();
    for (const [zeichen, n] of Object.entries(fehler || {})) {
      const t = this.zeichenZuTaste.get(zeichen);
      if (!t) continue;
      proTaste.set(t.el, (proTaste.get(t.el) || 0) + n);
    }
    const max = Math.max(0, ...proTaste.values());
    for (const [el, n] of proTaste) {
      el.style.setProperty("--hitze", Messung.fehlerStaerke(n, max).toFixed(3));
      el.classList.add("heiss");
      el.title = n + "×";
    }
    return proTaste.size;
  }

  hitzeWeg() {
    for (const el of this.tastenFeld.querySelectorAll(".heiss")) {
      el.classList.remove("heiss");
      el.style.removeProperty("--hitze");
      el.removeAttribute("title");
    }
  }
}
