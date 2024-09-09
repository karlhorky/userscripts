// @ts-check

// ==UserScript==
// @name         Highlight All Occurrences of Selected Text
// @description  Highlight all occurrences of any text that has been selected on the page
// @author       James Wilson, Karl Horky
// @namespace    https://www.karlhorky.com/
// @version      2.0.1
// @match        https://*/*
// @match        http://*/*
// @grant        none
// @top-level-await
// ==/UserScript==
//
// Copyright James Wilson / neaumusic 2019
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// Donate on PayPal to James Wilson: https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=L5G6ATNAMJHC4&currency_code=USD

// @ts-nocheck
/* eslint-disable */

// -----------------------------------------
//               sync options
// -----------------------------------------

/**
 * @typedef {{
 *   minSelectionString: number;
 *   denyListedHosts: Array<Location["host"]>;
 *   gateKeys: Array<KeyboardEvent["key"]>; // 'Meta' CMD, 'Alt' Option
 *   matchWholeWord: boolean;
 *   matchCaseSensitive: boolean;
 *   highlightStylesObject: {
 *     [styleProperty: string]: string;
 *   };
 *   enableScrollMarkers: boolean;
 *   scrollMarkersDebounce: number;
 * }} Options
 */

const options = {
  minSelectionString: 1,
  denyListedHosts: [
    'localhost',
    'linkedin.com',
    'collabedit.com',
    'coderpad.io',
    'jsbin.com',
    'plnkr.co',
    'codesandbox.io',
    'replit.com',
    'youtube.com',
    'notion.so',
    'github1s.com',
    'track.toggl.com',
    'app.sqldbm.com',
    'github.dev',
  ],
  gateKeys: [], // 'Meta' CMD, 'Alt' Option
  matchWholeWord: false,
  matchCaseSensitive: false,
  highlightStylesObject: {
    'background-color': 'rgba(255,255,0,1)', // yellow 100%
    color: 'rgba(0,0,0,1)', // black 100%
  },
  enableScrollMarkers: true,
  scrollMarkersDebounce: 0,
};

// -----------------------------------------
//                helpers
// -----------------------------------------
/**
 * @param {string | undefined} selectionString
 * @param {Selection} selection
 * @returns {selectionString is string}
 */
function isSelectionValid(selectionString, selection) {
  return Boolean(
    selectionString &&
      selectionString.length >= options.minSelectionString &&
      selection.type !== 'None' &&
      selection.type !== 'Caret',
  );
}

function isWindowLocationValid(/** @type {Location} */ windowLocation) {
  // no deny listed hosts in window.location.host
  return !options.denyListedHosts.some((denyListedHost) =>
    windowLocation.host.includes(denyListedHost),
  );
}

function areKeysPressed(
  /** @type {KeyboardEvent["key"][]} */ pressedKeys = [],
) {
  // no gate keys not pressed
  return !options.gateKeys.some((gateKey) => !pressedKeys.includes(gateKey));
}

/**
 * for matching occurences with whole word and case sensitive options
 */
function occurrenceRegex(/** @type {string} */ selectionString) {
  return new RegExp(
    options.matchWholeWord ? `\\b${selectionString}\\b` : selectionString,
    options.matchCaseSensitive ? 'g' : 'ig',
  );
}
/**
 *
 * @param {ParentNode | null} ancestorNode
 * @returns {boolean}
 */
function isAncestorNodeValid(ancestorNode) {
  return (
    !ancestorNode ||
    (ancestorNode.nodeName !== 'SCRIPT' &&
      ancestorNode.nodeName !== 'STYLE' &&
      ancestorNode.nodeName !== 'HEAD' &&
      ancestorNode.nodeName !== 'TITLE' &&
      isAncestorNodeValid(ancestorNode.parentNode))
  );
}

/**
 * leading, selectionString, trailing
 *
 * trim parts maintained for offset analysis
 */
function trimRegex() {
  return /^(\s*)(\S+(?:\s+\S+)*)(\s*)$/;
}

function highlightName() {
  return 'selection_highlighter_highlighted_selection';
}

// function highlightStyles() {
//   return options.highlightStylesObject;
// }

function areScrollMarkersEnabled() {
  return options.enableScrollMarkers;
}

function scrollMarkersDebounce() {
  return options.scrollMarkersDebounce;
}

// function scrollMarkersCanvasClassName() {
//   return 'selection_highlighter_scroll_markers';
// }

/**
 * @typedef {Selection & {
 *   anchorNode: Node;
 *   focusNode: Node;
 * }} SelectionWithAnchorAndFocusNodes
 */

/**
 * @param {Selection | null} selection
 * @returns {selection is SelectionWithAnchorAndFocusNodes}
 */
function isSelectionWithAnchorAndFocusNodes(selection) {
  return !!selection && !!selection.anchorNode && !!selection.focusNode;
}

