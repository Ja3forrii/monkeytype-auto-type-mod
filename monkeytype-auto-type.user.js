// ==UserScript==
// @name         Monkeytype Auto-Type Mod by @ja3farr
// @namespace    ja3farr.monkeytype.mod
// @version      1.0.0
// @description  Rainbow mod menu for monkeytype.com — toggle to auto-type the correct letter on any key press.
// @author       @ja3farr
// @match        https://monkeytype.com/*
// @match        https://www.monkeytype.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /* ----------------------------- state ----------------------------- */
    const STATE = {
        enabled: false,
        menuHidden: false,
        keysSent: 0,
    };

    /* --------------------------- helpers ----------------------------- */
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
        // Only count original letters (not the "extra" letters monkeytype appends
        // when the user over-types).
        const letters = wordEl.querySelectorAll(':scope > letter:not(.extra)');
        let out = '';
        for (const l of letters) out += l.textContent;
        return out;
    }

    function getTypedLength(wordEl) {
        if (!wordEl) return 0;
        // Letters that have already been processed by monkeytype either
        // got marked correct or incorrect.
        return wordEl.querySelectorAll(':scope > letter.correct, :scope > letter.incorrect').length;
    }

    function getNextChar() {
        const active = getActiveWord();
        if (!active) return null;
        const word = getWordText(active);
        const typed = getTypedLength(active);
        if (typed >= word.length) return ' ';
        return word[typed];
    }

    // Cached native value setter — required so React/Solid input handlers see
    // the change. Setting `wi.value = ...` directly is skipped by the
    // framework's value tracker.
    const NATIVE_TEXTAREA_VALUE = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype, 'value'
    ).set;

    function dispatchKey(ch) {
        // Monkeytype's real input pipeline is driven by `input` events on
        // #wordsInput (it ignores untrusted keydowns). Drive that path
        // directly: focus the textarea, mutate value via the native setter,
        // and fire a real-looking InputEvent.
        const wi = document.querySelector('#wordsInput');
        if (!wi) return;
        if (document.activeElement !== wi) wi.focus();

        NATIVE_TEXTAREA_VALUE.call(wi, (wi.value || '') + ch);
        wi.dispatchEvent(new InputEvent('input', {
            data: ch,
            inputType: 'insertText',
            bubbles: true,
            cancelable: true,
        }));
    }

    /* --------------------- key interception -------------------------- */
    // Capture-phase, top priority. Stops the user's key from reaching
    // monkeytype, then sends the *correct* character instead.
    function onKeyDownCapture(e) {
        if (!STATE.enabled) return;
        // Don't swallow shortcuts (Ctrl+R restart, Tab+Enter, Esc, etc).
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const k = e.key;
        // Only intercept printable single-character keys and Space.
        if (k.length !== 1) return;

        // No active test, let key through (e.g. typing in command palette).
        const active = getActiveWord();
        if (!active) return;

        // If focus is in some OTHER editable element, bail so we don't
        // hijack the address bar / search inputs / settings.
        const ae = document.activeElement;
        if (ae && ae !== document.body
              && ae.id !== 'wordsInput'
              && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) {
            return;
        }

        const next = getNextChar();
        if (next == null) return;

        // Block original key, then inject the correct one.
        e.preventDefault();
        e.stopImmediatePropagation();

        dispatchKey(next);
        STATE.keysSent += 1;
        updateCounter();
    }

    document.addEventListener('keydown', onKeyDownCapture, true);

    /* ----------------------------- UI -------------------------------- */
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
        width: 260px;
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
        background: rgba(12, 12, 18, 0.92);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        border-radius: 12px;
        padding: 12px 14px 14px;
    }
    #ja3farr-menu .ja3farr-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        cursor: grab;
    }
    #ja3farr-menu .ja3farr-title {
        font-weight: 800;
        letter-spacing: 1.5px;
        font-size: 13px;
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

    #ja3farr-menu .ja3farr-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px;
        margin-top: 8px;
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

    /* toggle switch */
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
    #ja3farr-menu.is-on .ja3farr-switch {
        background: linear-gradient(90deg, #ff004c, #ffe600, #00ff85, #00cfff, #ff00d4);
        background-size: 200% 100%;
        animation: ja3farr-rainbow 3s linear infinite;
    }
    #ja3farr-menu.is-on .ja3farr-switch::after {
        transform: translateX(22px);
        background: #fff;
    }

    #ja3farr-menu .ja3farr-status {
        margin-top: 10px;
        text-align: center;
        font-size: 11px;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        opacity: 0.8;
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
        opacity: .55;
    }

    #ja3farr-menu .ja3farr-credit {
        margin-top: 10px;
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

    /* tiny "show menu" pill, visible when the panel is hidden */
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

    function buildMenu() {
        const root = document.createElement('div');
        root.id = 'ja3farr-menu';
        root.innerHTML = `
            <div class="ja3farr-inner">
                <div class="ja3farr-header" id="ja3farr-drag">
                    <div class="ja3farr-title"><span class="ja3farr-logo"></span>ja3farr &middot; MOD MENU</div>
                    <div class="ja3farr-close" title="Hide (Shift+M)">&times;</div>
                </div>

                <div class="ja3farr-row">
                    <div>
                        <div class="ja3farr-label">Auto-Type</div>
                        <div class="ja3farr-sub">Any key &rarr; correct letter</div>
                    </div>
                    <div class="ja3farr-switch" id="ja3farr-toggle"></div>
                </div>

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

        // ---- behaviour ----
        const toggle = root.querySelector('#ja3farr-toggle');
        toggle.addEventListener('click', () => setEnabled(!STATE.enabled));

        root.querySelector('.ja3farr-close').addEventListener('click', () => setMenuHidden(true));
        show.addEventListener('click', () => setMenuHidden(false));

        // dragging
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

        // hotkey: Shift+M to toggle menu visibility
        document.addEventListener('keydown', (e) => {
            if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey
                && (e.key === 'M' || e.key === 'm')) {
                // only swallow when not focused in a real input
                const ae = document.activeElement;
                if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') && ae.id !== 'wordsInput') return;
                setMenuHidden(!STATE.menuHidden);
                e.preventDefault();
            }
        }, true);
    }

    function setEnabled(on) {
        STATE.enabled = !!on;
        const root = document.getElementById('ja3farr-menu');
        if (root) root.classList.toggle('is-on', STATE.enabled);
        const stateText = document.getElementById('ja3farr-state-text');
        if (stateText) stateText.textContent = STATE.enabled ? 'active' : 'disabled';
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

    /* ----------------------------- boot ------------------------------ */
    function boot() {
        if (document.getElementById('ja3farr-menu')) return;
        injectStyle();
        buildMenu();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
