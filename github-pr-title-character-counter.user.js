// ==UserScript==
// @name         GitHub PR Title Character Counter
// @description  Show a counter for the number of characters in the GitHub PR title input
// @version      1.0.0
// @author       Karl Horky
// @namespace    https://www.karlhorky.com/
// @match        https://github.com/*/*/compare/*
// @match        https://github.com/*/*/pull/*
// @grant        none
// ==/UserScript==

const inputs = document.querySelectorAll('input[aria-label="Title"]');

for (const input of inputs) {
  const counter = document.createElement('span');
  const rect = input.getBoundingClientRect();
  counter.setAttribute(
    'style',
    'position: absolute; font-size: 13px; background-color: #333; color: white; padding: 1px 6px; border-radius: 2px;',
  );
  counter.style.top = rect.top + 5 + 'px';
  counter.style.right = document.body.scrollWidth - rect.right + 5 + 'px';
  const update = function () {
    counter.textContent = input.value.length;
    counter.style.display = 'inline';
    if (arguments.callee.timer) {
      clearTimeout(arguments.callee.timer);
    }
    arguments.callee.timer = setTimeout(function () {
      counter.style.display = 'none';
    }, 2000);
  };
  update();
  input.addEventListener('input', update, true);
  input.addEventListener('keydown', update, true);
  input.addEventListener('keyup', update, true);
  input.addEventListener('keypress', update, true);
  input.addEventListener('focus', update, true);
  input.addEventListener('text', update, true);
  document.body.appendChild(counter);
}
