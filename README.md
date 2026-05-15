# Monkeytype Auto-Type Mod by @ja3farr

A rainbow-themed mod menu userscript for [monkeytype.com](https://monkeytype.com) that auto-types the correct letter on any key press. Hit 100% accuracy every time.

![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Compatible-green?logo=tampermonkey)
![Violentmonkey](https://img.shields.io/badge/Violentmonkey-Compatible-green)
![Greasemonkey](https://img.shields.io/badge/Greasemonkey-Compatible-green)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Features

- **Auto-Type** — press any key and the correct character is typed for you automatically
- **Rainbow Mod Menu** — beautiful animated gradient UI with a draggable panel
- **Toggle On/Off** — click the switch or use the menu to enable/disable
- **Key Counter** — tracks how many keys have been auto-typed
- **Hide/Show Menu** — press `Shift+M` or click the close button to toggle the menu
- **Non-Intrusive** — doesn't interfere with shortcuts (`Ctrl+R`, `Tab`, `Esc`, etc.)

---

## Preview

When enabled, every key you press is replaced with the correct next letter. The mod menu sits in the top-right corner with a pulsing rainbow border:

```
┌──────────────────────────────┐
│  🌈 ja3farr · MOD MENU   ✕  │
│                              │
│  Auto-Type         [  ON  ]  │
│  Any key → correct letter    │
│                              │
│  ● active · 42 keys         │
│                              │
│     mod made by @ja3farr     │
└──────────────────────────────┘
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

> **[Click here to install monkeytype-auto-type.user.js](https://github.com/ja3farrdd0s/monkeytype-auto-type-mod/raw/main/monkeytype-auto-type.user.js)**

Or manually:

1. Open your userscript manager dashboard
2. Click **"Create a new script"** (or the **+** button)
3. Delete the default template
4. Copy and paste the entire contents of [`monkeytype-auto-type.user.js`](./monkeytype-auto-type.user.js)
5. Save (`Ctrl+S`)

### 3. Use It

1. Go to [monkeytype.com](https://monkeytype.com)
2. You'll see the **ja3farr MOD MENU** in the top-right corner
3. Click the **toggle switch** to enable Auto-Type
4. Start typing — every key you press will be replaced with the correct letter
5. Press `Shift+M` to hide/show the menu

---

## Controls

| Action | How |
|--------|-----|
| Toggle Auto-Type | Click the switch in the mod menu |
| Hide/Show Menu | `Shift+M` or click `✕` / the floating pill |
| Drag Menu | Click and drag the header bar |

---

## How It Works

The script intercepts `keydown` events in the capture phase before Monkeytype processes them. It reads the next expected character from the DOM, blocks the original key, and dispatches a synthetic `input` event with the correct character to Monkeytype's hidden input field (`#wordsInput`). This means no matter what key you press, the right letter is always typed.

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
