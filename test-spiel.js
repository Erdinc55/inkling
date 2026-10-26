const fs = require("fs");
const vm = require("vm");

const ctx = { console };
vm.createContext(ctx);
for (const d of ["messung.js", "texte-de.js", "texte-en.js", "spiel.js"]) {
  vm.runInContext(fs.readFileSync(__dirname + "/" + d, "utf8").replace(/^const (\w+) =/m, "var $1 ="), ctx);
}
vm.runInContext("var _T = {Lauf, UEBERLEBEN, TEXTE_DE, TEXTE_EN, ohneSatzzeichen}", ctx);
const { Lauf, UEBERLEBEN, TEXTE_DE, TEXTE_EN, ohneSatzzeichen } = ctx._T;

let fehler = 0;
function wahr(name, wert) {
  if (!wert) fehler++;
  console.log((wert ? "ok    " : "FALSCH") + "  " + name);
}

const l = new Lauf({ modus: "zeit", dauer: 30, art: "saetze", texte: TEXTE_DE });
l.zeile = { text: "Ab c", autor: null };
l.tippe("A", 0);
l.tippe("x", 100);          
l.tippe("y", 200);           
wahr("zwei falsche Zeichen stehen da", l.falsch.length === 2);
wahr("Fehler zählen beim erwarteten Zeichen 'b'", l.tastenFehler["b"] === 2);
l.tippe("b", 250);          
wahr("richtiges Zeichen hilft nicht, solange Fehler dastehen", l.pos === 1);
l.loeschen(); l.loeschen(); l.loeschen();
wahr("Rücktaste löscht nur Fehler, nicht Richtiges", l.falsch.length === 0 && l.pos === 1);
l.tippe("b", 300); l.tippe(" ", 400);
const r = l.tippe("c", 500);
wahr("Zeilenende erkannt", r.zeilenEnde === true);
wahr("Anschläge: 4 richtig von 7", l.richtige === 4 && l.alle === 7);

const z = new Lauf({ modus: "zeit", dauer: 30, art: "woerter", texte: TEXTE_EN });
wahr("vor dem ersten Anschlag läuft nichts", z.restzeit(99999) === 30);
z.tippe(z.erwartet(), 1000);
z.aktualisieren(31000);
wahr("nach 30 s ist Schluss", z.beendet && z.grund === "zeit");
wahr("gezählte Zeit genau 30 s", z.sekunden(50000) === 30);
wahr("nach Ablauf wird nichts mehr gezählt", z.tippe("x", 31500).typ === "ignoriert");

wahr("Satzzeichen weg: \"Don't cry, ok?\" -> \"Dont cry ok\"", ohneSatzzeichen("Don't cry, ok?") === "Dont cry ok");
const s = new Lauf({ modus: "zeit", art: "saetze", texte: TEXTE_DE, satzzeichen: false });
wahr("Zeile ohne Satzzeichen: " + s.zeile.text, !/[.,;:!?'"]/.test(s.zeile.text));

const g = new Lauf({ modus: "zeit", art: "gemischt", texte: TEXTE_DE });
let alleZeilen = true;
for (let i = 0; i < 50; i++) {
  const zl = g.quelle.naechste(0);
  if (TEXTE_DE.woerter.includes(zl.text)) alleZeilen = false;
}
wahr("Gemischt liefert keine Einzelwörter", alleZeilen);

function simuliere(wpm, fehlerAlle) {
  const lauf = new Lauf({ modus: "ueberleben", texte: TEXTE_EN, zufall: mulberry(7) });
  const proZeichen = 60000 / (wpm * 5);
  let t = 0, n = 0;
  while (!lauf.beendet && t < 15 * 60000) {
    n++;
    if (fehlerAlle && n % fehlerAlle === 0) {
      lauf.tippe("#", t); t += proZeichen;
      lauf.loeschen(); t += proZeichen;
    }
    lauf.tippe(lauf.erwartet(), t);
    t += proZeichen;
    lauf.aktualisieren(t);
  }
  return { sek: Math.round(t / 1000), level: lauf.level, woerter: lauf.woerter };
}
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

console.log("\nÜberleben, simuliert (Startwerte: " + JSON.stringify(UEBERLEBEN) + ")");
for (const [wpm, f] of [[25, 0], [35, 0], [45, 0], [45, 25], [60, 0], [60, 25], [80, 30], [100, 40]]) {
  const e = simuliere(wpm, f);
  console.log("  " + wpm + " WPM" + (f ? ", Fehler alle " + f + " Zeichen" : ", fehlerfrei") +
    ": " + e.sek + " s, Level " + e.level + ", " + e.woerter + " Wörter");
}
const langsam = simuliere(25, 0), schnell = simuliere(80, 30);
wahr("25 WPM hält nicht lange (unter 90 s)", langsam.sek < 90);
wahr("schneller Tipper kommt deutlich weiter", schnell.level > langsam.level + 2);

console.log(fehler === 0 ? "\nAlle Tests bestanden." : "\n" + fehler + " Test(s) fehlgeschlagen.");
process.exit(fehler ? 1 : 0);
