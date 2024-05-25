// ==UserScript==
// @name         Refined Foodora.at
// @description  Fix scrolling in cart area on foodora.at
// @version      1.0.0
// @author       Karl Horky
// @namespace    https://www.karlhorky.com/
// @match        https://www.foodora.at/*
// @grant        none
// ==/UserScript==

// @ts-nocheck

const rules = [
  `/* Make whole cart area scrollable */
  #cart {
    height: calc(100vh - 64px);
    overflow: scroll;
  }`,
  `/* Remove extra padding from top to increase vertical space available */
  .cart-summary {
    padding-top: 0;
  }`,
  `/* Remove extra vertical positioning of delivery / pickup toggle and delivery time estimate to increase vertical space available */
  .expedition-container {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }`,
  `/* Remove unnecessary "Delivery" heading to increase vertical space available */
  .cart-summary-header {
    display: none;
  }`,
  `/* Remove ridiculous max-height on cart items container */
  .cart-summary-items--wrapper {
    overflow: visible;
    /* Override inline style */
    max-height: none !important;
  }`,
];

const styleEl = document.createElement('style');
document.body.appendChild(styleEl);
rules.forEach((rule) => styleEl.sheet.insertRule(rule));
