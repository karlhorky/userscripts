// ==UserScript==
// @name         Disable GitHub Unread Notifications view
// @description  Redirect away from Notifications "Unread" view
// @version      1.1.3
// @author       Karl Horky
// @namespace    https://www.karlhorky.com/
// @match        https://github.com/notifications?query=*
// @grant        none
// ==/UserScript==

const { searchParams } = new URL(document.location.href);
const queryParam = searchParams.get('query');

if (queryParam === 'is:unread') {
  const allButton = document.querySelector(
    'ul[aria-label="Notification filters"].SegmentedControl button[name="query"][value=""]',
  );
  if (
    allButton &&
    allButton instanceof HTMLButtonElement &&
    allButton.textContent.includes('All')
  ) {
    allButton.click();
  }
} else if (queryParam === '') {
  // Disallow empty `query` param, eg. `?query=`
  searchParams.delete('query');
  document.location.href = `/notifications${searchParams.toString() ? `?${searchParams}` : ''}`;
}
