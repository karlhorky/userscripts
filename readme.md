# Userscripts

> Scripts for Violentmonkey / Greasemonkey / Tampermonkey that change the behavior of web apps

## Installation

Install with the GitHub raw URL of a userscript (click on the "Raw" button at the top right when viewing a single file).

## Scripts

### Add TMDb links to IMDb

This userscript adds links to themoviedb.org on IMDb pages:

<img src="add-tmdb-links-to-imdb.png" alt="Screenshot of IMDb page with links to TMDb">

### Refined Mjam.net - Fix Ridiculous Scrolling Area

The delivery service mjam.net in Austria has an incredibly bad UX, with only a tiny vertical slice in the UI being scrollable in the cart area showing your items on the right:

<video src="refined-mjam-net-before.mp4" />

`refined-mjam-net` removes the `overflow: hidden` and `height` on this area and reduces the size of other items eating vertical space:

<video src="refined-mjam-net-after.mp4" />

## Additional Scripts

Additional userscripts are contained in their own repositories:

- [`refined-gmail`](https://github.com/karlhorky/refined-gmail-userscript)
- [`refined-notion`](https://github.com/karlhorky/refined-notion-userscript)
