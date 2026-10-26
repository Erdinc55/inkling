/*
  app.js
  ------
  Verbindet alles: Tastendrücke -> Lauf (spiel.js) -> Papier, Zählwerk,
  Schreibmaschine (tastatur.js), Ton (ton.js), Ergebnis und Bestenliste.

  Aufbau dieser Datei, von oben nach unten:
   1. Speicher (Einstellungen, Bestenliste, Rang)
   2. Elemente und Hilfsfunktionen
   3. Das Papier zeichnen
   4. Tippen am Computer und auf dem Handy
   5. Uhr / Tinte (Schleife)
   6. Ende eines Laufs, Ergebnis, Diagramm
   7. Rang-Leiste und Bestenliste
   8. Einstellungen und Start
*/

(function () {
  "use strict";

  /* ============ 1. Speicher ============ */

  // Alles liegt unter einem einzigen Schlüssel. Das "v1" erlaubt später
  // einen Umbau, ohne dass alte Daten die Seite durcheinanderbringen.
  const SCHLUESSEL = "inkling.v1";

  const Speicher = {
    ok: true,
    lesen() {
      try {
        const roh = localStorage.getItem(SCHLUESSEL);
        const daten = roh ? JSON.parse(roh) : {};
        return daten && typeof daten === "object" ? daten : {};
      } catch (e) {
        // Gesperrter Speicher (privates Fenster, Datenschutz-Einstellung)
        // oder kaputte Daten: Wir machen einfach ohne weiter.
        this.ok = false;
        return {};
      }
    },
    schreiben(daten) {
      try {
        localStorage.setItem(SCHLUESSEL, JSON.stringify(daten));
      } catch (e) {
        this.ok = false;
      }
    }
  };

  const STANDARD = {
    sprache: "en", belegung: "qwertz", satzzeichen: true, ton: false,
    modus: "zeit", dauer: 60, art: "woerter"
  };
  const ARTEN = ["woerter", "sprichwoerter", "zitate", "saetze", "gemischt"];

  const gespeichert = Speicher.lesen();
  const einst = Object.assign({}, STANDARD, gespeichert.einstellungen || {});
  // Gespeicherte Werte prüfen, falls jemand von Hand daran gedreht hat.
  if (!SPRACHEN[einst.sprache]) einst.sprache = STANDARD.sprache;
  if (!BELEGUNGEN[einst.belegung]) einst.belegung = STANDARD.belegung;
  if (![30, 60, 120].includes(einst.dauer)) einst.dauer = STANDARD.dauer;
  if (!["zeit", "ueberleben"].includes(einst.modus)) einst.modus = STANDARD.modus;
  if (!ARTEN.includes(einst.art)) einst.art = STANDARD.art;

  let bestenliste = (gespeichert.bestenliste && typeof gespeichert.bestenliste === "object") ? gespeichert.bestenliste : {};
  let besteRangWpm = typeof gespeichert.besteRangWpm === "number" ? gespeichert.besteRangWpm : null;
  let letzteWertung = typeof gespeichert.letzteWertung === "string" ? gespeichert.letzteWertung : null;
  let zuletztId = null;

  function speichern() {
    Speicher.schreiben({ einstellungen: einst, bestenliste, besteRangWpm, letzteWertung });
  }

  /* ============ 2. Elemente und Hilfen ============ */

  const $ = (id) => document.getElementById(id);
  const bogen = $("bogen");
  const fenster = $("fenster");
  const eingabe = $("eingabe");
  const ergebnisEl = $("ergebnis");
  const liste = $("liste");

  // Handy = grober Finger als einziger Zeiger. Ein Laptop mit Touchscreen
  // hat zusätzlich eine Maus und zählt deshalb als Computer.
  const istHandy = window.matchMedia("(pointer: coarse)").matches &&
                   !window.matchMedia("(any-pointer: fine)").matches;
  const geraet = istHandy ? "handy" : "computer";
  document.body.classList.toggle("handy", istHandy);

  const T = (schluessel, werte) => uebersetze(einst.sprache, schluessel, werte);
  const texteFuer = (sprache) => (sprache === "de" ? TEXTE_DE : TEXTE_EN);
  const RAEMISCH = ["I", "II", "III", "IV", "V", "VI", "VII"];

  function zahl(wert, stellen) {
    return Messung.runden(wert, stellen || 0).toLocaleString(einst.sprache, {
      minimumFractionDigits: stellen || 0, maximumFractionDigits: stellen || 0
    });
  }

  // Text sicher ins HTML setzen (keine Tags aus Texten ausführen).
  function sicher(text) {
    return String(text).replace(/[&<>"']/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[z]));
  }

  let meldungsUhr = null;
  function meldung(text) {
    const el = $("meldung");
    el.textContent = text;
    el.classList.add("zeigen");
    clearTimeout(meldungsUhr);
    meldungsUhr = setTimeout(() => el.classList.remove("zeigen"), 2600);
  }

  const ruhig = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ 3. Das Papier ============ */

  const maschine = new Schreibmaschine($("tasten"), $("korb"));
  maschine.bauen(einst.belegung);

  let lauf = null;
  let zeileEl = null;       // die Zeile, die gerade getippt wird
  let zeichenEls = [];      // ein <span> pro Zeichen dieser Zeile
  let ergebnisOffen = false;

  function zeileAnlegen() {
    zeileEl = document.createElement("div");
    zeileEl.className = "zeile aktuell";
    zeichenEls = [];
    const teile = document.createDocumentFragment();
    for (const z of lauf.zeile.text) {
      const s = document.createElement("span");
      s.className = "zeichen offen";
      s.textContent = z;
      zeichenEls.push(s);
      teile.appendChild(s);
    }
    zeileEl.appendChild(teile);
    if (lauf.zeile.autor) zeileEl.appendChild(autorEl(lauf.zeile.autor));
    bogen.appendChild(zeileEl);
    zeichnen();
  }

  function autorEl(name) {
    const a = document.createElement("span");
    a.className = "autor";
    a.textContent = "- " + name;
    return a;
  }

  // Nur die Zeichen rund um die Schreibstelle neu setzen. Bei jedem Anschlag
  // die ganze Zeile neu aufzubauen wäre bei 10 Anschlägen pro Sekunde unnötig.
  function zeichnen() {
    const text = lauf.zeile.text;
    const pos = lauf.pos;
    const falsch = lauf.falsch;
    const stelle = pos + falsch.length;
    const von = Math.max(0, pos - 2);
    const bis = Math.min(text.length - 1, pos + 8);
    for (let i = von; i <= bis; i++) {
      const s = zeichenEls[i];
      let klasse, inhalt;
      if (i < pos) {
        klasse = "zeichen gedruckt"; inhalt = text[i];
      } else if (i < stelle) {
        const f = falsch[i - pos];
        klasse = "zeichen falsch" + (f === " " ? " leer" : "");
        inhalt = f === " " ? " " : f;
      } else {
        klasse = "zeichen offen"; inhalt = text[i];
      }
      if (i === stelle) klasse += " jetzt";
      if (s.className !== klasse) s.className = klasse;
      if (s.textContent !== inhalt) s.textContent = inhalt;
    }
    // Den Wagen verschieben, damit die Schreibstelle unter der Marke steht.
    bogen.style.setProperty("--spalte", stelle);
  }

  // Zeile fertig: Glocke, Wagenrücklauf, Zeilenvorschub.
  function zeilenWechsel() {
    const fertig = lauf.fertigeZeilen[lauf.fertigeZeilen.length - 1];
    zeileEl.className = "zeile fertig";
    zeileEl.textContent = fertig.text;
    if (fertig.autor) zeileEl.appendChild(autorEl(fertig.autor));

    // Alte Zeilen weit oben sieht man nicht mehr, sie können weg.
    const alle = bogen.querySelectorAll(".zeile");
    for (let i = 0; i < alle.length - 6; i++) alle[i].remove();

    Ton.glocke();
    bogen.classList.add("ruecklauf");
    setTimeout(() => bogen.classList.remove("ruecklauf"), 340);
    zeileAnlegen();
    if (!ruhig()) {
      bogen.animate([{ translate: "0 1.75em" }, { translate: "0 0" }], { duration: 220, easing: "ease-out" });
    }
  }

  function markieren() {
    if (istHandy || !lauf) return;
    if (lauf.beendet) { maschine.markiere(null, false); return; }
    maschine.markiere(lauf.erwartet(), lauf.falsch.length > 0);
  }

  /* ============ 4. Tippen ============ */

  function neuerLauf() {
    ergebnisSchliessen();
    stoppeSchleife();
    lauf = new Lauf({
      modus: einst.modus,
      dauer: einst.dauer,
      art: einst.art,
      texte: texteFuer(einst.sprache),
      satzzeichen: einst.satzzeichen,
      // Auf dem Handy kürzere Wortzeilen, damit man das Zeilenende sieht.
      zeilenLaenge: istHandy ? 30 : 44
    });
    bogen.innerHTML = "";
    bogen.style.setProperty("--spalte", 0);
    zeileAnlegen();
    document.body.classList.remove("laeuft");
    maschine.hitzeWeg();
    zaehlerZuruecksetzen();
    startHinweis();
    markieren();
    if (istHandy) eingabeLeeren();
  }

  function tippen(zeichen) {
    if (!lauf || lauf.beendet || ergebnisOffen) return;
    const jetzt = performance.now();
    const warGestartet = lauf.gestartet;
    const r = lauf.tippe(zeichen, jetzt);
    if (r.typ === "ignoriert") return;

    if (!warGestartet) {
      document.body.classList.add("laeuft");
      starteSchleife();
    }
    if (!istHandy) maschine.anschlag(zeichen);

    if (r.typ === "richtig") {
      Ton.klack();
      if (r.zeilenEnde) zeilenWechsel(); else zeichnen();
      if (r.levelAuf) levelBlitz();
    } else {
      Ton.fehler();
      zeichnen();
    }
    markieren();
    // Im Überleben kann ein Fehler die letzte Tinte kosten.
    if (lauf.beendet) laufEnde();
  }

  function loeschen() {
    if (!lauf || ergebnisOffen) return;
    if (lauf.loeschen()) {
      if (!istHandy && maschine.ruecktaste && !ruhig()) {
        maschine.ruecktaste.animate([{ transform: "translateY(0)" }, { transform: "translateY(3px)" }, { transform: "translateY(0)" }], { duration: 110 });
      }
      zeichnen();
      markieren();
    }
  }

  function abbrechen() {
    neuerLauf();
  }

  // --- Computer: echte Tastatur ---
  document.addEventListener("keydown", (e) => {
    if (liste.open) return;               // Bestenliste offen: normal bedienen
    if (istHandy && e.target === eingabe) { handyTaste(e); return; }

    if (e.key === "Tab") {
      e.preventDefault();
      neuerLauf();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      abbrechen();
      return;
    }
    if (ergebnisOffen) return;            // Enter/Leertaste bedienen dann die Knöpfe

    // Strg/Cmd-Kombinationen (Kopieren, Neu laden ...) gehören dem Browser.
    // Achtung: AltGr meldet sich unter Windows als Strg+Alt, das lassen wir durch.
    if ((e.ctrlKey && !e.altKey) || e.metaKey) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      loeschen();
      return;
    }
    // Totentaste (^, ´, `): Das eigentliche Zeichen kommt mit dem nächsten Tastendruck.
    if (e.key === "Dead") return;
    // Gedrückt gehaltene Taste: nicht 30 Mal zählen.
    if (e.repeat) { if (e.key.length === 1) e.preventDefault(); return; }

    if (e.key.length === 1) {
      // Kein Scrollen bei Leertaste, keine Schnellsuche bei ' und /.
      e.preventDefault();
      if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
      tippen(e.key);
    }
  });

  // --- Handy: Bildschirmtastatur über ein verstecktes Eingabefeld ---
  // Viele Handy-Tastaturen melden bei keydown nur "Unidentified". Verlässlich
  // ist nur das input-Ereignis: Wir vergleichen den Inhalt vorher und nachher.
  // Ein Platzhalterzeichen vorne sorgt dafür, dass auch die Rücktaste bei
  // "leerem" Feld etwas löscht und damit bemerkt wird.
  const PLATZHALTER = "_";
  let vorher = PLATZHALTER;

  function eingabeLeeren() {
    eingabe.value = PLATZHALTER;
    vorher = PLATZHALTER;
    try { eingabe.setSelectionRange(1, 1); } catch (e) { /* manche Felder erlauben das nicht */ }
  }

  function handyTaste(e) {
    if (e.key === "Enter") { e.preventDefault(); if (ergebnisOffen) neuerLauf(); return; }
    // Rücktaste bei leerem Feld ändert den Inhalt nicht, also hier abfangen.
    if (e.key === "Backspace" && eingabe.value.length <= PLATZHALTER.length) {
      e.preventDefault();
      loeschen();
    }
  }

  eingabe.addEventListener("input", (e) => {
    const neu = eingabe.value;
    if (!neu.startsWith(PLATZHALTER)) {
      // Platzhalter wurde mitgelöscht: das war eine Rücktaste.
      loeschen();
      eingabeLeeren();
      return;
    }
    // Gemeinsamen Anfang finden, Rest ist gelöscht bzw. neu.
    let k = 0;
    while (k < vorher.length && k < neu.length && vorher[k] === neu[k]) k++;
    for (let i = 0; i < vorher.length - k; i++) loeschen();
    for (const z of neu.slice(k)) tippen(z);
    vorher = neu;
    // Nach einem Leerzeichen (Wortende) das Feld leeren. Nicht mitten im
    // Wort, denn dort setzt die Handy-Tastatur gerade noch ein Wort zusammen.
    if (!e.isComposing && (neu.endsWith(" ") || neu.length > 40)) eingabeLeeren();
  });

  eingabe.addEventListener("focus", () => {
    if (eingabe.value === "") eingabeLeeren();
    setTimeout(papierZeigen, 300);
  });

  // Die Bildschirmtastatur verdeckt die untere Hälfte. visualViewport sagt,
  // wie viel noch sichtbar ist. Dann schieben wir das Papier nach oben.
  function papierZeigen() {
    if (!istHandy || document.activeElement !== eingabe) return;
    const oben = $("maschine").getBoundingClientRect().top + window.scrollY - 8;
    window.scrollTo({ top: oben, behavior: ruhig() ? "auto" : "smooth" });
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", papierZeigen);
  }

  // Kein Einfügen, kein Hineinziehen von Text.
  for (const art of ["paste", "drop"]) {
    document.addEventListener(art, (e) => {
      if (liste.open) return;
      e.preventDefault();
      meldung(T("einfuegenVerboten"));
    });
  }

  /* ============ 5. Uhr und Tinte ============ */

  let schleife = null;
  let letzteAnzeige = 0;

  function starteSchleife() {
    stoppeSchleife();
    const schritt = () => {
      if (!lauf || lauf.beendet) return;
      const jetzt = performance.now();
      lauf.aktualisieren(jetzt);
      zaehlerZeigen(jetzt);
      if (lauf.beendet) { laufEnde(); return; }
      schleife = requestAnimationFrame(schritt);
    };
    schleife = requestAnimationFrame(schritt);
  }

  function stoppeSchleife() {
    if (schleife) cancelAnimationFrame(schleife);
    schleife = null;
  }

  function setze(id, text) {
    const el = $(id);
    if (el.textContent !== text) el.textContent = text;
  }

  function zaehlerZeigen(jetzt) {
    if (lauf.modus === "zeit") {
      setze("wert-zeit", String(Math.ceil(lauf.restzeit(jetzt))));
    } else {
      const anteil = lauf.tinte / UEBERLEBEN.maxTinte;
      $("tinten-stand").style.transform = "scaleX(" + anteil.toFixed(4) + ")";
      $("tinten-stand").parentElement.classList.toggle("knapp", lauf.tinte < 3.5);
      setze("wert-level", String(lauf.level));
      setze("wert-woerter", String(lauf.woerter));
    }
    // WPM und Genauigkeit viermal pro Sekunde reichen, sonst flackert es.
    if (jetzt - letzteAnzeige > 250) {
      letzteAnzeige = jetzt;
      const w = lauf.werte(jetzt);
      // In den ersten zwei Sekunden ist die WPM-Zahl noch Zufall.
      setze("wert-wpm", w.sekunden < 2 ? "-" : zahl(w.netto));
      setze("wert-gen", zahl(w.genauigkeit) + "%");
    }
  }

  function zaehlerZuruecksetzen() {
    const ueberleben = einst.modus === "ueberleben";
    $("zaehler-zeit").hidden = ueberleben;
    $("zaehler-tinte").hidden = !ueberleben;
    setze("wert-zeit", String(einst.dauer));
    setze("wert-wpm", "0");
    setze("wert-gen", "100%");
    setze("wert-level", "1");
    setze("wert-woerter", "0");
    $("tinten-stand").style.transform = "scaleX(1)";
    $("tinten-stand").parentElement.classList.remove("knapp");
  }

  function levelBlitz() {
    const el = $("wert-level");
    if (ruhig()) return;
    el.animate([{ transform: "scale(1.8)", color: "#ff4b3a" }, { transform: "scale(1)" }], { duration: 500, easing: "ease-out" });
  }

  function startHinweis() {
    let text = istHandy ? T("startHinweisHandy") + " " : "";
    text += T(einst.modus === "ueberleben" ? "startHinweisUeberleben" : "startHinweis");
    $("start-hinweis").textContent = text;
  }

  /* ============ 6. Ende, Ergebnis, Diagramm ============ */

  function wertungsSchluessel(modus, dauer, ger, sprache) {
    return (modus === "zeit" ? "zeit" + dauer : "ueberleben") + "|" + ger + "|" + sprache;
  }

  function sortieren(eintraege, modus) {
    return eintraege.sort((a, b) => modus === "ueberleben"
      ? (b.level - a.level) || (b.woerter - a.woerter) || (b.netto - a.netto)
      : (b.netto - a.netto) || (b.gen - a.gen));
  }

  function laufEnde() {
    stoppeSchleife();
    document.body.classList.remove("laeuft");
    const jetzt = performance.now();
    const w = lauf.werte(jetzt);
    if (w.alle === 0) { neuerLauf(); return; }
    markieren();

    // --- Bestenliste ---
    const schluessel = wertungsSchluessel(lauf.modus, lauf.dauer, geraet, einst.sprache);
    const eintraege = Array.isArray(bestenliste[schluessel]) ? bestenliste[schluessel] : [];
    const bisherBest = eintraege.length ? Object.assign({}, eintraege[0]) : null;
    const eintrag = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      datum: Date.now(),
      netto: Messung.runden(w.netto, 1),
      brutto: Messung.runden(w.brutto, 1),
      gen: Messung.runden(w.genauigkeit, 1),
      art: lauf.modus === "ueberleben" ? "woerter" : einst.art,
      level: w.level,
      woerter: w.woerter
    };
    eintraege.push(eintrag);
    sortieren(eintraege, lauf.modus);
    bestenliste[schluessel] = eintraege.slice(0, 10);
    const platz = bestenliste[schluessel].indexOf(eintrag) + 1; // 0 = nicht drin
    zuletztId = eintrag.id;
    letzteWertung = schluessel;

    // --- Rang (nur Zeitlauf am Computer, nur ab 90 % Genauigkeit) ---
    let aufstieg = false;
    const zaehlt = lauf.modus === "zeit" && !istHandy && Messung.zaehltFuerRang(w.genauigkeit);
    if (zaehlt && (besteRangWpm === null || w.netto > besteRangWpm)) {
      const alterRang = besteRangWpm === null ? -1 : Messung.rangIndex(besteRangWpm);
      besteRangWpm = Messung.runden(w.netto, 1);
      aufstieg = Messung.rangIndex(besteRangWpm) > alterRang;
    }
    speichern();
    rangLeisteZeigen();
    ergebnisZeigen(w, { platz, bisherBest, aufstieg, zaehlt });
  }

  function ergebnisZeigen(w, info) {
    ergebnisOffen = true;
    document.body.classList.add("ergebnis-offen");
    const ueberleben = lauf.modus === "ueberleben";

    // Stempel rechts oben
    let stempel = "";
    if (ueberleben) {
      stempel = `<div class="stempel gross rang-6${info.aufstieg ? " aufprall" : ""}" style="--rang-farbe: var(--tinte)">
        <span class="s-nummer">${sicher(T("level").toUpperCase())}</span>
        <span class="s-name" style="font-size:2.2em">${w.level}</span>
        <span class="s-fuss">INKLING</span></div>`;
    } else if (!istHandy && besteRangWpm !== null) {
      stempel = stempelHTML(Messung.rangIndex(besteRangWpm), "gross" + (info.aufstieg ? " aufprall" : ""));
      if (info.aufstieg) stempel += `<p class="aufstieg-text">${sicher(T("aufstieg"))}</p>`;
    }

    // Die großen Zahlen
    const zahlen = ueberleben
      ? [["level", w.level, true], ["woerterGezaehlt", w.woerter], ["netto", zahl(w.netto)]]
      : [["netto", zahl(w.netto), true], ["brutto", zahl(w.brutto)], ["genauigkeit", zahl(w.genauigkeit, 1) + "%"]];

    // Sätze unter den Zahlen
    const zeilen = [];
    zeilen.push(info.platz ? T("platz", { n: info.platz }) : T("keinPlatz"));
    if (!info.bisherBest) {
      zeilen.push(T("ersterLauf"));
    } else {
      const alt = ueberleben ? info.bisherBest.woerter : info.bisherBest.netto;
      const neu = ueberleben ? w.woerter : Messung.runden(w.netto, 1);
      const einheit = ueberleben ? " " + T("woerterGezaehlt") : " WPM";
      const diff = Messung.runden(neu - alt, 1);
      if (diff > 0) zeilen.push(`<span class="gut">${sicher(T("neuerBestwert", { n: zahl(diff, ueberleben ? 0 : 1) + einheit }))}</span>`);
      else if (diff < 0) zeilen.push(sicher(T("unterBestwert", { n: zahl(-diff, ueberleben ? 0 : 1) + einheit })));
      else zeilen.push(sicher(T("gleichBestwert")));
    }
    if (ueberleben) zeilen.push(sicher(T("genauigkeit") + ": " + zahl(w.genauigkeit, 1) + "%"));
    if (!ueberleben && istHandy) zeilen.push(sicher(T("rangNurComputer")));
    if (!ueberleben && !istHandy && !info.zaehlt) zeilen.push(`<span class="schlecht">${sicher(T("zuUngenau"))}</span>`);

    // Meistverfehlte Zeichen (hilft vor allem auf dem Handy, wo keine Tastatur zu sehen ist)
    const verfehlt = Object.entries(lauf.tastenFehler).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const fehlerText = verfehlt.length
      ? T("fehlerTasten") + " " + verfehlt.map(([z, n]) => "[" + (z === " " ? "␣" : z) + "] " + n + "×").join("  ")
      : T("keineFehler");

    const zitate = lauf.zitate();
    const zitatListe = zitate.length
      ? `<div class="e-zitate"><h3>${sicher(T("getippteZitate"))}</h3><ul>${
          zitate.map((z) => `<li>"${sicher(z.text)}" <em>- ${sicher(z.autor)}</em></li>`).join("")}</ul></div>`
      : "";

    ergebnisEl.innerHTML = `
      <div class="e-kopf">
        <div>
          <h2 class="e-titel">${sicher(T("ergebnis"))}</h2>
          <p class="e-grund">${sicher(T(lauf.grund === "tinte" ? "tinteLeer" : "zeitUm"))} · ${sicher(ueberleben ? T("ueberleben") : T("zeitlaufMit", { n: lauf.dauer }))} · ${sicher(T(einst.art === "woerter" || ueberleben ? "woerter" : einst.art))}</p>
          <dl class="e-zahlen">${zahlen.map(([k, v, haupt]) =>
            `<div class="e-zahl${haupt ? " haupt" : ""}"><dt>${sicher(T(k))}</dt><dd>${sicher(v)}</dd></div>`).join("")}
          </dl>
        </div>
        <div class="e-stempel-platz">${stempel}</div>
      </div>
      <p class="e-zeilen">${zeilen.join("<br>")}</p>
      <div class="e-diagramm"><h3>${sicher(T("verlaufTitel"))}</h3>${diagramm(w.sekunden)}</div>
      <p class="e-tasten-text">${sicher(fehlerText)}</p>
      ${zitatListe}
      <div class="e-aktionen">
        <button type="button" class="knopf voll" id="e-nochmal">${sicher(T("nochmal"))} <kbd>Tab</kbd></button>
        <button type="button" class="knopf" id="e-liste">${sicher(T("bestenliste"))}</button>
      </div>`;
    ergebnisEl.hidden = false;
    $("e-nochmal").addEventListener("click", neuerLauf);
    $("e-liste").addEventListener("click", () => listeOeffnen(letzteWertung));

    if (!istHandy) maschine.hitze(lauf.tastenFehler);
    if (info.aufstieg) setTimeout(() => Ton.stempel(), 250);
    if (istHandy) eingabe.blur();
    ergebnisEl.scrollIntoView({ behavior: ruhig() ? "auto" : "smooth", block: "nearest" });
  }

  function ergebnisSchliessen() {
    ergebnisOffen = false;
    ergebnisEl.hidden = true;
    ergebnisEl.innerHTML = "";
    document.body.classList.remove("ergebnis-offen");
  }

  // Tempo über die Zeit als SVG. Keine Bibliothek: nur ein Pfad aus Punkten.
  function diagramm(sekunden) {
    const punkte = Messung.verlauf(lauf.anschlaege, sekunden, 5);
    const B = 640, H = 170, L = 34, U = 24, O = 8, R = 8;
    const maxWpm = Math.max(20, Math.ceil(Math.max(...punkte.map((p) => p.wpm)) / 20) * 20);
    const maxS = Math.max(1, sekunden);
    const x = (s) => L + (s / maxS) * (B - L - R);
    const y = (v) => O + (1 - v / maxWpm) * (H - O - U);

    let svg = `<svg viewBox="0 0 ${B} ${H}" role="img" aria-label="${sicher(T("verlaufTitel"))}">`;
    for (let i = 0; i <= 4; i++) {
      const v = (maxWpm / 4) * i;
      svg += `<line class="d-gitter" x1="${L}" x2="${B - R}" y1="${y(v)}" y2="${y(v)}"/>`;
      svg += `<text class="d-achse" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`;
    }
    const schritt = maxS <= 30 ? 5 : maxS <= 60 ? 10 : maxS <= 150 ? 30 : 60;
    for (let s = 0; s <= maxS; s += schritt) {
      svg += `<text class="d-achse" x="${x(s)}" y="${H - 6}" text-anchor="middle">${s}</text>`;
    }
    if (punkte.length) {
      const linie = [`${x(0)},${y(punkte[0].wpm)}`].concat(punkte.map((p) => `${x(Math.min(p.sek, maxS)).toFixed(1)},${y(p.wpm).toFixed(1)}`));
      svg += `<polygon class="d-flaeche" points="${x(0)},${y(0)} ${linie.join(" ")} ${x(Math.min(punkte[punkte.length - 1].sek, maxS))},${y(0)}"/>`;
      svg += `<polyline class="d-linie" points="${linie.join(" ")}"/>`;
    }
    // Rote Striche unten: hier hat man sich vertippt.
    for (const a of lauf.anschlaege) {
      if (a.richtig) continue;
      const xs = x(Math.min(a.t / 1000, maxS)).toFixed(1);
      svg += `<line class="d-fehler" x1="${xs}" x2="${xs}" y1="${y(0) - 7}" y2="${y(0)}"/>`;
    }
    return svg + "</svg>";
  }

  /* ============ 7. Rang und Bestenliste ============ */

  function stempelHTML(index, klasse) {
    const r = Messung.RAENGE[index];
    return `<div class="stempel ${klasse || ""} rang-${index}" aria-label="${r.name}">
      <span class="s-nummer">${RAEMISCH[index]}</span>
      <span class="s-name">${r.name}</span>
      <span class="s-fuss">INKLING</span></div>`;
  }

  function rangLeisteZeigen() {
    const platz = $("rang-stempel");
    if (istHandy || besteRangWpm === null) {
      platz.outerHTML = `<div class="stempel klein leer" id="rang-stempel"><span class="s-name">?</span></div>`;
      $("rang-name").textContent = "-";
      $("rang-balken").style.width = "0%";
      $("rang-info").textContent = T(istHandy ? "rangNurComputer" : "rangKeiner");
      return;
    }
    const f = Messung.fortschritt(besteRangWpm);
    const index = Messung.rangIndex(besteRangWpm);
    platz.outerHTML = stempelHTML(index, "klein").replace('class="stempel', 'id="rang-stempel" class="stempel');
    $("rang-name").textContent = f.rang.name + " · " + zahl(besteRangWpm, 1) + " WPM";
    $("rang-balken").style.width = f.prozent.toFixed(1) + "%";
    $("rang-info").textContent = f.naechster
      ? T("rangNaechster", { n: zahl(f.fehlend, 1), rang: f.naechster.name })
      : T("rangGanzOben");
  }

  function optionen(select, paare, wert) {
    select.innerHTML = paare.map(([w, text]) => `<option value="${sicher(w)}">${sicher(text)}</option>`).join("");
    select.value = wert;
  }

  function listeOeffnen(vorauswahl) {
    const [m, g, s] = (vorauswahl || wertungsSchluessel(einst.modus, einst.dauer, geraet, einst.sprache)).split("|");
    optionen($("filter-modus"), [
      ["zeit30", T("zeitlaufMit", { n: 30 })], ["zeit60", T("zeitlaufMit", { n: 60 })],
      ["zeit120", T("zeitlaufMit", { n: 120 })], ["ueberleben", T("ueberleben")]
    ], m);
    optionen($("filter-geraet"), [["computer", T("computer")], ["handy", T("handy")]], g);
    optionen($("filter-sprache"), Object.keys(SPRACHEN).map((k) => [k, SPRACHEN[k]._name]), s);
    listeZeigen();
    if (typeof liste.showModal === "function") liste.showModal(); else liste.setAttribute("open", "");
  }

  function listeZeigen() {
    const m = $("filter-modus").value;
    const schluessel = m + "|" + $("filter-geraet").value + "|" + $("filter-sprache").value;
    const eintraege = Array.isArray(bestenliste[schluessel]) ? bestenliste[schluessel] : [];
    const ziel = $("liste-inhalt");
    if (!eintraege.length) {
      ziel.innerHTML = `<p class="leer-hinweis">${sicher(T("leer"))}</p>`;
      return;
    }
    const ueberleben = m === "ueberleben";
    const kopf = ueberleben
      ? ["#", T("level"), T("woerterGezaehlt"), "WPM", "%", T("datum")]
      : ["#", T("netto"), T("brutto"), "%", T("textart"), T("datum")];
    const zeilen = eintraege.map((e, i) => {
      const datum = new Date(e.datum).toLocaleDateString(einst.sprache);
      const zellen = ueberleben
        ? [i + 1, e.level, e.woerter, zahl(e.netto), zahl(e.gen, 1), datum]
        : [i + 1, zahl(e.netto, 1), zahl(e.brutto, 1), zahl(e.gen, 1), T(e.art), datum];
      return `<tr${e.id === zuletztId ? ' class="neu"' : ""}>${zellen.map((z) => `<td>${sicher(z)}</td>`).join("")}</tr>`;
    });
    ziel.innerHTML = `<table class="tabelle"><thead><tr>${kopf.map((k) => `<th scope="col">${sicher(k)}</th>`).join("")}</tr></thead><tbody>${zeilen.join("")}</tbody></table>`;
  }

  for (const id of ["filter-modus", "filter-geraet", "filter-sprache"]) $(id).addEventListener("change", listeZeigen);
  $("liste-oeffnen").addEventListener("click", () => listeOeffnen(letzteWertung));
  $("liste-zu").addEventListener("click", () => liste.close());
  liste.addEventListener("click", (e) => { if (e.target === liste) liste.close(); }); // Klick neben das Blatt

  /* ============ 8. Einstellungen und Start ============ */

  function beschriften() {
    document.documentElement.lang = einst.sprache;
    document.title = T("titel");
    for (const el of document.querySelectorAll("[data-t]")) el.textContent = T(el.dataset.t);
    for (const el of document.querySelectorAll("[data-t-label]")) el.setAttribute("aria-label", T(el.dataset.tLabel));
    $("satzzeichen").querySelector(".kipp-text").textContent = T(einst.satzzeichen ? "an" : "aus");
    $("ton").querySelector(".kipp-text").textContent = T(einst.ton ? "an" : "aus");
    startHinweis();
    rangLeisteZeigen();
  }

  function knoepfeAbgleichen() {
    const paare = [["sprache", "data-sprache"], ["belegung", "data-belegung"], ["modus", "data-modus"], ["dauer", "data-dauer"], ["art", "data-art"]];
    for (const [feld, attr] of paare) {
      for (const b of document.querySelectorAll("[" + attr + "]")) {
        b.setAttribute("aria-pressed", String(b.getAttribute(attr) === String(einst[feld])));
      }
    }
    $("satzzeichen").setAttribute("aria-pressed", String(einst.satzzeichen));
    $("ton").setAttribute("aria-pressed", String(einst.ton));
    const ueberleben = einst.modus === "ueberleben";
    $("gruppe-dauer").hidden = ueberleben;
    for (const b of document.querySelectorAll("[data-art]")) b.disabled = ueberleben;
    $("gruppe-art").title = ueberleben ? T("nurWoerter") : "";
  }

  // Ein Klick auf eine Einstellung: Wert merken, Knöpfe abgleichen.
  // Mit der Maus geklickte Knöpfe verlieren danach den Fokus, damit die
  // nächste Leertaste ins Spiel geht und nicht den Knopf noch einmal drückt.
  function einstellung(attr, feld, umwandeln, danach) {
    for (const b of document.querySelectorAll("[" + attr + "]")) {
      b.addEventListener("click", (e) => {
        einst[feld] = umwandeln ? umwandeln(b.getAttribute(attr)) : b.getAttribute(attr);
        speichern();
        knoepfeAbgleichen();
        if (danach) danach();
        if (e.detail > 0) b.blur();
      });
    }
  }

  einstellung("data-sprache", "sprache", null, () => { beschriften(); neuerLauf(); });
  einstellung("data-belegung", "belegung", null, () => {
    maschine.bauen(einst.belegung);
    if (ergebnisOffen) maschine.hitze(lauf.tastenFehler); else markieren();
  });
  einstellung("data-modus", "modus", null, neuerLauf);
  einstellung("data-dauer", "dauer", Number, neuerLauf);
  einstellung("data-art", "art", null, neuerLauf);

  $("satzzeichen").addEventListener("click", (e) => {
    einst.satzzeichen = !einst.satzzeichen;
    speichern(); knoepfeAbgleichen(); beschriften(); neuerLauf();
    if (e.detail > 0) e.currentTarget.blur();
  });
  $("ton").addEventListener("click", (e) => {
    einst.ton = !einst.ton;
    Ton.an = einst.ton;
    speichern(); knoepfeAbgleichen(); beschriften();
    if (einst.ton) Ton.klack();   // Der Klick ist die erlaubte erste Berührung.
    if (e.detail > 0) e.currentTarget.blur();
  });
  $("neustart").addEventListener("click", (e) => { neuerLauf(); if (e.detail > 0) e.currentTarget.blur(); });

  // Auf dem Computer: Klick aufs Papier holt den Fokus zurück ins Spiel.
  fenster.addEventListener("click", () => {
    if (istHandy) return;
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  });

  // Start
  Ton.an = einst.ton;
  knoepfeAbgleichen();
  beschriften();
  neuerLauf();
  if (!Speicher.ok) meldung(T("speicherAus"));
})();

// Falls trotzdem etwas schiefgeht: eine Meldung statt einer stummen Seite.
window.addEventListener("error", () => {
  const el = document.getElementById("meldung");
  if (!el) return;
  el.textContent = "Something went wrong. Reload the page. / Etwas ist schiefgelaufen. Lade die Seite neu.";
  el.classList.add("zeigen");
});
