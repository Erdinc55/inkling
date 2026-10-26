# Inkling

A typing test where you type on a drawn typewriter instead of into a text box.

**Live:** https://erdinc55.github.io/inkling/

I wanted a typing trainer that doesn't look like every other one: a light, mint-green typewriter from the fifties, round keys with chrome rings, and a sheet of paper that slides to the left with every keystroke, just like a real carriage. At the end of a line the bell rings and the carriage snaps back.

## How it works

There are two modes:

- **Time trial**: 30, 60 or 120 seconds. The clock only starts with your first keystroke, so you can read the text first.
- **Survival**: an inkwell runs dry over 12 seconds. Every correct word refills it, every mistake costs a second. Every 10 words the level goes up: the ink drains faster and the words get longer.

You can type words, proverbs, quotes, sentences or a mix of them, in English or German. The keyboard layout (QWERTZ or QWERTY) is a separate setting, because plenty of people type German text on a US keyboard and the other way round.

Typing is strict: capitals, punctuation and umlauts have to be right. A wrong letter shows up in red on the paper and stays there until you remove it with Backspace. You can't delete letters you typed correctly. It's paper, after all.

Tab restarts, Esc cancels.

## The numbers

5 keystrokes count as one word, the usual rule for typing tests.

- **Net WPM** = (correct keystrokes / 5) / minutes
- **Gross WPM** = (all keystrokes / 5) / minutes
- **Accuracy** = correct keystrokes / all keystrokes

Example: 400 correct keystrokes out of 450 in 90 seconds gives 53.3 net WPM, 60 gross WPM and 88.9% accuracy.

After each run you get a speed-over-time chart (plain SVG, no library). The keys you missed light up red on the keyboard, and the more often you missed a key, the brighter it gets.

## Ranks

Your rank is based on your best net WPM in a time trial on a computer, and only counts with at least 90% accuracy. Otherwise you could just smash the keys.

| Rank | Net WPM |
|---|---|
| Iron | under 20 |
| Bronze | 20 to 34 |
| Silver | 35 to 49 |
| Gold | 50 to 64 |
| Platinum | 65 to 79 |
| Diamond | 80 to 99 |
| Inkmaster | 100 and up |

When you rank up, the machine stamps the new rank onto the result sheet.

The leaderboard keeps the top 10 per mode, device and language. It's stored in your browser (localStorage), so there are no accounts and no names.

## Things I got stuck on

**Phones don't tell you which key was pressed.** On Android, `keydown` often just says `"Unidentified"`. So on phones I use a hidden input field and compare its content before and after every `input` event. Backspace on an empty field doesn't change anything, so the field always starts with a placeholder character that can be deleted.

**Umlauts and dead keys.** At first I looked at `event.code`, but that only tells you where a key would be on a US keyboard. On a German keyboard Z and Y are swapped and Ä has no code of its own. Now everything goes by the typed character (`event.key`). Dead keys like `^` and `´` send `"Dead"` first, which I just ignore, because the actual character comes with the next keystroke.

**Moving the paper.** The current letter always has to sit exactly under the strike point. Because the font is monospaced, `1ch` is exactly one character wide, so the paper moves by `-1ch * position` with a CSS variable. No measuring needed.

## Files

| File | What it does |
|---|---|
| `index.html` | page structure |
| `style.css` | the whole look |
| `messung.js` | WPM, accuracy, ranks, chart data (no page code, testable on its own) |
| `spiel.js` | one run: time trial, survival, mistakes |
| `tastatur.js` | the drawn keyboard, typebars, QWERTZ and QWERTY |
| `app.js` | connects everything, result screen, leaderboard |
| `ton.js` | sounds generated with the Web Audio API, no audio files |
| `sprache.js` | all UI texts in English and German |
| `texte-en.js`, `texte-de.js` | words, proverbs, quotes and sentences |
| `test-messung.js`, `test-spiel.js` | tests, run with `node test-messung.js` |

Plain HTML, CSS and JavaScript. No frameworks, no build step.
