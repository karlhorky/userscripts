// ==UserScript==
// @name         Tracking Param Stripper
// @description  Drop the UTM params from a URL when the page loads.
// @extra        Cuz you know they're all ugly n shit.
// @version      1.5.0
// @author       Paul Irish, Karl Horky
// @namespace    http://github.com/paulirish
// @include      http*://*
// ==/UserScript==

// From https://gist.github.com/paulirish/626834

// Updates:
// - 2025-07-21 Add matching for rcm (LinkedIn)
// - 2025-07-21 Match hostnames
// - 2025-07-20 Fix problems reported by ESLint and TS
// - 2025-07-20 Add matching for mc_cid (Mailchimp)
// - 2021-03-20 Add matching for vgo_ee (ActiveCampaign)
// - 2020-02-07 Add matching for mkt_tok (Marketo)
// - 2020-01-14 Add matching for ck_subscriber_id (ConvertKit)

const trackingQueryParamPatterns = /** @type {[string, true | string[]][]} */ ([
  ['ck_subscriber_id', true],
  ['mc_cid', true],
  ['mkt_tok', true],
  ['rcm', ['www.linkedin.com']],
  ['utm_', true],
  ['vgo_ee', true],
])
  .filter(([, hosts]) => {
    return hosts === true || hosts.includes(window.location.hostname);
  })
  .map(([pattern]) => pattern)
  .join('|');

if (
  trackingQueryParamPatterns &&
  new RegExp(`(${trackingQueryParamPatterns})`).test(window.location.search)
) {
  // thx @cowboy for the revised hash param magic.
  const oldUrl = window.location.href;
  const newUrl = oldUrl.replace(
    /\?([^#]*)/,
    (substring, /** @type {string} */ search) => {
      search = search
        .split('&')
        .filter(
          (queryParamName) =>
            !new RegExp(`^(${trackingQueryParamPatterns})`).test(
              queryParamName,
            ),
        )
        .join('&');
      return search ? '?' + search : '';
    },
  );

  if (newUrl !== oldUrl) {
    window.history.replaceState({}, '', newUrl);
  }
}
