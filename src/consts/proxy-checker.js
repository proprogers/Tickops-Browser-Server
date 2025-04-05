module.exports = {
  keyword: 'checker',
  defaultTimeout: 600000,
  urls: {
    ticketmaster: {
      main: 'https://www.ticketmaster.com/',
      auth: 'https://auth.ticketmaster.com/',
      event: 'https://www.ticketmaster.com/beacon-theatre-tickets-new-york/venue/483425',
    },
    axs: {
      main: 'https://www.axs.com/'
    }
  },
  potentialBanUrls: [
    /^https?:\/\/www1\.ticketmaster\.com\/(.+?\/)?event/,
    /^https?:\/\/www\.ticketmaster\.com\/(.+?\/)?event/,
    /^https?:\/\/concerts1\.livenation\.com\/event/,
    /^https?:\/\/www\.ticketweb\.com\/event/,
    /^https?:\/\/www\.eventbrite\.com\/e/,
    /^https?:\/\/www1\.ticketmaster\.com\/distil_identify_cookie/,
  ],
  selectors: {
    signInButton: 'button[aria-label="Sign In"]',
    closeSignInButton: 'button[data-bdd="x-button"]',
    spinner: '[class^="LoaderRing__LoadingContainer"]',
    discoverConcertsButton: 'a[href="/discover/concerts"]',
    seeTicketsButton: '.event-listing__item-cta',
    locationPanelHeader: '.location-panel header',
  }
};
