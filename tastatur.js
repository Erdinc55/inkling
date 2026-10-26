/*
  tastatur.js
  -----------
  Die gezeichnete Schreibmaschine: runde Tasten mit Metallring und der
  Typenkorb, aus dem bei jedem Anschlag ein Hebel aufs Papier schlägt.

  Tasten werden über das ZEICHEN gefunden, nicht über den Tastencode.
  Warum? Der Tastencode sagt nur, wo die Taste auf einer US-Tastatur
  liegen würde. Auf einer deutschen Tastatur sitzt das Z aber woanders,
  und Ä, Ö, Ü haben gar keinen eigenen US-Code. Das getippte Zeichen
  dagegen stimmt immer.
*/

// Jede Taste: [normal, mit Umschalt]. Buchstaben stehen nur einmal drin,
// der Großbuchstabe wird automatisch ergänzt.
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

// Wie viele Hebel im Korb stecken. Echte Maschinen haben etwa 44,
// 28 reichen fürs Auge und bleiben flüssig.
const HEBEL_ANZAHL = 28;

class Schreibmaschine {
  constructor(tastenFeld, korbFeld) {
    this.tastenFeld = tastenFeld;
    this.korbFeld = korbFeld;
    this.zeichenZuTaste = new Map();   // "A" -> { el, shift: true, anteil }
    this.markiert = [];
    this.hebel = [];
    this.korbBauen();
  }

  // Tasten neu zeichnen, zum Beispiel nach dem Wechsel QWERTZ <-> QWERTY.
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
        // Wo liegt die Taste von links nach rechts? 0 bis 1.
        // Daraus wird später der passende Typenhebel gewählt.
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

  // Den Typenkorb als SVG bauen: ein Fächer aus Hebeln unter dem Papier.
  // Alle Hebel zielen auf denselben Punkt, die Anschlagstelle oben in der Mitte.
  korbBauen() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 400 120");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("korb-svg");

    // Halbrunder Korb als Hintergrund
    const bogen = document.createElementNS(ns, "path");
    bogen.setAttribute("d", "M 70 120 A 130 78 0 0 1 330 120 Z");
    bogen.setAttribute("class", "korb-schale");
    svg.appendChild(bogen);

    const ziel = { x: 200, y: 4 };
    for (let i = 0; i < HEBEL_ANZAHL; i++) {
      // Drehpunkte liegen auf einem Bogen um die Mitte unten.
      const winkel = Math.PI + (i + 0.5) / HEBEL_ANZAHL * Math.PI; // 180° bis 360°
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

  // Eine Taste kurz drücken lassen und den passenden Hebel hochschlagen.
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
    // Die Leertaste hat keinen Hebel, sie schiebt nur den Wagen weiter.
    if (t.leer || ruhig) return;
    const i = Math.max(0, Math.min(HEBEL_ANZAHL - 1, Math.round(t.anteil * (HEBEL_ANZAHL - 1))));
    // Der Hebel ruht als kurzer Stummel (von vorne sieht man ihn verkürzt)
    // und schnellt für einen Augenblick auf volle Länge bis zum Papier.
    this.hebel[i].animate(
      [{ transform: "scaleX(0.2)" }, { transform: "scaleX(1)", offset: 0.4 }, { transform: "scaleX(0.2)" }],
      { duration: 130, easing: "cubic-bezier(.2,.7,.3,1)" }
    );
  }

  // Die nächste Taste hervorheben. Bei stehenden Fehlern die Rücktaste.
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

  // Fehler pro Taste einfärben: je mehr Fehler, desto knalliger das Rot.
  // fehler ist { "e": 3, "E": 1, ... } (das Zeichen, das man treffen sollte).
  hitze(fehler) {
    this.hitzeWeg();
    const proTaste = new Map();
    for (const [zeichen, n] of Object.entries(fehler || {})) {
      const t = this.zeichenZuTaste.get(zeichen);
      if (!t) continue;
      proTaste.set(t.el, (proTaste.get(t.el) || 0) + n);
      // Ein Großbuchstabe verlangt auch Umschalt. Die bekommt nur einen
      // Hauch Rot, denn der Fehler kann auch am Buchstaben liegen.
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
