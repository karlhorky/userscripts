// ==UserScript==
// @name         GitHub PR Title Character Counter
// @description  Show a counter for the number of characters in the GitHub PR title input
// @version      1.2.2
// @author       Karl Horky
// @namespace    https://www.karlhorky.com/
// @match        https://github.com/*/*/compare/*
// @match        https://github.com/*/*/issues/*
// @match        https://github.com/*/*/pull/*
// @grant        none
// ==/UserScript==

// ❗️ Deprecated: Use Refined GitHub instead:
// https://github.com/refined-github/refined-github/pull/7428

// Requires CSS Anchor Positioning to be enabled in Chrome
// chrome://flags/#enable-experimental-web-platform-features

// No-op CSS tagged template literal function to enable syntax
// highlighting and formatting
function css(
  /** @type {TemplateStringsArray} */ strings,
  /** @type {string[]} */ ...expressions
) {
  let result = /** @type {string} */ (strings[0]);

  for (let i = 1, l = strings.length; i < l; i++) {
    result += expressions[i - 1];
    result += strings[i];
  }

  return result;
}

// Create an observer instance linked to the callback function
const observer = new MutationObserver(function attachGithubPrTitleCounter() {
  const inputs = /** @type {NodeListOf<HTMLInputElement>} */ (
    document.querySelectorAll(
      'input[aria-label="Title"], input[aria-label="Issue title"], input[aria-labelledby="pull_request_title_header"], input[aria-label="Pull Request title"]',
    )
  );

  for (const input of inputs) {
    if (input.dataset.githubPrTitleCounterAttached) return;

    const counter = document.createElement('span');
    counter.setAttribute(
      'style',
      css`
        position: absolute;
        top: calc(anchor(--github-pr-title-counter-input top) + 4px);
        right: calc(anchor(--github-pr-title-counter-input right) + 5px);
        bottom: calc(anchor(--github-pr-title-counter-input bottom) + 4px);
        font-size: var(--text-body-size-medium, 0.875rem);
        background-color: #333;
        color: white;
        padding: 0 6px 1px;
        align-items: center;
        border-radius: 3px;
      `,
    );

    function createShowFunction() {
      // Create a private variable to store the timer
      /** @type {number | null} */
      let timeout = null;

      // Return a function that can access and modify the timer
      return function () {
        counter.textContent = String(input.value.length);
        counter.style.display = 'inline-flex';
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(function () {
          counter.style.display = 'none';
        }, 2000);
      };
    }

    const showForTwoSeconds = createShowFunction();

    showForTwoSeconds();

    input.addEventListener('input', showForTwoSeconds, true);
    input.addEventListener('keydown', showForTwoSeconds, true);
    input.addEventListener('keyup', showForTwoSeconds, true);
    input.addEventListener('keypress', showForTwoSeconds, true);
    input.addEventListener('focus', showForTwoSeconds, true);
    input.addEventListener('text', showForTwoSeconds, true);

    document.body.appendChild(counter);
    input.dataset.githubPrTitleCounterAttached = 'true';
    // @ts-expect-error CSS Anchor Positioning is experimental Chrome-only feature https://github.com/Fyrd/caniuse/issues/6471
    input.style.anchorName = '--github-pr-title-counter-input'; // Add this line
  }
});

// Start observing the target node for configured mutations
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
});