/** @type {string[]} */
let pressedKeys = [];

/** @type {CanvasRenderingContext2D} */
let scrollMarkersCanvasContext;
function highlightStyles() {
  return options.highlightStylesObject;
}
function addStyleElement() {
  const style = document.createElement('style');
  style.textContent = `
    ::highlight(${highlightName()}) {
      ${Object.entries(highlightStyles())
        .map(([styleName, styleValue]) => `${styleName}: ${styleValue};`)
        .join('\n      ')}
    }
    .${scrollMarkersCanvasClassName()} {
      pointer-events: none;
      position: fixed;
      z-index: 2147483647;
      top: 0;
      right: 0;
      width: 16px;
      height: 100vh;
    }
  `;
  return /** @type {Promise<void>} */ (
    new Promise((resolve) => {
      requestAnimationFrame(() => {
        document.body.appendChild(style);
        resolve();
      });
    })
  );
}
function scrollMarkersCanvasClassName() {
  return 'selection_highlighter_scroll_markers';
}
function addScrollMarkersCanvas() {
  const scrollMarkersCanvas = document.createElement('canvas');
  scrollMarkersCanvas.className = scrollMarkersCanvasClassName();
  scrollMarkersCanvas.width = 16 * devicePixelRatio || 1;
  scrollMarkersCanvas.height = window.innerHeight * devicePixelRatio || 1;

  window.addEventListener('resize', () => {
    requestAnimationFrame(() => {
      scrollMarkersCanvas.height = window.innerHeight * devicePixelRatio || 1;
    });
  });
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      document.body.appendChild(scrollMarkersCanvas);
      resolve(scrollMarkersCanvas.getContext('2d'));
    });
  });
}

function addPressedKeysListeners() {
  /** @type {KeyboardEvent['key'][]} */
  const pressedKeysInner = [];
  document.addEventListener('keydown', (e) => {
    const index = pressedKeysInner.indexOf(e.key);
    if (index === -1) {
      pressedKeysInner.push(e.key);
    }
  });
  document.addEventListener('keyup', (e) => {
    const index = pressedKeysInner.indexOf(e.key);
    if (index !== -1) {
      pressedKeysInner.splice(index, 1);
    }
  });
  window.addEventListener('blur', () => {
    pressedKeysInner.splice(0, pressedKeysInner.length);
  });
  return pressedKeysInner;
}

await addStyleElement();
scrollMarkersCanvasContext = await addScrollMarkersCanvas();
pressedKeys = addPressedKeysListeners();
document.addEventListener('selectstart', onSelectStart);
document.addEventListener('selectionchange', onSelectionChange);

/** @ts-ignore this is a new API */
const highlights = new Highlight();
/** @ts-ignore this is a new API */
CSS.highlights.set(highlightName(), highlights);

let isNewSelection = false;
/** @type {string} */
let lastSelectionString;
let latestRunNumber = 0;
/** @type {number} */
let drawMarkersTimeout;
function onSelectStart() {
  isNewSelection = true;
}
function onSelectionChange() {
  const selectionString = window.getSelection() + '';
  if (!isNewSelection) {
    if (selectionString === lastSelectionString) {
      return;
    }
  }
  isNewSelection = false;
  lastSelectionString = selectionString;
  const runNumber = ++latestRunNumber;

  if (!isWindowLocationValid(window.location)) return;
  if (!areKeysPressed(pressedKeys)) return;

  highlights.clear();
  highlight(runNumber);

  requestAnimationFrame(() => {
    scrollMarkersCanvasContext.clearRect(
      0,
      0,
      scrollMarkersCanvasContext.canvas.width,
      scrollMarkersCanvasContext.canvas.height,
    );
  });
  clearTimeout(drawMarkersTimeout);
  drawMarkersTimeout = window.setTimeout(() => {
    drawScrollMarkers(runNumber);
  }, scrollMarkersDebounce());
}

