const { potentialBanUrls } = require('../../consts/proxy-checker');

function filterSignInBan(response) {
  const status = 506;
  if (response.status() === status) {
    const error = new Error('LogIn');
    error.status = status;
    throw error;
  }
}

function filterAxs(response) {
  const status = 456;
  if (response.status() === status) {
    const error = new Error('AXS ban');
    error.status = status;
    throw error;
  }
}

function filterBan(response) {
  const url = response.url();
  const status = response.status();
  const parentFrame = response.frame().parentFrame();
  const isFail = status === 401 || status === 405 || status === 409;

  if (!parentFrame && isFail) {
    const urlMatches = potentialBanUrls.some(r => r.exec(url));
    if (urlMatches) {
      const error = new Error('Ban');
      error.status = status;
      throw error;
    }
  }
}

module.exports = { filterAxs, filterSignInBan, filterBan };
