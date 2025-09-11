// ==UserScript==
// @name         Disable GitHub Unread Notifications view
// @description  Redirect away from Notifications "Unread" view
// @version      1.1.2
// @author       Karl Horky
// @namespace    https://www.karlhorky.com/
// @match        https://github.com/notifications?query=*
// @grant        none
// ==/UserScript==

const { searchParams } = new URL(document.location.href);
searchParams.delete('query');
document.location.href = `/notifications${searchParams.toString() ? `?${searchParams}` : ''}`;