function highlight(/** @type {number} */ runNumber) {
  const selection = /** @type {SelectionWithAnchorAndFocusNodes} */ (
    window.getSelection()
  );
  if (!isSelectionWithAnchorAndFocusNodes(selection)) return;

  const trimmedSelection = String(selection).match(trimRegex());
  if (!trimmedSelection) return;

  const leadingSpaces = /** @type {string} */ (trimmedSelection[1]);
  const selectionString = /** @type {string} */ (trimmedSelection[2]);
  const trailingSpaces = /** @type {string} */ (trimmedSelection[3]);
  if (!isSelectionValid(selectionString, selection)) return;

  // https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
  const regex = occurrenceRegex(
    selectionString.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'),
  );

  const treeWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
  );
  /** @type {RegExpExecArray | null} */
  let match;
  while (treeWalker.nextNode() && runNumber === latestRunNumber) {
    if (!(treeWalker.currentNode instanceof Text)) continue;
    while ((match = regex.exec(treeWalker.currentNode.data))) {
      highlightOccurrences(treeWalker.currentNode);
    }
  }

  /**
   * @param {Text} textNode
   */
  function highlightOccurrences(textNode) {
    if (!isAncestorNodeValid(textNode.parentNode)) return;
    if (!match) return;

    const matchIndex = match.index;
    const anchorToFocusDirection = selection.anchorNode.compareDocumentPosition(
      selection.focusNode,
    );

    function isSelectionAcrossNodesLeftToRight() {
      return anchorToFocusDirection & Node.DOCUMENT_POSITION_FOLLOWING;
    }

    function isSelectionAcrossNodesRightToLeft() {
      return anchorToFocusDirection & Node.DOCUMENT_POSITION_PRECEDING;
    }

    function isUsersSelection() {
      if (isSelectionAcrossNodesLeftToRight()) {
        if (textNode === selection.anchorNode) {
          return (
            (selection.anchorNode.nodeType === Node.ELEMENT_NODE &&
              selection.anchorOffset === 0) ||
            selection.anchorOffset <= matchIndex - leadingSpaces.length
          );
        } else if (textNode === selection.focusNode) {
          return (
            (selection.focusNode.nodeType === Node.ELEMENT_NODE &&
              selection.focusOffset === 0) ||
            selection.focusOffset >=
              matchIndex + selectionString.length + trailingSpaces.length
          );
        } else {
          return (
            selection.anchorNode.compareDocumentPosition(textNode) &
              Node.DOCUMENT_POSITION_FOLLOWING &&
            selection.focusNode.compareDocumentPosition(textNode) &
              Node.DOCUMENT_POSITION_PRECEDING
          );
        }
      } else if (isSelectionAcrossNodesRightToLeft()) {
        if (textNode === selection.anchorNode) {
          return (
            (selection.anchorNode.nodeType === Node.ELEMENT_NODE &&
              selection.anchorOffset === 0) ||
            selection.anchorOffset >=
              matchIndex + selectionString.length + trailingSpaces.length
          );
        } else if (textNode === selection.focusNode) {
          return (
            (selection.focusNode.nodeType === Node.ELEMENT_NODE &&
              selection.focusOffset === 0) ||
            selection.focusOffset <= matchIndex - leadingSpaces.length
          );
        } else {
          return (
            selection.anchorNode.compareDocumentPosition(textNode) &
              Node.DOCUMENT_POSITION_PRECEDING &&
            selection.focusNode.compareDocumentPosition(textNode) &
              Node.DOCUMENT_POSITION_FOLLOWING
          );
        }
      } else {
        if (selection.anchorOffset < selection.focusOffset) {
          return (
            textNode === selection.anchorNode &&
            selection.anchorOffset <= matchIndex - leadingSpaces.length &&
            selection.focusOffset >=
              matchIndex + selectionString.length + trailingSpaces.length
          );
        } else if (selection.anchorOffset > selection.focusOffset) {
          return (
            textNode === selection.focusNode &&
            selection.focusOffset <= matchIndex - leadingSpaces.length &&
            selection.anchorOffset >=
              matchIndex + selectionString.length + trailingSpaces.length
          );
        }
      }
    }

    if (!isUsersSelection()) {
      const range = new Range();
      range.selectNode(textNode);
      range.setStart(textNode, matchIndex);
      range.setEnd(textNode, matchIndex + selectionString.length);
      highlights.add(range);
    }
  }
}

function drawScrollMarkers(/** @type {number} */ runNumber) {
  if (areScrollMarkersEnabled()) {
    for (const highlightedNode of highlights) {
      requestAnimationFrame(() => {
        const dpr = devicePixelRatio || 1;
        if (runNumber === latestRunNumber) {
          const clientRect = highlightedNode.getBoundingClientRect();
          if (!clientRect.width || !clientRect.height) return false;

          // window height times percent of element position in document
          const top =
            (window.innerHeight *
              (document.documentElement.scrollTop +
                clientRect.top +
                0.5 * (clientRect.top - clientRect.bottom))) /
            document.documentElement.scrollHeight;

          scrollMarkersCanvasContext.beginPath();
          scrollMarkersCanvasContext.lineWidth = 1 * dpr;
          scrollMarkersCanvasContext.strokeStyle = 'grey';
          scrollMarkersCanvasContext.fillStyle = 'yellow';
          scrollMarkersCanvasContext.strokeRect(
            0.5 * dpr,
            (top + 0.5) * dpr,
            15 * dpr,
            3 * dpr,
          );
          scrollMarkersCanvasContext.fillRect(
            1 * dpr,
            (top + 1) * dpr,
            14 * dpr,
            2 * dpr,
          );
        }
      });
    }
  }
}
