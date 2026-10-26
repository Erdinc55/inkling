/*
  texte-de.js  -  alle deutschen Tipptexte

  So fügst du etwas hinzu:
  - Wort:        einfach in die lange Zeichenkette bei "woerter" schreiben,
                 mit einem Leerzeichen getrennt. 3 bis 15 Buchstaben.
  - Sprichwort:  neue Zeile in "sprichwoerter":   "Dein Sprichwort.",
  - Satz:        neue Zeile in "saetze":          "Dein Satz.",
  - Zitat:       neue Zeile in "zitate":
                 { text: "Das Zitat.", autor: "Name" },
                 Nur Zitate, bei denen Wortlaut und Autor sicher stimmen.

  Bitte nur Zeichen, die man auf einer normalen Tastatur tippen kann:
  gerade Anführungszeichen " und ', Bindestrich -, drei Punkte nicht als
  ein Zeichen. Typografische Zeichen wie „ " – ... gehen nicht.
*/

const TEXTE_DE = {

  woerter: (
    "Haus Baum Wasser Fenster Garten Sommer Winter Himmel Straße Brücke Wolke Regen " +
    "Sonne Mond Sterne Feuer Wiese Berg Tal Fluss See Meer Strand Insel Wald Blume " +
    "Blatt Wurzel Apfel Birne Kirsche Brot Butter Käse Milch Kuchen Suppe Tisch Stuhl " +
    "Bett Schrank Lampe Spiegel Teppich Treppe Tür Schlüssel Uhr Kalender Brief Buch " +
    "Zeitung Bleistift Papier Tinte Schreibtisch Computer Tastatur Bildschirm Telefon " +
    "Fahrrad Auto Zug Schiff Flugzeug Bahnhof Hafen Flughafen Reise Urlaub Koffer Karte " +
    "Ziel Weg Pfad Gasse Platz Markt Laden Schule Lehrer Schüler Klasse Aufgabe Antwort " +
    "Frage Gedanke Idee Traum Geheimnis Wahrheit Freiheit Frieden Freude Glück Mut Kraft " +
    "Geduld Ruhe Stille Lärm Musik Lied Klavier Geige Trommel Flöte Gitarre Bühne Theater " +
    "Kino Film Bild Farbe Pinsel Zeichnung Schatten Licht Dunkelheit Morgen Mittag Abend " +
    "Nacht Woche Monat Jahr Stunde Minute Sekunde Frühling Herbst Wetter Wind Sturm " +
    "Gewitter Blitz Donner Nebel Schnee Eis Frost Hitze Kälte Wärme Hund Katze Pferd Kuh " +
    "Schaf Ziege Schwein Huhn Ente Gans Vogel Fisch Frosch Schmetterling Biene Ameise " +
    "Spinne Fuchs Hase Reh Bär Wolf Adler Eule Rabe Taube Möwe Kind Mutter Vater Bruder " +
    "Schwester Großmutter Onkel Tante Freund Nachbar Gast Arzt Bäcker Schneider Maler " +
    "Pilot Kapitän Bauer Förster Tischler Händler Künstler Dichter Forscher Erfinder " +
    "Entdecker Abenteuer Geschichte Märchen Rätsel Spiel Würfel Schach Ball Tor Mannschaft " +
    "Sieg Pause Ferien Fest Geschenk Kerze Zimmer Küche Keller Dach Mauer Turm Schloss " +
    "Burg Kirche Dorf Stadt Land Heimat Fremde Welt Erde Zukunft Vergangenheit Gegenwart " +
    "Anfang Ende Mitte Rand Ecke Kreis Quadrat Linie Punkt Zahl Summe Rechnung Preis Geld " +
    "Münze Tasche Mantel Mütze Schuh Handschuh Schal Hemd Hose Kleid Gürtel Knopf Nadel " +
    "Faden Wolle Seide Leder Glas Stein Sand Lehm Eisen Kupfer Silber Gold Holz Rinde " +
    "Zweig Ast Stamm Eiche Buche Tanne Birke Rose Tulpe Lilie Wunsch Hoffnung Sorge " +
    "Zweifel Erinnerung Gedächtnis Verstand Gefühl Humor Lächeln Flüstern Schweigen " +
    "Gespräch Stimme Ohr Auge Hand Finger Fuß Herz Kopf Schulter Rücken Atem Schlaf " +
    "Hunger Durst Mahlzeit Frühstück Abendbrot Gewürz Salz Pfeffer Zucker Honig Nuss " +
    "Mandel Traube Zitrone Orange Kartoffel Tomate Gurke Zwiebel Karotte Pilz " +
    "schnell langsam leise laut freundlich mutig neugierig gemütlich wunderbar merkwürdig " +
    "plötzlich vorsichtig einfach schwierig lebendig fröhlich müde wach klug dunkel hell " +
    "laufen springen schreiben lesen träumen entdecken erzählen verstehen beginnen " +
    "vergessen erinnern wandern singen tanzen lachen kochen backen bauen fliegen " +
    "schwimmen suchen finden öffnen schließen warten zählen grüßen"
  ).split(" "),

  sprichwoerter: [
    "Aller Anfang ist schwer.",
    "Ende gut, alles gut.",
    "Übung macht den Meister.",
    "Wer rastet, der rostet.",
    "Der Apfel fällt nicht weit vom Stamm.",
    "Morgenstund hat Gold im Mund.",
    "Reden ist Silber, Schweigen ist Gold.",
    "Ohne Fleiß kein Preis.",
    "Wer wagt, gewinnt.",
    "Es ist noch kein Meister vom Himmel gefallen.",
    "Aus den Augen, aus dem Sinn.",
    "Kleinvieh macht auch Mist.",
    "Wer zuletzt lacht, lacht am besten.",
    "Lügen haben kurze Beine.",
    "Was Hänschen nicht lernt, lernt Hans nimmermehr.",
    "Eile mit Weile.",
    "Gut Ding will Weile haben.",
    "Man soll den Tag nicht vor dem Abend loben.",
    "Wer anderen eine Grube gräbt, fällt selbst hinein.",
    "Ein Unglück kommt selten allein.",
    "Der Klügere gibt nach.",
    "Probieren geht über Studieren.",
    "Besser spät als nie.",
    "Alle Wege führen nach Rom.",
    "Steter Tropfen höhlt den Stein.",
    "Jeder ist seines Glückes Schmied.",
    "Not macht erfinderisch.",
    "Neue Besen kehren gut.",
    "Wo gehobelt wird, da fallen Späne.",
    "Der Ton macht die Musik.",
    "Mit Speck fängt man Mäuse.",
    "Zeit ist Geld.",
    "Das Auge isst mit.",
    "Hunger ist der beste Koch.",
    "Liebe geht durch den Magen.",
    "Ein gutes Gewissen ist ein sanftes Ruhekissen.",
    "Wer die Wahl hat, hat die Qual.",
    "Viele Köche verderben den Brei.",
    "Gelegenheit macht Diebe.",
    "Wie man in den Wald hineinruft, so schallt es heraus.",
    "Der frühe Vogel fängt den Wurm.",
    "Gleich und gleich gesellt sich gern.",
    "Gegensätze ziehen sich an.",
    "Aller guten Dinge sind drei.",
    "Kommt Zeit, kommt Rat.",
    "Von nichts kommt nichts.",
    "Der Spatz in der Hand ist besser als die Taube auf dem Dach.",
    "Es ist nicht alles Gold, was glänzt.",
    "Wer den Pfennig nicht ehrt, ist des Talers nicht wert.",
    "Die Katze lässt das Mausen nicht.",
    "Wie du mir, so ich dir.",
    "Ein Bild sagt mehr als tausend Worte.",
    "Stille Wasser sind tief.",
    "Wer suchet, der findet.",
    "Dem Glücklichen schlägt keine Stunde.",
    "Scherben bringen Glück.",
    "Jeder Topf findet seinen Deckel.",
    "Mühsam ernährt sich das Eichhörnchen.",
    "Nach dem Regen kommt Sonnenschein.",
    "Ein voller Bauch studiert nicht gern.",
    "Was lange währt, wird endlich gut.",
    "Alte Liebe rostet nicht.",
    "Wer schön sein will, muss leiden.",
    "Der Mensch denkt, Gott lenkt.",
    "Wenn die Katze aus dem Haus ist, tanzen die Mäuse auf dem Tisch.",
    "Was du heute kannst besorgen, das verschiebe nicht auf morgen.",
    "Keine Rose ohne Dornen.",
    "Hochmut kommt vor dem Fall.",
    "Wer nicht hören will, muss fühlen.",
    "Man lernt nie aus.",
    "Wo ein Wille ist, ist auch ein Weg.",
    "Jeder Tag hat seine Plage.",
    "Sich regen bringt Segen.",
    "Dummheit schützt vor Strafe nicht.",
    "Übermut tut selten gut.",
    "In der Kürze liegt die Würze.",
    "Das letzte Hemd hat keine Taschen.",
    "Man soll das Eisen schmieden, solange es heiß ist.",
    "Rom wurde auch nicht an einem Tag erbaut.",
    "Kinder und Narren sagen die Wahrheit.",
    "Hunde, die bellen, beißen nicht.",
    "Die Hoffnung stirbt zuletzt.",
    "Pech im Spiel, Glück in der Liebe.",
    "Wer A sagt, muss auch B sagen.",
    "Lachen ist die beste Medizin.",
    "Der Krug geht so lange zum Brunnen, bis er bricht.",
    "Ehrlich währt am längsten.",
    "Kleider machen Leute.",
    "Was ich nicht weiß, macht mich nicht heiß.",
    "Geteiltes Leid ist halbes Leid.",
    "Geteilte Freude ist doppelte Freude.",
    "Einem geschenkten Gaul schaut man nicht ins Maul.",
    "Wer im Glashaus sitzt, sollte nicht mit Steinen werfen.",
    "Morgen, morgen, nur nicht heute, sagen alle faulen Leute.",
    "Ordnung ist das halbe Leben.",
    "Wissen ist Macht.",
    "Vorsicht ist die Mutter der Porzellankiste.",
    "Kein Rauch ohne Feuer.",
    "Auf Regen folgt Sonne.",
    "Wer nicht wagt, der nicht gewinnt."
  ],

  // Nur Autoren, die lange tot sind, und nur gesicherter Wortlaut.
  zitate: [
    { text: "Es irrt der Mensch, solang er strebt.", autor: "Goethe" },
    { text: "Zwei Seelen wohnen, ach! in meiner Brust.", autor: "Goethe" },
    { text: "Edel sei der Mensch, hilfreich und gut!", autor: "Goethe" },
    { text: "Wo viel Licht ist, ist starker Schatten.", autor: "Goethe" },
    { text: "Was du ererbt von deinen Vätern hast, erwirb es, um es zu besitzen.", autor: "Goethe" },
    { text: "Grau, teurer Freund, ist alle Theorie, und grün des Lebens goldner Baum.", autor: "Goethe" },
    { text: "Gefühl ist alles; Name ist Schall und Rauch.", autor: "Goethe" },
    { text: "Das also war des Pudels Kern!", autor: "Goethe" },
    { text: "Du glaubst zu schieben, und du wirst geschoben.", autor: "Goethe" },
    { text: "Alles Gescheite ist schon gedacht worden; man muss nur versuchen, es noch einmal zu denken.", autor: "Goethe" },
    { text: "Der Mensch spielt nur, wo er in voller Bedeutung des Worts Mensch ist, und er ist nur da ganz Mensch, wo er spielt.", autor: "Schiller" },
    { text: "Der Starke ist am mächtigsten allein.", autor: "Schiller" },
    { text: "Die Axt im Haus erspart den Zimmermann.", autor: "Schiller" },
    { text: "Seid umschlungen, Millionen!", autor: "Schiller" },
    { text: "Freude, schöner Götterfunken, Tochter aus Elysium.", autor: "Schiller" },
    { text: "Es ist der Geist, der sich den Körper baut.", autor: "Schiller" },
    { text: "Kein Mensch muss müssen.", autor: "Lessing" },
    { text: "Habe Mut, dich deines eigenen Verstandes zu bedienen!", autor: "Kant" },
    { text: "Der bestirnte Himmel über mir und das moralische Gesetz in mir.", autor: "Kant" },
    { text: "Handle nur nach derjenigen Maxime, durch die du zugleich wollen kannst, dass sie ein allgemeines Gesetz werde.", autor: "Kant" },
    { text: "Was mich nicht umbringt, macht mich stärker.", autor: "Nietzsche" },
    { text: "Ohne Musik wäre das Leben ein Irrtum.", autor: "Nietzsche" },
    { text: "Wo aber Gefahr ist, wächst das Rettende auch.", autor: "Hölderlin" },
    { text: "Dort, wo man Bücher verbrennt, verbrennt man auch am Ende Menschen.", autor: "Heine" },
    { text: "Vater werden ist nicht schwer, Vater sein dagegen sehr.", autor: "Wilhelm Busch" },
    { text: "Wer durch des Argwohns Brille schaut, sieht Raupen selbst im Sauerkraut.", autor: "Wilhelm Busch" },
    { text: "Stets findet Überraschung statt, da, wo man's nicht erwartet hat.", autor: "Wilhelm Busch" },
    { text: "Der Mond ist aufgegangen, die goldnen Sternlein prangen am Himmel hell und klar.", autor: "Matthias Claudius" },
    { text: "Schläft ein Lied in allen Dingen, die da träumen fort und fort.", autor: "Eichendorff" },
    { text: "Und die Welt hebt an zu singen, triffst du nur das Zauberwort.", autor: "Eichendorff" },
    { text: "Getretner Quark wird breit, nicht stark.", autor: "Goethe" },
    { text: "Die Botschaft hör ich wohl, allein mir fehlt der Glaube.", autor: "Goethe" },
    { text: "Wer immer strebend sich bemüht, den können wir erlösen.", autor: "Goethe" },
    { text: "Dass ich erkenne, was die Welt im Innersten zusammenhält.", autor: "Goethe" },
    { text: "Drum prüfe, wer sich ewig bindet, ob sich das Herz zum Herzen findet!", autor: "Schiller" },
    { text: "Der Wahn ist kurz, die Reu ist lang.", autor: "Schiller" },
    { text: "Früh übt sich, was ein Meister werden will.", autor: "Schiller" },
    { text: "Ein Teil von jener Kraft, die stets das Böse will und stets das Gute schafft.", autor: "Goethe" },
    { text: "Denk ich an Deutschland in der Nacht, dann bin ich um den Schlaf gebracht.", autor: "Heine" },
    { text: "Ich weiß nicht, was soll es bedeuten, dass ich so traurig bin.", autor: "Heine" }
  ],

  saetze: [
    "Der Fuchs springt über den alten Zaun.",
    "Heute scheint die Sonne, und der Himmel ist klar.",
    "Meine Katze schläft am liebsten auf dem warmen Fensterbrett.",
    "Im Herbst fallen die bunten Blätter von den Bäumen.",
    "Kannst du mir bitte das Salz reichen?",
    "Wir fahren morgen mit dem Zug nach Hamburg.",
    "Das Brot duftet frisch und knusprig.",
    "Ein kleiner Vogel sitzt auf dem Ast und singt.",
    "Ich lese gern abends ein spannendes Buch.",
    "Die Kinder spielen im Garten und lachen laut.",
    "Zwölf Boxkämpfer jagen Viktor quer über den großen Sylter Deich.",
    "Falsches Üben von Xylophonmusik quält jeden größeren Zwerg.",
    "Der Bäcker backt jeden Morgen um vier Uhr die ersten Brötchen.",
    "Im Sommer baden wir im See hinter dem Wald.",
    "Wer fleißig übt, wird mit der Zeit immer schneller.",
    "Die Schüler schreiben heute eine kurze Prüfung.",
    "Auf dem Markt gibt es frisches Obst und Gemüse.",
    "Der Regen klopft leise an das Fenster.",
    "Mein Opa erzählt uns gern alte Geschichten.",
    "Ohne Brille kann ich die kleine Schrift nicht lesen.",
    "Die Straße ist nass, also fahre bitte vorsichtig.",
    "Wir haben gestern einen langen Spaziergang gemacht.",
    "Das Konzert beginnt pünktlich um acht Uhr.",
    "Hast du schon gefrühstückt, oder hast du noch Hunger?",
    "Im Winter liegt oft Schnee auf den Dächern der Stadt.",
    "Eine Tasse heißer Tee wärmt die kalten Hände.",
    "Der Zug nach München hat zehn Minuten Verspätung.",
    "Unser Nachbar pflegt seinen Garten mit großer Liebe.",
    "Die Sterne leuchten hell über dem stillen See.",
    "Ich habe meinen Schlüssel auf dem Tisch vergessen.",
    "Das Wetter ist heute wechselhaft: mal Sonne, mal Regen.",
    "Er löst jedes Rätsel schneller als alle anderen.",
    "Mit etwas Geduld gelingt fast alles.",
    "Die Bibliothek schließt heute früher als sonst.",
    "Im Park spielen ein paar Jungen Fußball.",
    "Sie malt ein buntes Bild von einem Schiff auf dem Meer.",
    "Mein Fahrrad hat einen platten Reifen bekommen.",
    "Am Wochenende besuchen wir meine Großeltern auf dem Land.",
    "Der Hund wedelt mit dem Schwanz und bellt freudig.",
    "Wir kochen heute Abend eine große Pfanne Nudeln.",
    "Die Uhr tickt leise im dunklen Flur.",
    "Kaum war die Sonne weg, wurde es plötzlich kalt.",
    "Ein guter Plan spart viel Zeit und Ärger.",
    "Der Leuchtturm zeigt den Schiffen den Weg durch die Nacht.",
    "Sie öffnete das Fenster und atmete tief durch.",
    "Im Garten blühen Rosen, Tulpen und Lilien.",
    "Das Kind staunt über den riesigen Schmetterling.",
    "Wo ist denn mein Regenschirm geblieben?",
    "Ich freue mich schon auf den Urlaub am Meer.",
    "Wir treffen uns um halb drei vor dem Bahnhof.",
    "Der Lehrer erklärt die Aufgabe noch einmal in Ruhe.",
    "Fleißige Bienen sammeln den ganzen Tag Nektar.",
    "Mein Lieblingsessen ist Kartoffelsuppe mit frischem Brot.",
    "Manchmal ist Schweigen die klügste Antwort.",
    "Die Brücke über den Fluss wurde letztes Jahr erneuert.",
    "Er spielt seit drei Jahren Klavier und wird immer besser.",
    "Jeden Abend schreibe ich ein paar Zeilen in mein Tagebuch.",
    "Der Berg war steil, aber die Aussicht war wunderschön.",
    "Bitte schließ die Tür, es zieht.",
    "Das Eis schmilzt in der Sonne schneller, als man denkt.",
    "Heute lerne ich etwas Neues, und morgen übe ich es.",
    "Die Katze jagt einen Schatten quer durch das Zimmer.",
    "Im Wald riecht es nach Moos, Erde und Regen.",
    "Wer viel liest, lernt auch viele Wörter kennen.",
    "Ein kalter Wind weht über die leeren Felder.",
    "Der Koch würzt die Suppe mit Salz, Pfeffer und Kräutern.",
    "Alle warten gespannt auf das Ergebnis.",
    "Mein Bruder baut im Keller ein kleines Boot.",
    "Vor dem Haus steht eine alte Eiche.",
    "Ich trinke meinen Kaffee am liebsten ohne Zucker.",
    "Die Wolken ziehen langsam über die Hügel.",
    "Gestern habe ich im Fluss einen glatten Stein gefunden.",
    "Es ist nie zu spät, etwas Neues anzufangen.",
    "Zusammen schaffen wir das in einer Stunde.",
    "Der Mond steht groß und gelb über dem Dach.",
    "Kleine Schritte führen auch zum Ziel.",
    "Die Gäste sitzen am Tisch und plaudern fröhlich.",
    "Das Segelschiff gleitet ruhig über die Wellen.",
    "Draußen schneit es, und drinnen brennt eine Kerze.",
    "Die Maus schlüpft durch ein winziges Loch in der Wand.",
    "Das war ein langer, aber schöner Tag."
  ]
};
