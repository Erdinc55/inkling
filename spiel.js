/*
  spiel.js
  --------
  Ein "Lauf" ist ein einzelner Versuch: vom ersten Anschlag bis die Zeit
  um ist (Zeitlauf) oder die Tinte leer ist (Überleben).

  Auch diese Datei weiß nichts von der Seite. Sie bekommt Zeichen und
  Zeitpunkte und antwortet, was passiert ist (richtig, falsch, Zeilenende).
  app.js entscheidet dann, wie das aussieht und klingt.
  Dadurch kann man das Spiel ohne Browser testen und durchrechnen.
*/

// Startwerte für Überleben. Hier dreht man, wenn es zu leicht oder zu
// schwer ist. Siehe test-spiel.js, dort wird ein Tipper simuliert.
const UEBERLEBEN = {
  maxTinte: 12,          // Sekunden, bis der volle Balken leer ist
  proBuchstabe: 0.45,    // Sekunden Tinte pro Buchstabe eines richtigen Worts
  fehlerKosten: 1,       // Sekunden Abzug pro Fehler
  woerterProLevel: 10,
  schnellerProLevel: 0.12 // Level 2 leert 12 % schneller als Level 1 usw.
};

// Wie viele falsche Zeichen man "übertippen" kann, bevor es hakt.
// Wie bei einer echten Maschine: Falsches steht da, bis man es wegnimmt.
const MAX_FALSCH = 6;

