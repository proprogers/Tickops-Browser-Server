class RequestInterceptor {
  constructor(page) {
    this._page = page;
    this._onResponse = null;
    page.on('request', this._onRequest);
  }

  _onRequest(request) {
    if (request.resourceType() !== 'image') {
      request.continue();
      return;
    }
    request.respond({
      content: 'image/png',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: ''
    });
  }

  waitFor(filter) {
    if (this._onResponse) {
      this._page.off('response', this._onResponse);
    }
    return new Promise((resolve, reject) => {
      this._onResponse = (response) => {
        try {
          filter(response);
        } catch (e) {
          reject(e);
        }
      };
      this._page.on('response', this._onResponse);
    });
  }
}

module.exports = RequestInterceptor;
