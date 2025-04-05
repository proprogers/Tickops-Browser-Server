const { defaultTimeout } = require('../../consts/proxy-checker');

function newWindowOpen() {
  window.open = (url) => {
    console.log('tickets', url)
  }
}

async function waitForFrameNavigated({ page, url }) {
  return new Promise(async (resolve, reject) => {
    async function onFrameNavigated(frame) {
      if (frame.url().startsWith(url)) {
        page.off('framenavigated', onFrameNavigated);
        resolve(frame);
      }
    }

    page.on('framenavigated', onFrameNavigated);
    page.once('error', reject);
    setTimeout(() => reject(new Error('Frame navigation timeout')), defaultTimeout);
  });
}

function waitForConsoleEvent({ page, filter }) {
  return new Promise((resolve, reject) => {
    setTimeout(function () {
      page.removeListener('console', onConsoleEvent);
      reject(new Error('Console event timeout')); // TODO: unhandled
    }, 10000);

    async function onConsoleEvent(console) {
      if (console.type() === 'log') {
        const text = console.text();
        if (filter(text)) {
          page.removeListener('console', onConsoleEvent);
          resolve(text);
        }
      }
    }

    page.on('console', onConsoleEvent);
  })
}

module.exports = { newWindowOpen, waitForConsoleEvent, waitForFrameNavigated };
