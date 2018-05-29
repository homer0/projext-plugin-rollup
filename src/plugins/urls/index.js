const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const ProjextRollupUtils = require('../utils');

class ProjextRollupURLsPlugin {
  constructor(options = {}, name = 'projext-rollup-plugin-urls') {
    this._options = extend(
      true,
      {
        urls: [],
        stats: () => {},
      },
      options
    );

    this.name = name;

    this._validateOptions();

    this._options.urls = this._options.urls.map((urlSettings) => Object.assign(
      urlSettings,
      {
        filter: rollupUtils.createFilter(
          urlSettings.include,
          urlSettings.exclude
        ),
      }
    ));

    this._toCopy = [];
    this.load = this.load.bind(this);
    this.onwrite = this.onwrite.bind(this);
  }

  getOptions() {
    return this._options;
  }

  load(filepath) {
    let result = null;
    const settings = this._options.urls.find((setting) => setting.filter(filepath));
    if (settings) {
      const info = path.parse(filepath);
      this._toCopy.push({
        from: filepath,
        to: ProjextRollupUtils.formatPlaceholder(settings.output, info),
      });

      const fileURL = ProjextRollupUtils.formatPlaceholder(settings.url, info);
      result = `export default '${fileURL}';`;
    }

    return result;
  }

  onwrite() {
    this._toCopy.forEach((toCopy) => {
      fs.ensureDirSync(path.dirname(toCopy.to));
      fs.copySync(toCopy.from, toCopy.to);
      this._options.stats(this.name, toCopy.to, 'copied');
    });

    this._toCopy = [];
  }

  _validateOptions() {
    if (!this._options.urls.length) {
      throw new Error(`${this.name}: You need to define the URLs`);
    }
  }
}

const urls = (options, name) => new ProjextRollupURLsPlugin(options, name);

module.exports = {
  ProjextRollupURLsPlugin,
  urls,
};
