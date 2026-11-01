const Messung = (function () {

  const ZEICHEN_PRO_WORT = 5;

  const MIN_GENAUIGKEIT = 90;

  const RAENGE = [
    { name: "Iron",      ab: 0 },
    { name: "Bronze",    ab: 20 },
    { name: "Silver",    ab: 35 },
    { name: "Gold",      ab: 50 },
    { name: "Platinum",  ab: 65 },
    { name: "Diamond",   ab: 80 },
    { name: "Inkmaster", ab: 100 }
  ];

  function minutenAus(sekunden) {
    if (!Number.isFinite(sekunden) || sekunden <= 0) return 0;
    return sekunden / 60;
  }

  function nettoWpm(richtige, sekunden) {
    const min = minutenAus(sekunden);
    if (min === 0) return 0;
    return (richtige / ZEICHEN_PRO_WORT) / min;
  }

  function bruttoWpm(alle, sekunden) {
    const min = minutenAus(sekunden);
    if (min === 0) return 0;
    return (alle / ZEICHEN_PRO_WORT) / min;
  }

  function genauigkeit(richtige, alle) {
    if (alle <= 0) return 100;
    return (richtige / alle) * 100;
  }

  function runden(wert, stellen) {
    const f = Math.pow(10, stellen || 0);
    return Math.round(wert * f) / f;
  }

  function rangIndex(wpm) {
    let index = 0;
    for (let i = 0; i < RAENGE.length; i++) {
      if (wpm >= RAENGE[i].ab) index = i;
    }
    return index;
  }

  function zaehltFuerRang(gen) {
    return gen >= MIN_GENAUIGKEIT;
  }

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
      const laenge = (bis - von) / 1000;
      punkte.push({ sek: s, wpm: nettoWpm(richtige, laenge) });
    }
    return punkte;
  }

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

if (typeof module !== "undefined" && module.exports) {
  module.exports = Messung;
}
