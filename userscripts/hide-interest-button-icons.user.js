// ==UserScript==
// @name Hide Interest Button Icons
// @description Hide Chrome interestfor info icons, which appear as ⓘ symbols on interfaces which use `button[interestfor]` like ChatGPT
// @version 1.0.0
// @author Karl Horky
// @namespace https://www.karlhorky.com/
// @match *://*/*
// @grant none
// ==/UserScript==

const styleEl = document.createElement('style');

document.documentElement.appendChild(styleEl);

/** @type {CSSStyleSheet} */ (styleEl.sheet).insertRule(
  '[interestfor]::interest-button { content: "" !important; margin-inline-start: 0 !important; min-inline-size: 0 !important; min-block-size: 0 !important; inline-size: 0 !important; block-size: 0 !important; }',
);
