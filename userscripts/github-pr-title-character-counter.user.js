// ==UserScript==
// @name         GitHub PR Title Character Counter
// @description  Show a counter for the number of characters in the GitHub PR title input
// @version      1.1.2
// @author       Karl Horky
// @namespace    https://www.karlhorky.com/
// @match        https://github.com/*/*/compare/*
// @match        https://github.com/*/*/issues/*
// @match        https://github.com/*/*/pull/*
// @grant        none
// ==/UserScript==

// Create an observer instance linked to the callback function
const observer = new MutationObserver(function attachGithubPrTitleCounter() {
  const inputs = /** @type {NodeListOf<HTMLInputElement>} */ (
    document.querySelectorAll(
      'input[aria-label="Title"], input[aria-label="Issue title"], input[aria-labelledby="pull_request_title_header"], input[aria-label="Pull Request title"]',
    )
  );

  for (const input of inputs) {
    const rect = input.getBoundingClientRect();

    if (
      !(
        rect.top > 0 &&
        rect.left > 0 &&
        rect.bottom < document.body.scrollHeight &&
        rect.right < document.body.scrollWidth
      )
    ) {
      return;
    }

    if (input.dataset.githubPrTitleCounterAttached) return;

    const counter = document.createElement('span');
    counter.setAttribute(
      'style',
      'position: absolute; font-size: 13px; background-color: #333; color: white; padding: 0 6px 1px; align-items: center; border-radius: 3px;',
    );
    counter.style.height = rect.height - 8 + 'px';
    counter.style.top = rect.top + 4 + 'px';
    counter.style.right = document.body.scrollWidth - rect.right + 5 + 'px';

    function createShowTemporarilyFunction() {
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

    const showTemporarily = createShowTemporarilyFunction();

    showTemporarily();

    input.addEventListener('input', showTemporarily, true);
    input.addEventListener('keydown', showTemporarily, true);
    input.addEventListener('keyup', showTemporarily, true);
    input.addEventListener('keypress', showTemporarily, true);
    input.addEventListener('focus', showTemporarily, true);
    input.addEventListener('text', showTemporarily, true);
    document.body.appendChild(counter);
    input.dataset.githubPrTitleCounterAttached = 'true';
  }
});

// Start observing the target node for configured mutations
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
});
