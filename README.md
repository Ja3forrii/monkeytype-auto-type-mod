# Monkeytype Auto-Type Mod by @ja3farr

A rainbow-themed mod menu userscript for [monkeytype.com](https://monkeytype.com) with **three tabs** — full auto, manual-space, helper-only, and a WPM-targeted human-like Full Auto. Pick your legit level.

![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Compatible-green?logo=tampermonkey)
![Violentmonkey](https://img.shields.io/badge/Violentmonkey-Compatible-green)
![Greasemonkey](https://img.shields.io/badge/Greasemonkey-Compatible-green)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Features

Three tabs in the menu, each tuned for a different “legit” level so your results actually save instead of getting flagged as `failed to save / results don't make sense`.

### `Auto` tab — RISKY (100% accuracy, instant)
- **Auto-Type**: every key you press is replaced with the correct letter, instantly.
- **Humanize Delay**: optional 4–22ms jitter per key to look slightly less robotic.

### `Legit` tab — the safer modes
- **Manual Space (~40% legit)**: auto-types every letter in the word, but **never presses space for you**. You have to hit space yourself at every word boundary — if you don't, your next keys overflow as extra letters (red mistakes). Adds natural rhythm + variance.
- **Small Helper (~90% legit, undetected)**: you type normally at your real speed. The helper silently fixes **N mistakes per word** (default 1, configurable 0–20). No timing is altered — monkeytype just sees your natural keystrokes with slightly better accuracy.

### `Full Auto` tab — WPM-targeted human-like
- **Target WPM**: 5–400, you set it.
- **Mistake Rate %**: 0–25, the bot will type a neighbour key, backspace, and correct it, just like a human.
- **Natural Pauses**: occasional “thinking” gaps between words.
- Variable inter-key timing + word-boundary slowdowns, so the rhythm matches the target WPM without being a perfectly flat machine line.

### Other niceties
- **Rainbow Mod Menu** with three-tab navigation, draggable panel, persistent settings
- **Key Counter** for keys sent
- **Hide/Show Menu** with `Shift+M` or the `✕` button
- **Non-Intrusive**: never swallows `Ctrl+R`, `Tab`, `Esc`, etc.

---

## Preview

```
┌──────────────────────────────────┐
│  🌈 ja3farr · MOD MENU       ✕  │
│  [ Auto ][ LEGIT  ][ Full Auto ]  │
│                                  │
│  Manual Space    ~40% legit  ●  │
│  Small Helper    ~90% legit  ●  │
│  Mistakes/word          [ 1 ]   │
│                                  │
│  ● helper · 42 keys             │
│         made by @ja3farr         │
└──────────────────────────────────┘
```

---

## Installation

### 1. Install a Userscript Manager

You need a browser extension that can run userscripts. Pick one:

| Extension | Chrome | Firefox | Edge | Safari |
|-----------|--------|---------|------|--------|
| [Tampermonkey](https://www.tampermonkey.net/) | [Install](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) | [Install](https://addons.mozilla.org/firefox/addon/tampermonkey/) | [Install](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) | [Install](https://apps.apple.com/app/tampermonkey/id1482490089) |
| [Violentmonkey](https://violentmonkey.github.io/) | [Install](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag) | [Install](https://addons.mozilla.org/firefox/addon/violentmonkey/) | [Install](https://microsoftedge.microsoft.com/addons/detail/violentmonkey/eeagobfjdenobohnndmmkbhmicelcjne) | — |
| [Greasemonkey](https://www.greasespot.net/) | — | [Install](https://addons.mozilla.org/firefox/addon/greasemonkey/) | — | — |

### 2. Install the Script

Click the button below to install directly:

> **[Click here to install monkeytype-auto-type.user.js](https://github.com/Ja3forrii/monkeytype-auto-type-mod/raw/main/monkeytype-auto-type.user.js)**

Or manually:

1. Open your userscript manager dashboard
2. Click **"Create a new script"** (or the **+** button)
3. Delete the default template
4. Copy and paste the entire contents of [`monkeytype-auto-type.user.js`](./monkeytype-auto-type.user.js)
5. Save (`Ctrl+S`)

### 3. Use It

1. Go to [monkeytype.com](https://monkeytype.com)
2. You'll see the **ja3farr MOD MENU** in the top-right corner
3. Pick a tab (Auto / Legit / Full Auto) and toggle the mode you want
4. Start (or finish) the test as normal — press `Shift+M` to hide/show the menu

Only one mode is active at a time; enabling another switches you out of the current one. Settings persist across reloads.

---

## Controls

| Action | How |
|--------|-----|
| Switch tab | Click `Auto` / `Legit` / `Full Auto` |
| Enable / disable a mode | Click that mode's toggle switch |
| Change helper budget / WPM / mistake rate | Type into the numeric input |
| Hide/Show Menu | `Shift+M` or click `✕` / the floating pill |
| Drag Menu | Click and drag the header bar |

---

## How It Works

The script intercepts `keydown` events in the capture phase before Monkeytype processes them and dispatches synthetic `input` events on Monkeytype's hidden `#wordsInput` textarea. Different modes do different things on top of this:

- **Auto** — replaces every key with the next expected character.
- **Manual Space** — same as Auto, but bails out completely when the active word is fully typed, so the user has to actually press space. Anything else hits as an extra letter.
- **Small Helper** — only intercepts when the user presses a *wrong* key. The first N wrong presses per word are silently swapped for the correct letter; further wrong presses go through as real mistakes. Your timing isn't touched.
- **Full Auto** — a loop dispatches the correct next character at `12000 / WPM` ms with jitter, longer pauses at word boundaries and occasional “thinking” gaps. With `Mistake Rate %` > 0, it'll sometimes type a QWERTY-neighbour key, backspace, then correct it.

## Why the modes? — `failed to save / results don't make sense`

Monkeytype's anti-cheat rejects results that look superhuman (no variance, no errors, impossible speed). The Auto tab gets caught by this. The Legit and Full Auto tabs are designed to produce save-worthy results: real timing, real word-boundary pauses, and (optionally) real-looking typos with corrections. Pick the level that fits your goal.

---

## Disclaimer

This script is for **educational and entertainment purposes only**. Using it in competitive contexts or to misrepresent your typing speed is not cool. Use responsibly.

---

## Contact & Socials

Made with love by **@ja3farr**. Hit me up:

| Platform | Handle |
|----------|--------|
| Discord | **@ja3forrii** |
| Telegram | **[@KxG_999](https://t.me/KxG_999)** |
| TikTok | **[@ja3forrii](https://www.tiktok.com/@ja3forrii)** |

---

## License

This project is licensed under the [MIT License](./LICENSE).
