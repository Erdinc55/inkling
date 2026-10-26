/*
  messung.js
  ----------
  Alle Rechnungen von Inkling an einem Ort: Geschwindigkeit, Genauigkeit,
  Rang, Fortschritt bis zum nächsten Rang und der Verlauf für das Diagramm.

  Warum eine eigene Datei?
  Diese Datei weiß nichts von der Seite (kein document, kein window).
  Dadurch kann man sie ohne Browser testen, zum Beispiel mit Node:
      node test-messung.js
  Wenn hier eine Zahl falsch ist, sieht man es sofort im Test und muss
  nicht erst hundert Mal tippen.
*/

const Messung = (function () {

  // Fünf Anschläge zählen als ein "Wort". Das ist die übliche Regel bei
  // Tipptests, damit lange und kurze Wörter fair verglichen werden.
  const ZEICHEN_PRO_WORT = 5;

  // Unter dieser Genauigkeit zählt ein Lauf nicht für den Rang.
  // Sonst könnte man einfach wild auf die Tasten hauen.
  const MIN_GENAUIGKEIT = 90;

  // Die Ränge, von unten nach oben. "ab" ist die Netto-WPM, ab der er gilt.
  // Die Namen bleiben in jeder Sprache englisch.
  const RAENGE = [
    { name: "Iron",      ab: 0 },
    { name: "Bronze",    ab: 20 },
    { name: "Silver",    ab: 35 },
    { name: "Gold",      ab: 50 },
    { name: "Platinum",  ab: 65 },
    { name: "Diamond",   ab: 80 },
    { name: "Inkmaster", ab: 100 }
  ];

  // Schutz gegen Teilen durch null und gegen Unsinn wie negative Zeiten.
  function minutenAus(sekunden) {
    if (!Number.isFinite(sekunden) || sekunden <= 0) return 0;
    return sekunden / 60;
  }

  // Netto-WPM: nur richtige Anschläge zählen.
  function nettoWpm(richtige, sekunden) {
    const min = minutenAus(sekunden);
    if (min === 0) return 0;
    return (richtige / ZEICHEN_PRO_WORT) / min;
  }

  // Brutto-WPM: alle Anschläge, auch die falschen.
  function bruttoWpm(alle, sekunden) {
    const min = minutenAus(sekunden);
    if (min === 0) return 0;
    return (alle / ZEICHEN_PRO_WORT) / min;
  }

  // Genauigkeit in Prozent. Wer noch nichts getippt hat, hat auch
  // keinen Fehler gemacht, deshalb 100 statt 0.
  function genauigkeit(richtige, alle) {
    if (alle <= 0) return 100;
    return (richtige / alle) * 100;
  }

  // Auf n Stellen runden, für die Anzeige.
  function runden(wert, stellen) {
    const f = Math.pow(10, stellen || 0);
    return Math.round(wert * f) / f;
  }

  // Index des Rangs zu einer WPM-Zahl (0 = Iron).
  function rangIndex(wpm) {
    let index = 0;
    for (let i = 0; i < RAENGE.length; i++) {
      if (wpm >= RAENGE[i].ab) index = i;
    }
    return index;
  }

  // Zählt dieser Lauf für den Rang? Nur bei genug Genauigkeit.
  function zaehltFuerRang(gen) {
    return gen >= MIN_GENAUIGKEIT;
  }

  // Wie weit ist man auf dem Weg zum nächsten Rang?
  // Liefert den aktuellen Rang, den nächsten (oder null ganz oben),
  // den Fortschritt in Prozent und die fehlenden WPM.
  function fortschritt(besteWpm) {
    const i = rangIndex(besteWpm);
    const jetzt = RAENGE[i];
    const naechster = RAENGE[i + 1] || null;
    if (!naechster) {
      return { rang: jetzt, naechster: null, prozent: 100, fehlend: 0 };
    }
    const spanne = naechster.ab - jetzt.ab;
    const geschafft = besteWpm - jetzt.ab;
    return {
      rang: jetzt,
      naechster: naechster,
      prozent: Math.max(0, Math.min(100, (geschafft / spanne) * 100)),
      fehlend: Math.max(0, naechster.ab - besteWpm)
    };
  }

  /*
    Verlauf für das Diagramm.
    anschlaege: Liste von { t: Millisekunden seit Start, richtig: true/false }
    dauerSek:   wie lange der Lauf ging
    fenster:    über wie viele Sekunden gemittelt wird

    Warum ein gleitendes Fenster? Wenn man nur die letzte Sekunde nimmt,
    springt die Kurve wild zwischen 0 und 120 hin und her. Über 5 Sekunden
    gemittelt sieht man, wann man wirklich schneller oder langsamer wurde.
  */
  function verlauf(anschlaege, dauerSek, fenster) {
    const breite = fenster || 5;
    const punkte = [];
    const sekunden = Math.max(1, Math.ceil(dauerSek));
    for (let s = 1; s <= sekunden; s++) {
      const bis = Math.min(s, dauerSek) * 1000;
      const von = Math.max(0, bis - breite * 1000);
      let richtige = 0;
      for (const a of anschlaege) {
        if (a.richtig && a.t > von && a.t <= bis) richtige++;
      }
      // Am Anfang ist das Fenster noch kürzer als 5 Sekunden.
      const laenge = (bis - von) / 1000;
      punkte.push({ sek: s, wpm: nettoWpm(richtige, laenge) });
    }
    return punkte;
  }

  // Für die rote Markierung der Tasten: 0 (kaum) bis 1 (am häufigsten).
  // Wurzel statt linear, damit auch eine Taste mit einem einzigen Fehler
  // noch sichtbar rot wird, wenn eine andere zehn Fehler hat.
  function fehlerStaerke(anzahl, maximum) {
    if (anzahl <= 0 || maximum <= 0) return 0;
    return Math.sqrt(anzahl / maximum);
  }

  return {
    ZEICHEN_PRO_WORT, MIN_GENAUIGKEIT, RAENGE,
    nettoWpm, bruttoWpm, genauigkeit, runden,
    rangIndex, zaehltFuerRang, fortschritt, verlauf, fehlerStaerke
  };
})();

// Damit Node die Datei im Test laden kann. Im Browser passiert hier nichts.
if (typeof module !== "undefined" && module.exports) {
  module.exports = Messung;
}