// Satzzeichen, die bei "Satzzeichen aus" verschwinden.
const SATZZEICHEN = /[.,;:!?'"()\-]/g;

function ohneSatzzeichen(text) {
  return text.replace(SATZZEICHEN, "").replace(/\s+/g, " ").trim();
}

/*
  Textquelle: liefert Zeile für Zeile.
  Sie merkt sich die letzten Zeilen, damit nicht zweimal hintereinander
  dasselbe Sprichwort kommt.
*/
class Textquelle {
  constructor(texte, art, optionen) {
    this.texte = texte;
    this.art = art;
    this.zufall = (optionen && optionen.zufall) || Math.random;
    this.zeilenLaenge = (optionen && optionen.zeilenLaenge) || 44;
    this.satzzeichen = !(optionen && optionen.satzzeichen === false);
    this.zuletzt = [];
  }

  wahl(liste) {
    return liste[Math.floor(this.zufall() * liste.length)];
  }

  // Eine Zeile aus mehreren Wörtern bauen. "level" macht die Wörter im
  // Überleben-Modus länger (Level 1: 3-6 Buchstaben, dann je +1).
  woerterZeile(level) {
    let auswahl = this.texte.woerter;
    if (level) {
      const min = Math.min(3 + (level - 1), 9);
      const max = min + 4;
      const passend = auswahl.filter((w) => w.length >= min && w.length <= max);
      // Zu wenige passende Wörter? Dann lieber alle nehmen als hängen.
      if (passend.length >= 15) auswahl = passend;
    }
    const woerter = [];
    let laenge = 0;
    let versuche = 0;
    while (versuche++ < 200) {
      const w = this.wahl(auswahl);
      if (woerter.includes(w) || this.zuletzt.includes(w)) continue;
      const neu = laenge + (woerter.length ? 1 : 0) + w.length;
      if (woerter.length && neu > this.zeilenLaenge) break;
      woerter.push(w);
      laenge = neu;
    }
    this.merken(woerter);
    return { text: woerter.join(" "), autor: null };
  }

  ganzeZeile() {
    let art = this.art;
    if (art === "gemischt") {
      art = this.wahl(["sprichwoerter", "zitate", "saetze"]);
    }
    const liste = this.texte[art];
    let eintrag;
    for (let i = 0; i < 30; i++) {
      eintrag = this.wahl(liste);
      const text = typeof eintrag === "string" ? eintrag : eintrag.text;
      if (!this.zuletzt.includes(text)) break;
    }
    const text = typeof eintrag === "string" ? eintrag : eintrag.text;
    this.merken([text]);
    return { text, autor: typeof eintrag === "string" ? null : eintrag.autor };
  }

  merken(dinge) {
    this.zuletzt.push(...dinge);
    if (this.zuletzt.length > 40) this.zuletzt.splice(0, this.zuletzt.length - 40);
  }

  naechste(level) {
    const zeile = this.art === "woerter" ? this.woerterZeile(level) : this.ganzeZeile();
    if (!this.satzzeichen) zeile.text = ohneSatzzeichen(zeile.text);
    return zeile;
  }
}

/*
  Ein Lauf.
  modus: "zeit" oder "ueberleben"
  dauer: Sekunden (nur Zeitlauf)
*/
class Lauf {
  constructor(einstellung) {
    this.modus = einstellung.modus;
    this.dauer = einstellung.dauer || 60;
    this.quelle = new Textquelle(
      einstellung.texte,
      this.modus === "ueberleben" ? "woerter" : einstellung.art,
      einstellung
    );

    this.fertigeZeilen = [];    // schon getippte Zeilen
    this.level = 1;
    this.zeile = this.quelle.naechste(this.modus === "ueberleben" ? 1 : 0);
    this.vorschau = this.quelle.naechste(this.modus === "ueberleben" ? 1 : 0);
    this.pos = 0;               // so viele Zeichen der Zeile sind richtig
    this.falsch = [];           // falsch getippte Zeichen, die noch dastehen
    this.wortStart = 0;

    this.richtige = 0;
    this.alle = 0;
    this.anschlaege = [];       // { t, richtig } für das Diagramm
    this.tastenFehler = {};     // erwartetes Zeichen -> Anzahl Fehler

    this.startZeit = null;
    this.letzterTick = null;
    this.endZeit = null;
    this.beendet = false;
    this.grund = null;

    // Überleben
    this.tinte = UEBERLEBEN.maxTinte;
    this.woerter = 0;
  }

  get gestartet() { return this.startZeit !== null; }

  erwartet() {
    return this.zeile.text[this.pos];
  }

  // Wie viele Sekunden zählen für die Rechnung?
  sekunden(jetzt) {
    if (!this.gestartet) return 0;
    const ende = this.endZeit !== null ? this.endZeit : jetzt;
    let s = (ende - this.startZeit) / 1000;
    if (this.modus === "zeit") s = Math.min(s, this.dauer);
    return Math.max(0, s);
  }

  restzeit(jetzt) {
    if (!this.gestartet) return this.dauer;
    return Math.max(0, this.dauer - this.sekunden(jetzt));
  }

  // Wie schnell die Tinte im aktuellen Level verschwindet (Sekunden pro Sekunde).
  tintenVerbrauch() {
    return 1 + UEBERLEBEN.schnellerProLevel * (this.level - 1);
  }

  /*
    Ein Zeichen wurde getippt.
    Rückgabe: { typ: "richtig" | "falsch" | "ignoriert", zeilenEnde, wortFertig, levelAuf, erwartet }
  */
  tippe(zeichen, jetzt) {
    if (this.beendet) return { typ: "ignoriert" };
    if (!this.gestartet) {
      this.startZeit = jetzt;
      this.letzterTick = jetzt;
    }
    // Vor dem Verbuchen kurz die Zeit nachziehen, damit eine abgelaufene
    // Uhr nicht noch einen Anschlag durchlässt.
    this.aktualisieren(jetzt);
    if (this.beendet) return { typ: "ignoriert" };

    const erwartet = this.erwartet();
    const t = jetzt - this.startZeit;
    this.alle++;

    // Es steht schon etwas Falsches da: jeder weitere Anschlag ist auch falsch,
    // bis man mit der Rücktaste aufräumt.
    if (this.falsch.length > 0 || zeichen !== erwartet) {
      const platz = this.zeile.text.length - this.pos;
      if (this.falsch.length < Math.min(MAX_FALSCH, platz)) this.falsch.push(zeichen);
      this.anschlaege.push({ t, richtig: false });
      this.tastenFehler[erwartet] = (this.tastenFehler[erwartet] || 0) + 1;
      // Nur der erste Fehler einer Reihe kostet Tinte, sonst wäre man nach
      // einem Vertipper mit drei Folgefehlern sofort tot.
      if (this.modus === "ueberleben" && this.falsch.length === 1) {
        this.tinte = Math.max(0, this.tinte - UEBERLEBEN.fehlerKosten);
        if (this.tinte <= 0) this.beenden("tinte", jetzt);
      }
      return { typ: "falsch", erwartet };
    }

    // Richtig
    this.richtige++;
    this.pos++;
    this.anschlaege.push({ t, richtig: true });
    const ergebnis = { typ: "richtig", erwartet, zeilenEnde: false, wortFertig: false, levelAuf: false };

    const zeilenEnde = this.pos >= this.zeile.text.length;
    if (zeichen === " " || zeilenEnde) {
      const ende = zeichen === " " ? this.pos - 1 : this.pos;
      const laenge = ende - this.wortStart;
      this.wortStart = this.pos;
      if (laenge > 0) {
        ergebnis.wortFertig = true;
        if (this.modus === "ueberleben") {
          this.woerter++;
          this.tinte = Math.min(UEBERLEBEN.maxTinte, this.tinte + laenge * UEBERLEBEN.proBuchstabe);
          const neuesLevel = 1 + Math.floor(this.woerter / UEBERLEBEN.woerterProLevel);
          if (neuesLevel > this.level) {
            this.level = neuesLevel;
            ergebnis.levelAuf = true;
          }
        }
      }
    }

    if (zeilenEnde) {
      this.fertigeZeilen.push(this.zeile);
      this.zeile = this.vorschau;
      this.vorschau = this.quelle.naechste(this.modus === "ueberleben" ? this.level : 0);
      this.pos = 0;
      this.wortStart = 0;
      ergebnis.zeilenEnde = true;
    }
    return ergebnis;
  }

  // Rücktaste: nimmt nur Falsches weg. Richtig Getipptes steht wie auf
  // Papier, das kann man nicht mehr ändern.
  loeschen() {
    if (this.beendet || this.falsch.length === 0) return false;
    this.falsch.pop();
    return true;
  }

  // Wird regelmäßig aufgerufen (ca. 60-mal pro Sekunde).
  // Gibt true zurück, wenn der Lauf gerade zu Ende gegangen ist.
  aktualisieren(jetzt) {
    if (this.beendet || !this.gestartet) return false;
    if (this.modus === "zeit") {
      if ((jetzt - this.startZeit) / 1000 >= this.dauer) {
        this.beenden("zeit", this.startZeit + this.dauer * 1000);
        return true;
      }
    } else {
      const dt = (jetzt - this.letzterTick) / 1000;
      this.tinte -= dt * this.tintenVerbrauch();
      if (this.tinte <= 0) {
        this.tinte = 0;
        this.beenden("tinte", jetzt);
        return true;
      }
    }
    this.letzterTick = jetzt;
    return false;
  }

  beenden(grund, wann) {
    this.beendet = true;
    this.grund = grund;
    this.endZeit = wann;
  }

  // Alle Zahlen auf einmal, für Anzeige und Speicher.
  werte(jetzt) {
    const s = this.sekunden(jetzt);
    return {
      sekunden: s,
      netto: Messung.nettoWpm(this.richtige, s),
      brutto: Messung.bruttoWpm(this.alle, s),
      genauigkeit: Messung.genauigkeit(this.richtige, this.alle),
      richtige: this.richtige,
      alle: this.alle,
      level: this.level,
      woerter: this.woerter
    };
  }

  // Alle Zitate, die in diesem Lauf (auch angefangen) vorkamen.
  zitate() {
    const alle = this.fertigeZeilen.concat(this.pos > 0 ? [this.zeile] : []);
    return alle.filter((z) => z.autor);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { Lauf, Textquelle, ohneSatzzeichen, UEBERLEBEN };
}
