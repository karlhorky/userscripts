// ==UserScript==
// @name         Tracking Param Stripper
// @description  Drop the UTM params from a URL when the page loads.
// @extra        Cuz you know they're all ugly n shit.
// @version      1.4.0
// @author       Paul Irish, Karl Horky
// @namespace    http://github.com/paulirish
// @include      http*://*
// ==/UserScript==

// From https://gist.github.com/paulirish/626834

// Updates:
// - 2025-07-20 Fix problems reported by ESLint and TS
// - 2025-07-20 Added matching for mc_cid (Mailchimp)
// - 2021-03-20 Added matching for vgo_ee (ActiveCampaign)
// - 2020-02-07 Added matching for mkt_tok (Marketo)
// - 2020-01-14 Added matching for ck_subscriber_id (ConvertKit)

// You can install this user script by downloading this script,
// going to about: extensions, turning on developer mode and dragging and dropping
// this file onto the window. That'll install it.

// lastly, if your site / marketing funnel uses these tracking tokens. you can clean up your users URLs
// look at the comments below on correct installation to integrate with __gaq.push

const trackingQueryParamPatterns =
  'utm_|ck_subscriber_id|mc_cid|mkt_tok|vgo_ee';

if (
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
