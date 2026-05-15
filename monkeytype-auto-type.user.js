// ==UserScript==
// @name         Monkeytype Auto-Type Mod by @ja3farr
// @namespace    ja3farr.monkeytype.mod
// @version      2.0.0
// @description  Rainbow mod menu for monkeytype.com with Auto, Legit (Manual Space + Helper) and Full Auto (WPM-targeted human-like) modes.
// @author       @ja3farr
// @match        https://monkeytype.com/*
// @match        https://www.monkeytype.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /* =============================================================
       STATE
       ============================================================= */
    const STATE = {
        // mode: 'off' | 'auto' | 'manual-space' | 'helper' | 'full-auto'
        mode: 'off',
        // active UI tab: 'auto' | 'legit' | 'fullauto'
        tab: 'auto',

        menuHidden: false,
        keysSent: 0,

        // Auto tab
        humanize: false,          // adds small random delay before each key

        // Legit / Helper
        helperMaxPerWord: 1,      // user-configurable
        helperUsedThisWord: 0,
        lastActiveWordEl: null,

        // Full Auto
        fullAutoWpm: 80,
        fullAutoMistakeRate: 3,   // percent
        fullAutoNaturalPauses: true,
        fullAutoTimer: null,
    };

    /* =============================================================
       DOM HELPERS
       ============================================================= */
    function getWordsContainer() {
        return document.querySelector('#words');
    }

    function getActiveWord() {
        const words = getWordsContainer();
        if (!words) return null;
        return words.querySelector('.word.active');
    }

    function getWordText(wordEl) {
        if (!wordEl) return '';
        const letters = wordEl.querySelectorAll(':scope > letter:not(.extra)');
        let out = '';
        for (const l of letters) out += l.textContent;
        return out;
    }

    function getTypedLength(wordEl) {
        if (!wordEl) return 0;
        return wordEl.querySelectorAll(
            ':scope > letter.correct, :scope > letter.incorrect'
        ).length;
    }

    function isWordComplete(wordEl) {
        if (!wordEl) return false;
        const text = getWordText(wordEl);
        return getTypedLength(wordEl) >= text.length;
    }

    function getNextChar() {
        const active = getActiveWord();
        if (!active) return null;
        const word = getWordText(active);
        const typed = getTypedLength(active);
        if (typed >= word.length) return ' ';
        return word[typed];
    }

    function getInputField() {
        return document.querySelector('#wordsInput');
    }

    /* =============================================================
       INPUT DISPATCH
       ============================================================= */
    const NATIVE_TEXTAREA_VALUE = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype, 'value'
    ).set;

    function dispatchKey(ch) {
        const wi = getInputField();
        if (!wi) return false;
        if (document.activeElement !== wi) wi.focus();

        NATIVE_TEXTAREA_VALUE.call(wi, (wi.value || '') + ch);
        wi.dispatchEvent(new InputEvent('input', {
            data: ch,
            inputType: 'insertText',
            bubbles: true,
            cancelable: true,
        }));
        return true;
    }

    function dispatchBackspace() {
        const wi = getInputField();
        if (!wi) return false;
        if (document.activeElement !== wi) wi.focus();

        const v = wi.value || '';
        if (v.length === 0) return false;

        NATIVE_TEXTAREA_VALUE.call(wi, v.slice(0, -1));
        wi.dispatchEvent(new InputEvent('input', {
            inputType: 'deleteContentBackward',
            bubbles: true,
            cancelable: true,
        }));
        return true;
    }

    /* QWERTY neighbour map for realistic typos */
    const NEIGHBORS = {
        a: 'qwsz', b: 'vghn', c: 'xdfv', d: 'serfcx', e: 'wrsdf',
        f: 'drtgvc', g: 'ftyhbv', h: 'gyujnb', i: 'ujko', j: 'huikm',
        k: 'jiolm', l: 'kop', m: 'njk', n: 'bhjm', o: 'iklp',
        p: 'ol', q: 'wa', r: 'edft', s: 'awdxz', t: 'rfgy',
        u: 'yhji', v: 'cfgb', w: 'qase', x: 'zsdc', y: 'tghu',
        z: 'asx',
    };
    function neighborKey(ch) {
        if (!ch || ch.length !== 1) return ch;
        const lower = ch.toLowerCase();
        const opts = NEIGHBORS[lower];
        if (!opts) return ch;
        const out = opts[Math.floor(Math.random() * opts.length)];
        return ch === ch.toUpperCase() && /[a-z]/.test(lower) ? out.toUpperCase() : out;
    }

    /* =============================================================
       KEY INTERCEPTION (Auto / Manual-Space / Helper modes)
       ============================================================= */
    function shouldIgnoreEvent(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return true;
        if (e.key.length !== 1) return true;
        const ae = document.activeElement;
        if (ae && ae !== document.body
              && ae.id !== 'wordsInput'
              && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) {
            return true;
        }
        return false;
    }

    function onKeyDownCapture(e) {
        const mode = STATE.mode;
        if (mode === 'off' || mode === 'full-auto') return;
        if (shouldIgnoreEvent(e)) return;

        const active = getActiveWord();
        if (!active) return;

        if (mode === 'auto') {
            const next = getNextChar();
            if (next == null) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (STATE.humanize) {
                const ms = 4 + Math.random() * 18;
                setTimeout(() => {
                    if (STATE.mode !== 'auto') return;
                    dispatchKey(next);
                    STATE.keysSent++;
                    updateCounter();
                }, ms);
            } else {
                dispatchKey(next);
                STATE.keysSent++;
                updateCounter();
            }
            return;
        }

        if (mode === 'manual-space') {
            // Reset helper-style counter on word change isn't needed; manual-space
            // simply does not auto-advance: when the active word is fully typed,
            // we let real keys through so the user must press space themselves.
            if (isWordComplete(active)) {
                // Word is finished — do not intercept anything. If the user hits
                // a letter they get a red "extra" mistake; pressing space advances.
                return;
            }
            const next = getNextChar();
            if (next == null || next === ' ') return;
            e.preventDefault();
            e.stopImmediatePropagation();
            dispatchKey(next);
            STATE.keysSent++;
            updateCounter();
            return;
        }

        if (mode === 'helper') {
            if (active !== STATE.lastActiveWordEl) {
                STATE.lastActiveWordEl = active;
                STATE.helperUsedThisWord = 0;
            }
            const next = getNextChar();
            if (next == null) return;

            // Don't touch backspace / space / shortcut keys (already filtered).
            // If the user's key matches the expected letter, let it through —
            // monkeytype sees the user's natural keystroke.
            if (e.key === next) return;

            // User pressed space themselves — let it through (skip or advance).
            if (e.key === ' ') return;

            // Wrong key. If we still have correction budget, silently substitute.
            if (STATE.helperUsedThisWord < STATE.helperMaxPerWord) {
                e.preventDefault();
                e.stopImmediatePropagation();
                dispatchKey(next);
                STATE.helperUsedThisWord++;
                STATE.keysSent++;
                updateCounter();
                renderHelperRemaining();
            }
            // Otherwise: let the wrong key through (becomes a real mistake).
            return;
        }
    }
    document.addEventListener('keydown', onKeyDownCapture, true);

    /* =============================================================
       FULL AUTO MODE
       ============================================================= */
    function startFullAuto() {
        stopFullAuto();
        const wi = getInputField();
        if (wi) wi.focus();
        scheduleFullAuto(250 + Math.random() * 400);
    }

    function stopFullAuto() {
        if (STATE.fullAutoTimer) {
            clearTimeout(STATE.fullAutoTimer);
            STATE.fullAutoTimer = null;
        }
    }

    function scheduleFullAuto(ms) {
        if (STATE.mode !== 'full-auto') return;
        if (STATE.fullAutoTimer) clearTimeout(STATE.fullAutoTimer);
        STATE.fullAutoTimer = setTimeout(fullAutoTick, Math.max(15, ms));
    }

    function fullAutoBaseDelay() {
        const wpm = Math.max(5, Math.min(400, STATE.fullAutoWpm || 80));
        return 12000 / wpm; // ms per char (5 chars/word standard)
    }

    function fullAutoTick() {
        if (STATE.mode !== 'full-auto') return;

        const active = getActiveWord();
        if (!active) {
            // No active test — keep polling at a slow rate.
            scheduleFullAuto(400);
            return;
        }

        const next = getNextChar();
        if (next == null) {
            scheduleFullAuto(200);
            return;
        }

        const wi = getInputField();
        if (wi && document.activeElement !== wi) wi.focus();

        const base = fullAutoBaseDelay();
        // Jitter: log-normal-ish via base * (0.65 + r * 0.9)
        let delay = base * (0.65 + Math.random() * 0.9);

        // Word-boundary pause feels natural
        if (next === ' ') delay *= 1.25 + Math.random() * 0.4;

        // Occasional "thinking" pause every now and then
        if (STATE.fullAutoNaturalPauses && Math.random() < 0.05) {
            delay += 250 + Math.random() * 600;
        }

        const mistakeChance = Math.max(0, Math.min(0.25, (STATE.fullAutoMistakeRate || 0) / 100));
        const canMistype = next !== ' ' && /^[a-zA-Z]$/.test(next);

        if (canMistype && Math.random() < mistakeChance) {
            const wrong = neighborKey(next);
            const wrongCh = wrong === next ? next : wrong;
            const noticeDelay = 70 + Math.random() * 140;
            const correctDelay = 60 + Math.random() * 110;

            setTimeout(() => {
                if (STATE.mode !== 'full-auto') return;
                dispatchKey(wrongCh);
                STATE.keysSent++;
                updateCounter();
                setTimeout(() => {
                    if (STATE.mode !== 'full-auto') return;
                    dispatchBackspace();
                    setTimeout(() => {
                        if (STATE.mode !== 'full-auto') return;
                        dispatchKey(next);
                        STATE.keysSent++;
                        updateCounter();
                        scheduleFullAuto(delay);
                    }, correctDelay);
                }, noticeDelay);
            }, Math.max(15, delay));
            return;
        }

        setTimeout(() => {
            if (STATE.mode !== 'full-auto') return;
            dispatchKey(next);
            STATE.keysSent++;
            updateCounter();
            scheduleFullAuto(delay);
        }, Math.max(15, delay));
    }

    /* =============================================================
       MODE / SETTINGS
       ============================================================= */
    function setMode(newMode) {
        const prev = STATE.mode;
        if (prev === newMode) return;
        STATE.mode = newMode;
        if (newMode !== 'helper') {
            STATE.helperUsedThisWord = 0;
            STATE.lastActiveWordEl = null;
        }
        if (newMode === 'full-auto') startFullAuto();
        else if (prev === 'full-auto') stopFullAuto();
        renderState();
        saveSettings();
    }

    const SETTINGS_KEY = 'ja3farr-mod-settings';
    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({
                tab: STATE.tab,
                humanize: STATE.humanize,
                helperMaxPerWord: STATE.helperMaxPerWord,
                fullAutoWpm: STATE.fullAutoWpm,
                fullAutoMistakeRate: STATE.fullAutoMistakeRate,
                fullAutoNaturalPauses: STATE.fullAutoNaturalPauses,
            }));
        } catch (e) { /* ignore */ }
    }

    function loadSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (!raw) return;
            const d = JSON.parse(raw);
            if (d.tab) STATE.tab = d.tab;
            if (typeof d.humanize === 'boolean') STATE.humanize = d.humanize;
            if (typeof d.helperMaxPerWord === 'number') STATE.helperMaxPerWord = d.helperMaxPerWord;
            if (typeof d.fullAutoWpm === 'number') STATE.fullAutoWpm = d.fullAutoWpm;
            if (typeof d.fullAutoMistakeRate === 'number') STATE.fullAutoMistakeRate = d.fullAutoMistakeRate;
            if (typeof d.fullAutoNaturalPauses === 'boolean') STATE.fullAutoNaturalPauses = d.fullAutoNaturalPauses;
        } catch (e) { /* ignore */ }
    }

    /* =============================================================
       UI
       ============================================================= */
    const CSS = `
    @keyframes ja3farr-rainbow {
        0%   { background-position:   0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position:   0% 50%; }
    }
    @keyframes ja3farr-pulse {
        0%, 100% { box-shadow: 0 0 12px rgba(255, 0, 200, .55), 0 0 24px rgba(0, 200, 255, .35); }
        50%      { box-shadow: 0 0 22px rgba(0, 255, 180, .75), 0 0 44px rgba(255, 200, 0, .45); }
    }
    @keyframes ja3farr-spin {
        from { transform: rotate(0deg);   }
        to   { transform: rotate(360deg); }
    }

    #ja3farr-menu {
        position: fixed;
        top: 90px;
        right: 22px;
        z-index: 2147483647;
        width: 286px;
        padding: 2px;
        border-radius: 14px;
        background: linear-gradient(120deg,
            #ff004c, #ff7a00, #ffe600, #00ff85,
            #00cfff, #6a5cff, #ff00d4, #ff004c);
        background-size: 400% 400%;
        animation: ja3farr-rainbow 6s linear infinite, ja3farr-pulse 3s ease-in-out infinite;
        font-family: 'Roboto Mono', ui-monospace, monospace;
        color: #fff;
        user-select: none;
        cursor: default;
    }
    #ja3farr-menu .ja3farr-inner {
        background: rgba(12, 12, 18, 0.94);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        border-radius: 12px;
        padding: 10px 12px 12px;
    }
    #ja3farr-menu .ja3farr-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        cursor: grab;
    }
    #ja3farr-menu .ja3farr-title {
        font-weight: 800;
        letter-spacing: 1.5px;
        font-size: 12px;
        background: linear-gradient(90deg, #ff004c, #ffe600, #00ff85, #00cfff, #ff00d4, #ff004c);
        background-size: 300% 100%;
        animation: ja3farr-rainbow 4s linear infinite;
        -webkit-background-clip: text;
                background-clip: text;
        color: transparent;
        text-shadow: 0 0 1px rgba(255,255,255,0.15);
    }
    #ja3farr-menu .ja3farr-logo {
        display: inline-block;
        width: 12px; height: 12px;
        margin-right: 8px;
        border-radius: 50%;
        background: conic-gradient(#ff004c, #ffe600, #00ff85, #00cfff, #ff00d4, #ff004c);
        animation: ja3farr-spin 4s linear infinite;
        vertical-align: -2px;
    }
    #ja3farr-menu .ja3farr-close {
        cursor: pointer;
        font-size: 14px;
        opacity: .75;
        padding: 0 4px;
    }
    #ja3farr-menu .ja3farr-close:hover { opacity: 1; }

    #ja3farr-menu .ja3farr-tabs {
        display: flex;
        gap: 4px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.06);
        padding: 3px;
        border-radius: 10px;
        margin-bottom: 8px;
    }
    #ja3farr-menu .ja3farr-tab {
        flex: 1;
        text-align: center;
        font-size: 10.5px;
        letter-spacing: 0.8px;
        padding: 6px 4px;
        border-radius: 8px;
        cursor: pointer;
        opacity: 0.6;
        text-transform: uppercase;
        transition: opacity .15s, background .15s;
    }
    #ja3farr-menu .ja3farr-tab:hover { opacity: 0.85; }
    #ja3farr-menu .ja3farr-tab.active {
        opacity: 1;
        background: linear-gradient(90deg, #ff004c, #ffe600, #00ff85, #00cfff, #ff00d4);
        background-size: 200% 100%;
        animation: ja3farr-rainbow 5s linear infinite;
        color: #0c0c12;
        font-weight: 800;
    }

    #ja3farr-menu .ja3farr-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 7px 10px;
        margin-top: 6px;
        border-radius: 10px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.06);
    }
    #ja3farr-menu .ja3farr-row .ja3farr-label {
        font-size: 12px;
        letter-spacing: 0.5px;
    }
    #ja3farr-menu .ja3farr-row .ja3farr-sub {
        font-size: 10px;
        opacity: .55;
        margin-top: 1px;
    }

    #ja3farr-menu .ja3farr-legit-meter {
        display: inline-block;
        font-size: 9px;
        padding: 1px 6px;
        border-radius: 999px;
        margin-left: 6px;
        background: rgba(78, 255, 154, 0.18);
        color: #4eff9a;
        vertical-align: 1px;
        letter-spacing: 0.5px;
    }
    #ja3farr-menu .ja3farr-legit-meter.lvl-1 { background: rgba(255,200,0,0.15); color: #ffd84e; }
    #ja3farr-menu .ja3farr-legit-meter.lvl-2 { background: rgba(0,200,255,0.15); color: #4ecbff; }
    #ja3farr-menu .ja3farr-legit-meter.lvl-3 { background: rgba(78, 255, 154, 0.18); color: #4eff9a; }
    #ja3farr-menu .ja3farr-legit-meter.lvl-x { background: rgba(255, 78, 106, 0.18); color: #ff7e90; }

    #ja3farr-menu .ja3farr-switch {
        position: relative;
        width: 46px;
        height: 24px;
        flex-shrink: 0;
        border-radius: 999px;
        background: #2a2a35;
        border: 1px solid rgba(255,255,255,.1);
        cursor: pointer;
        transition: background .25s;
    }
    #ja3farr-menu .ja3farr-switch::after {
        content: '';
        position: absolute;
        top: 2px; left: 2px;
        width: 18px; height: 18px;
        border-radius: 50%;
        background: #fff;
        transition: transform .25s, background .25s;
        box-shadow: 0 1px 4px rgba(0,0,0,.4);
    }
    #ja3farr-menu .ja3farr-switch.is-on {
        background: linear-gradient(90deg, #ff004c, #ffe600, #00ff85, #00cfff, #ff00d4);
        background-size: 200% 100%;
        animation: ja3farr-rainbow 3s linear infinite;
    }
    #ja3farr-menu .ja3farr-switch.is-on::after {
        transform: translateX(22px);
        background: #fff;
    }

    #ja3farr-menu .ja3farr-num {
        width: 60px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,255,255,.12);
        color: #fff;
        font-family: inherit;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 6px;
        text-align: right;
    }
    #ja3farr-menu .ja3farr-num:focus { outline: 1px solid #00cfff; }

    #ja3farr-menu .ja3farr-status {
        margin-top: 10px;
        text-align: center;
        font-size: 11px;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        opacity: 0.85;
    }
    #ja3farr-menu .ja3farr-status .ja3farr-dot {
        display: inline-block;
        width: 8px; height: 8px;
        border-radius: 50%;
        background: #ff4e6a;
        margin-right: 6px;
        vertical-align: 1px;
        box-shadow: 0 0 6px currentColor;
    }
    #ja3farr-menu.is-on .ja3farr-status .ja3farr-dot { background: #4eff9a; }
    #ja3farr-menu .ja3farr-counter {
        font-variant-numeric: tabular-nums;
        margin-left: 6px;
        opacity: .65;
    }

    #ja3farr-menu .ja3farr-credit {
        margin-top: 9px;
        text-align: center;
        font-size: 10px;
        letter-spacing: 1.5px;
        opacity: 0.65;
    }
    #ja3farr-menu .ja3farr-credit b {
        background: linear-gradient(90deg, #ff004c, #ffe600, #00ff85, #00cfff, #ff00d4, #ff004c);
        background-size: 300% 100%;
        animation: ja3farr-rainbow 4s linear infinite;
        -webkit-background-clip: text;
                background-clip: text;
        color: transparent;
        font-weight: 800;
        letter-spacing: 0.5px;
    }

    #ja3farr-show {
        position: fixed;
        top: 90px;
        right: 22px;
        z-index: 2147483647;
        padding: 6px 10px;
        border-radius: 999px;
        font: 600 11px/1 'Roboto Mono', monospace;
        color: #fff;
        cursor: pointer;
        background: linear-gradient(90deg, #ff004c, #ffe600, #00ff85, #00cfff, #ff00d4, #ff004c);
        background-size: 300% 100%;
        animation: ja3farr-rainbow 5s linear infinite, ja3farr-pulse 3s ease-in-out infinite;
        box-shadow: 0 4px 14px rgba(0,0,0,.4);
    }
    `;

    function injectStyle() {
        const s = document.createElement('style');
        s.id = 'ja3farr-style';
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    /* ------------- panels per tab ------------- */
    function panelAutoHtml() {
        return `
            <div class="ja3farr-row" data-row="auto">
                <div>
                    <div class="ja3farr-label">Auto-Type <span class="ja3farr-legit-meter lvl-x">RISKY</span></div>
                    <div class="ja3farr-sub">Any key &rarr; correct letter, 100% accuracy</div>
                </div>
                <div class="ja3farr-switch" data-toggle="auto"></div>
            </div>
            <div class="ja3farr-row" data-row="humanize">
                <div>
                    <div class="ja3farr-label">Humanize Delay</div>
                    <div class="ja3farr-sub">Tiny random delay per key (4&ndash;22ms)</div>
                </div>
                <div class="ja3farr-switch" data-toggle="humanize"></div>
            </div>
        `;
    }

    function panelLegitHtml() {
        return `
            <div class="ja3farr-row" data-row="manual-space">
                <div>
                    <div class="ja3farr-label">Manual Space <span class="ja3farr-legit-meter lvl-1">~40% LEGIT</span></div>
                    <div class="ja3farr-sub">Auto letters, but YOU press space each word</div>
                </div>
                <div class="ja3farr-switch" data-toggle="manual-space"></div>
            </div>
            <div class="ja3farr-row" data-row="helper">
                <div>
                    <div class="ja3farr-label">Small Helper <span class="ja3farr-legit-meter lvl-3">~90% LEGIT</span></div>
                    <div class="ja3farr-sub">Type normally, helper fixes <span id="ja3farr-helper-n">1</span> mistake/word</div>
                </div>
                <div class="ja3farr-switch" data-toggle="helper"></div>
            </div>
            <div class="ja3farr-row" data-row="helper-cfg">
                <div>
                    <div class="ja3farr-label">Mistakes Fixed / Word</div>
                    <div class="ja3farr-sub"><span id="ja3farr-helper-rem">budget: --</span></div>
                </div>
                <input class="ja3farr-num" type="number" min="0" max="20" step="1" data-input="helper-max">
            </div>
        `;
    }

    function panelFullAutoHtml() {
        return `
            <div class="ja3farr-row" data-row="fullauto">
                <div>
                    <div class="ja3farr-label">Full Auto <span class="ja3farr-legit-meter lvl-2">WPM-LEGIT</span></div>
                    <div class="ja3farr-sub">Types at target WPM with human-like timing</div>
                </div>
                <div class="ja3farr-switch" data-toggle="full-auto"></div>
            </div>
            <div class="ja3farr-row" data-row="wpm">
                <div>
                    <div class="ja3farr-label">Target WPM</div>
                    <div class="ja3farr-sub">5&ndash;400</div>
                </div>
                <input class="ja3farr-num" type="number" min="5" max="400" step="1" data-input="wpm">
            </div>
            <div class="ja3farr-row" data-row="mistake">
                <div>
                    <div class="ja3farr-label">Mistake Rate %</div>
                    <div class="ja3farr-sub">Typos + auto-correct (0&ndash;25)</div>
                </div>
                <input class="ja3farr-num" type="number" min="0" max="25" step="0.5" data-input="mistake">
            </div>
            <div class="ja3farr-row" data-row="pauses">
                <div>
                    <div class="ja3farr-label">Natural Pauses</div>
                    <div class="ja3farr-sub">Occasional "thinking" gaps</div>
                </div>
                <div class="ja3farr-switch" data-toggle="pauses"></div>
            </div>
        `;
    }

    function buildMenu() {
        const root = document.createElement('div');
        root.id = 'ja3farr-menu';
        root.innerHTML = `
            <div class="ja3farr-inner">
                <div class="ja3farr-header" id="ja3farr-drag">
                    <div class="ja3farr-title"><span class="ja3farr-logo"></span>ja3farr &middot; MOD MENU</div>
                    <div class="ja3farr-close" title="Hide (Shift+M)">&times;</div>
                </div>

                <div class="ja3farr-tabs">
                    <div class="ja3farr-tab" data-tab="auto">Auto</div>
                    <div class="ja3farr-tab" data-tab="legit">Legit</div>
                    <div class="ja3farr-tab" data-tab="fullauto">Full Auto</div>
                </div>

                <div id="ja3farr-panel"></div>

                <div class="ja3farr-status">
                    <span class="ja3farr-dot"></span><span id="ja3farr-state-text">disabled</span>
                    <span class="ja3farr-counter" id="ja3farr-counter">&middot; 0 keys</span>
                </div>

                <div class="ja3farr-credit">mod made by <b>@ja3farr</b></div>
            </div>
        `;
        document.body.appendChild(root);

        const show = document.createElement('div');
        show.id = 'ja3farr-show';
        show.textContent = 'ja3farr';
        show.title = 'Show mod menu (Shift+M)';
        show.style.display = 'none';
        document.body.appendChild(show);

        root.querySelector('.ja3farr-close').addEventListener('click', () => setMenuHidden(true));
        show.addEventListener('click', () => setMenuHidden(false));

        // Tabs
        root.querySelectorAll('.ja3farr-tab').forEach(el => {
            el.addEventListener('click', () => setTab(el.dataset.tab));
        });

        // Drag
        const drag = root.querySelector('#ja3farr-drag');
        let dragData = null;
        drag.addEventListener('mousedown', (e) => {
            dragData = {
                x: e.clientX, y: e.clientY,
                top: root.offsetTop, left: root.offsetLeft,
            };
            drag.style.cursor = 'grabbing';
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!dragData) return;
            const nx = dragData.left + (e.clientX - dragData.x);
            const ny = dragData.top  + (e.clientY - dragData.y);
            root.style.left  = Math.max(4, nx) + 'px';
            root.style.top   = Math.max(4, ny) + 'px';
            root.style.right = 'auto';
        });
        document.addEventListener('mouseup', () => {
            if (dragData) drag.style.cursor = 'grab';
            dragData = null;
        });

        // Shift+M hotkey
        document.addEventListener('keydown', (e) => {
            if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey
                && (e.key === 'M' || e.key === 'm')) {
                const ae = document.activeElement;
                if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') && ae.id !== 'wordsInput') return;
                setMenuHidden(!STATE.menuHidden);
                e.preventDefault();
            }
        }, true);

        renderPanel();
        renderState();
    }

    function renderPanel() {
        const panel = document.getElementById('ja3farr-panel');
        if (!panel) return;
        if (STATE.tab === 'auto') panel.innerHTML = panelAutoHtml();
        else if (STATE.tab === 'legit') panel.innerHTML = panelLegitHtml();
        else panel.innerHTML = panelFullAutoHtml();

        // Wire up toggles
        panel.querySelectorAll('[data-toggle]').forEach(el => {
            el.addEventListener('click', () => onToggle(el.dataset.toggle));
        });

        // Wire up inputs
        panel.querySelectorAll('[data-input]').forEach(el => {
            el.addEventListener('change', () => onInput(el.dataset.input, el.value));
            el.addEventListener('input', () => onInput(el.dataset.input, el.value));
        });

        renderState();
    }

    function onToggle(name) {
        if (name === 'auto') {
            setMode(STATE.mode === 'auto' ? 'off' : 'auto');
        } else if (name === 'humanize') {
            STATE.humanize = !STATE.humanize;
            saveSettings();
            renderState();
        } else if (name === 'manual-space') {
            setMode(STATE.mode === 'manual-space' ? 'off' : 'manual-space');
        } else if (name === 'helper') {
            setMode(STATE.mode === 'helper' ? 'off' : 'helper');
        } else if (name === 'full-auto') {
            setMode(STATE.mode === 'full-auto' ? 'off' : 'full-auto');
        } else if (name === 'pauses') {
            STATE.fullAutoNaturalPauses = !STATE.fullAutoNaturalPauses;
            saveSettings();
            renderState();
        }
    }

    function onInput(name, value) {
        const num = parseFloat(value);
        if (name === 'helper-max') {
            if (!Number.isFinite(num)) return;
            STATE.helperMaxPerWord = Math.max(0, Math.min(20, Math.floor(num)));
        } else if (name === 'wpm') {
            if (!Number.isFinite(num)) return;
            STATE.fullAutoWpm = Math.max(5, Math.min(400, Math.round(num)));
        } else if (name === 'mistake') {
            if (!Number.isFinite(num)) return;
            STATE.fullAutoMistakeRate = Math.max(0, Math.min(25, num));
        }
        saveSettings();
        renderState();
    }

    function renderHelperRemaining() {
        const el = document.getElementById('ja3farr-helper-rem');
        if (!el) return;
        const rem = Math.max(0, STATE.helperMaxPerWord - STATE.helperUsedThisWord);
        if (STATE.mode === 'helper') {
            el.textContent = `budget left this word: ${rem}/${STATE.helperMaxPerWord}`;
        } else {
            el.textContent = `budget: -- (enable helper)`;
        }
    }

    function setTab(tab) {
        STATE.tab = tab;
        saveSettings();
        const root = document.getElementById('ja3farr-menu');
        if (root) {
            root.querySelectorAll('.ja3farr-tab').forEach(el => {
                el.classList.toggle('active', el.dataset.tab === tab);
            });
        }
        renderPanel();
    }

    function setMenuHidden(hidden) {
        STATE.menuHidden = !!hidden;
        const root = document.getElementById('ja3farr-menu');
        const show = document.getElementById('ja3farr-show');
        if (root) root.style.display = hidden ? 'none' : '';
        if (show) show.style.display = hidden ? '' : 'none';
    }

    function updateCounter() {
        const c = document.getElementById('ja3farr-counter');
        if (c) c.textContent = '\u00b7 ' + STATE.keysSent + ' keys';
    }

    function renderState() {
        const root = document.getElementById('ja3farr-menu');
        if (!root) return;

        // Tabs
        root.querySelectorAll('.ja3farr-tab').forEach(el => {
            el.classList.toggle('active', el.dataset.tab === STATE.tab);
        });

        // Toggle visual states
        const switches = root.querySelectorAll('[data-toggle]');
        switches.forEach(sw => {
            const name = sw.dataset.toggle;
            let on = false;
            if (name === 'auto') on = STATE.mode === 'auto';
            else if (name === 'humanize') on = STATE.humanize;
            else if (name === 'manual-space') on = STATE.mode === 'manual-space';
            else if (name === 'helper') on = STATE.mode === 'helper';
            else if (name === 'full-auto') on = STATE.mode === 'full-auto';
            else if (name === 'pauses') on = STATE.fullAutoNaturalPauses;
            sw.classList.toggle('is-on', on);
        });

        // Inputs reflect state
        const helperInput = root.querySelector('[data-input="helper-max"]');
        if (helperInput) helperInput.value = STATE.helperMaxPerWord;
        const wpmInput = root.querySelector('[data-input="wpm"]');
        if (wpmInput) wpmInput.value = STATE.fullAutoWpm;
        const mistakeInput = root.querySelector('[data-input="mistake"]');
        if (mistakeInput) mistakeInput.value = STATE.fullAutoMistakeRate;

        // Helper "n" label
        const helperN = root.querySelector('#ja3farr-helper-n');
        if (helperN) helperN.textContent = String(STATE.helperMaxPerWord);

        // Menu-level on indicator (active dot)
        const anyOn = STATE.mode !== 'off';
        root.classList.toggle('is-on', anyOn);
        const stateText = document.getElementById('ja3farr-state-text');
        if (stateText) {
            if (STATE.mode === 'off') stateText.textContent = 'disabled';
            else if (STATE.mode === 'auto') stateText.textContent = 'auto';
            else if (STATE.mode === 'manual-space') stateText.textContent = 'manual-space';
            else if (STATE.mode === 'helper') stateText.textContent = 'helper';
            else if (STATE.mode === 'full-auto') stateText.textContent = 'full auto @ ' + STATE.fullAutoWpm + ' wpm';
        }

        renderHelperRemaining();
        updateCounter();
    }

    /* =============================================================
       BOOT
       ============================================================= */
    function boot() {
        if (document.getElementById('ja3farr-menu')) return;
        loadSettings();
        injectStyle();
        buildMenu();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
