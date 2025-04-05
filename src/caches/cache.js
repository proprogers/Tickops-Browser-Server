class Cache {
  constructor({ model, interval, isUpdateOnChange = false }) {
    this._cache = null;
    this._updatePromise = null;
    this._update();
    setInterval(() => this._update(), interval);
    isUpdateOnChange && model && model.on('change', () => this._update());
  }

  _update() {
    this._updatePromise = this._setCache()
      .then(() => this._updatePromise = null)
      .catch((e) => {
        console.error(e);
        this._updatePromise = null;
      });
  }

  async _setCache() {
    this._cache = await this._getData();
  }

  async _getData() {
  }

  _getCache() {
    return this._cache;
  }

  async _waitForUpdate() {
    await this._updatePromise;
  }
}

module.exports = Cache;
