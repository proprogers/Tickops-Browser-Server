const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin');
const moment = require('moment-timezone');

class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts);
    this.timezone = null;
  }

  get name() {
    return 'timezone-setter'
  }

  async onPageCreated(page) {
    if (this.timezone) {
      await page.evaluateOnNewDocument(set, this.timezone);
    }
  }

  set(timezone) {
    this.timezone = {
      name: timezone,
      value: -moment.tz(timezone).utcOffset()
    };
  }
}

function set(timezone) {
  function convertToGMT(offset) {
    const format = (number) => (number < 10 ? '0' : '') + number;
    const sign = offset <= 0 ? '+' : '-';
    return sign + format(Math.abs(offset) / 60 | 0) + format(Math.abs(offset) % 60);
  }

  const resolvedOptions = Intl.DateTimeFormat().resolvedOptions();
  const {
    toJSON, getYear, getMonth, getHours, toString, getMinutes, getSeconds, getUTCMonth, getFullYear, getUTCHours,
    getUTCFullYear, getMilliseconds, getTimezoneOffset, getUTCMilliseconds, toLocaleTimeString, toLocaleDateString,
    toISOString, toGMTString, toUTCString, toTimeString, toDateString, getUTCSeconds, getUTCMinutes, toLocaleString,
    getDay, getUTCDate, getUTCDay, getDate
  } = Date.prototype;

  Object.defineProperties(Date.prototype, {
    _offset: {
      configurable: true,
      get() {
        return getTimezoneOffset.call(this)
      }
    },
    _date: {
      configurable: true,
      get() {
        return this._nd === undefined
          ? new DateOrig(this.getTime() + (this._offset - timezone.value) * 60 * 1000)
          : this._nd;
      }
    },
    toJSON: {
      value: function () {
        return toJSON.call(this._date);
      }
    },
    getDay: {
      value: function () {
        return getDay.call(this._date);
      }
    },
    getDate: {
      value: function () {
        return getDate.call(this._date);
      }
    },
    getYear: {
      value: function () {
        return getYear.call(this._date);
      }
    },
    getTimezoneOffset: {
      value: function () {
        return Number(timezone.value);
      }
    },
    getMonth: {
      value: function () {
        return getMonth.call(this._date);
      }
    },
    getHours: {
      value: function () {
        return getHours.call(this._date);
      }
    },
    getMinutes: {
      value: function () {
        return getMinutes.call(this._date);
      }
    },
    getSeconds: {
      value: function () {
        return getSeconds.call(this._date);
      }
    },
    getUTCDay: {
      value: function () {
        return getUTCDay.call(this._date);
      }
    },
    getUTCDate: {
      value: function () {
        return getUTCDate.call(this._date);
      }
    },
    getUTCMonth: {
      value: function () {
        return getUTCMonth.call(this._date);
      }
    },
    getFullYear: {
      value: function () {
        return getFullYear.call(this._date);
      }
    },
    toISOString: {
      value: function () {
        return toISOString.call(this._date);
      }
    },
    toGMTString: {
      value: function () {
        return toGMTString.call(this._date);
      }
    },
    toUTCString: {
      value: function () {
        return toUTCString.call(this._date);
      }
    },
    toDateString: {
      value: function () {
        return toDateString.call(this._date);
      }
    },
    toTimeString: {
      value: function () {
        return toTimeString.call(this._date);
      }
    },
    getUTCSeconds: {
      value: function () {
        return getUTCSeconds.call(this._date);
      }
    },
    getUTCMinutes: {
      value: function () {
        return getUTCMinutes.call(this._date);
      }
    },
    getUTCHours: {
      value: function () {
        return getUTCHours.call(this._date);
      }
    },
    getUTCFullYear: {
      value: function () {
        return getUTCFullYear.call(this._date);
      }
    },
    toLocaleString: {
      value: function () {
        return toLocaleString.call(this._date);
      }
    },
    getMilliseconds: {
      value: function () {
        return getMilliseconds.call(this._date);
      }
    },
    getUTCMilliseconds: {
      value: function () {
        return getUTCMilliseconds.call(this._date);
      }
    },
    toLocaleTimeString: {
      value: function () {
        return toLocaleTimeString.call(this._date);
      }
    },
    toLocaleDateString: {
      value: function () {
        return toLocaleDateString.call(this._date);
      }
    },
    toString: {
      value: function () {
        return toString.call(this._date)
          .replace(convertToGMT(this._offset), convertToGMT(timezone.value))
          .replace(/\(.*\)/, '(' + timezone.name.replace(/\//g, ' ') + ' Standard Time)');
      }
    },
  });

  Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
    'value': function () {
      return Object.assign(resolvedOptions, { 'timeZone': timezone.name });
    }
  });

  const DateOrig = Date;
  Date = function () {
    const date = new DateOrig(...arguments);
    return arguments.length > 1 || typeof (arguments[0]) === 'string'
      ? new DateOrig(date.getTime() - (date._offset - timezone.value) * 60 * 1000)
      : date;
  };
  Object.setPrototypeOf(DateOrig.prototype, Date.prototype);
  Date.UTC = DateOrig.UTC;
  Date.now = DateOrig.now;
  Date.parse = DateOrig.parse;
}

module.exports = function (pluginConfig) {
  return new Plugin(pluginConfig)
};
