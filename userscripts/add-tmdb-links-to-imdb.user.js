// ==UserScript==
// @name            Add TMDb links to IMDb
// @description     Add links to themoviedb.org on IMDb pages
// @version         1.1.1
// @author          Karl Horky
// @namespace       https://www.karlhorky.com/
// @match           https://www.imdb.com/title/*
// @grant           GM.xmlHttpRequest
// @top-level-await
// ==/UserScript==

function gmXhr(
  /** @type {string} */ url,
  /** @type {Omit<Parameters<typeof GM.xmlHttpRequest>[0], 'url' | 'onload'>} */ options,
) {
  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line no-undef -- Avoid false positive with `no-undef` and global variables - typescript-eslint also recommends against this rule: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
      GM.xmlHttpRequest({
        ...options,
        url,
        onload: function onload(response) {
          if (response.status === 200) {
            const responseText =
              options.headers?.Accept === 'application/json'
                ? JSON.parse(response.responseText)
                : response.responseText;
            return resolve(responseText);
          }
          return reject(
            new Error(`Failed to fetch ${url} (status ${response.status})`),
          );
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}

const h1 = document.querySelector('h1[data-testid="hero__pageTitle"]');

if (!h1) {
  throw new Error(
    'Could not find movie title element `h1[data-testid="hero__pageTitle"]`',
  );
}

if (!h1.firstChild) {
  throw new Error(
    'Movie title element `h1[data-testid="hero__pageTitle"]` has no child nodes',
  );
}

const movieTitle = /** @type {HTMLSpanElement} */ (h1.firstChild).innerText;

console.log(`https://www.themoviedb.org/search/trending?query=${movieTitle}`);

const json = /**
  * @type {{
  *   results: {
  *     id: number;
  *     title: string;
  *     name: string;
  *     media_type: string;
  *     release_date: string;
  *     first_air_date: string;
  *   }[];
  * }}
  */ (
  await gmXhr(
    `https://www.themoviedb.org/search/trending?query=${movieTitle}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Referer: 'https://www.themoviedb.org/search',
        'x-requested-with': 'XMLHttpRequest',
      },
    },
  )
);

let linksHtml =
  '<h4 style="margin: 16px 0 12px; color: currentColor; font-size: 22px;">TMDb Results</h4>';
json.results.forEach((result) => {
  if (typeof result === 'string') return;

  const {
    media_type: mediaType,
    id,
    title,
    name,
    release_date: releaseDate,
    first_air_date: firstAirDate,
  } = result;

  if (!/^tv|movie$/.test(mediaType)) return;

  const link = `https://www.themoviedb.org/${mediaType}/${id}`;

  linksHtml += `<a href="${link}" class="ipc-link" style="margin-bottom: 5px; color: currentColor; display: block;">${
    title || name
  } (${releaseDate || firstAirDate})</a>`;
});

h1.insertAdjacentHTML('afterend', linksHtml + '<br />');
