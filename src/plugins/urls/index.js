const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const RollupProjextUtils = require('../utils');

class RollupURLsPlugin {
  constructor(options = {}, name = 'rollup-plugin-urls') {
    this._options = extend(
      true,
      {
        urls: [],
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
    this.ongenerate = this.ongenerate.bind(this);
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
        to: RollupProjextUtils.formatPlaceholder(settings.output, info),
      });

      const fileURL = RollupProjextUtils.formatPlaceholder(settings.url, info);
      result = `export default '${fileURL}';`;
    }

    return result;
  }

  ongenerate() {
    this._toCopy.forEach((toCopy) => {
      fs.ensureDirSync(path.dirname(toCopy.to));
      fs.copySync(toCopy.from, toCopy.to);
    });
  }

  _validateOptions() {
    if (!this._options.urls.length) {
      throw new Error(`${this.name}: You need to define the URLs`);
    }
  }
}

const urls = (options, name) => new RollupURLsPlugin(options, name);

module.exports = {
  RollupURLsPlugin,
  urls,
};
