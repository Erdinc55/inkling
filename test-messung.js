const fs = require("fs");
const vm = require("vm");
const M = require("./messung.js");

let fehler = 0;
function gleich(name, ist, soll) {
  const ok = Math.abs(ist - soll) < 0.01;
  if (!ok) fehler++;
  console.log((ok ? "ok    " : "FALSCH") + "  " + name + ": " + M.runden(ist, 2) + " (erwartet " + soll + ")");
}
function wahr(name, wert) {
  if (!wert) fehler++;
  console.log((wert ? "ok    " : "FALSCH") + "  " + name);
}

console.log("--- Messung ---");
gleich("300 richtige in 60 s = Netto-WPM", M.nettoWpm(300, 60), 60);
gleich("400 richtige in 90 s = Netto-WPM", M.nettoWpm(400, 90), 53.33);
gleich("450 Anschläge in 90 s = Brutto-WPM", M.bruttoWpm(450, 90), 60);
gleich("400 von 450 = Genauigkeit %", M.genauigkeit(400, 450), 88.89);
gleich("125 richtige in 30 s = Netto-WPM", M.nettoWpm(125, 30), 50);
gleich("0 Sekunden ergibt 0 statt Fehler", M.nettoWpm(50, 0), 0);
gleich("nichts getippt = 100 %", M.genauigkeit(0, 0), 100);

console.log("--- Ränge ---");
const R = (w) => M.RAENGE[M.rangIndex(w)].name;
wahr("19.9 WPM = Iron", R(19.9) === "Iron");
wahr("20 WPM = Bronze", R(20) === "Bronze");
wahr("49.9 WPM = Silver", R(49.9) === "Silver");
wahr("64 WPM = Gold", R(64) === "Gold");
wahr("79 WPM = Platinum", R(79) === "Platinum");
wahr("99 WPM = Diamond", R(99) === "Diamond");
wahr("100 WPM = Inkmaster", R(100) === "Inkmaster");
wahr("89.9 % zählt nicht", !M.zaehltFuerRang(89.9));
wahr("90 % zählt", M.zaehltFuerRang(90));
const f = M.fortschritt(42);
gleich("42 WPM: Fortschritt Silver -> Gold in %", f.prozent, 46.67);
gleich("42 WPM: fehlend bis Gold", f.fehlend, 8);
wahr("Inkmaster hat keinen nächsten Rang", M.fortschritt(130).naechster === null);

console.log("--- Verlauf ---");
const a = [];
for (let i = 1; i <= 50; i++) a.push({ t: i * 200, richtig: true });
const v = M.verlauf(a, 10, 5);
wahr("10 Punkte für 10 Sekunden", v.length === 10);
gleich("gleichmäßiges Tippen: Sekunde 10", v[9].wpm, 60);
gleich("gleichmäßiges Tippen: Sekunde 2", v[1].wpm, 60);
gleich("Fehlerstärke 1 von 9", M.fehlerStaerke(1, 9), 0.33);

console.log("--- Texte ---");
function laden(datei, name) {
  const code = fs.readFileSync(datei, "utf8") + "\n;" + name;
  return vm.runInNewContext(code, {});
}
const verboten = /[‘’‚“”„–—…«»]/;
for (const [datei, name] of [["texte-de.js", "TEXTE_DE"], ["texte-en.js", "TEXTE_EN"]]) {
  const T = laden(datei, name);
  const w = T.woerter;
  const doppelt = w.filter((x, i) => w.indexOf(x) !== i);
  const zuLang = w.filter((x) => x.length < 3 || x.length > 15);
  console.log(name + ": " + w.length + " Wörter, " + T.sprichwoerter.length + " Sprichwörter, " +
    T.zitate.length + " Zitate, " + T.saetze.length + " Sätze");
  wahr(name + " mindestens 300 Wörter", w.length >= 300);
  wahr(name + " keine doppelten Wörter " + (doppelt.length ? doppelt.join(",") : ""), doppelt.length === 0);
  wahr(name + " alle Wörter 3 bis 15 Buchstaben " + zuLang.join(","), zuLang.length === 0);
  const zeilen = [].concat(T.sprichwoerter, T.saetze, T.zitate.map((z) => z.text), w);
  const schlecht = zeilen.filter((z) => verboten.test(z) || /\s{2}/.test(z) || z !== z.trim());
  wahr(name + " keine untippbaren Zeichen " + schlecht.join(" | "), schlecht.length === 0);
  wahr(name + " jedes Zitat hat einen Autor", T.zitate.every((z) => z.text && z.autor));
  const alleZeilen = [].concat(T.sprichwoerter, T.saetze, T.zitate.map((z) => z.text));
  const dz = alleZeilen.filter((x, i) => alleZeilen.indexOf(x) !== i);
  wahr(name + " keine doppelten Zeilen " + dz.join(" | "), dz.length === 0);
}

console.log(fehler === 0 ? "\nAlle Tests bestanden." : "\n" + fehler + " Test(s) fehlgeschlagen.");
process.exit(fehler === 0 ? 0 : 1);
