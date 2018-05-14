const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');

class RollupURLsPlugin {
  constructor(options = {}, name) {
    this.options = extend(
      true,
      {
        urls: [],
      },
      options
    );

    this.name = name || 'rollup-plugin-urls';

    if (!this.options.urls.length) {
      throw new Error(`${this.name}: You need to define the URLs`);
    }

    this.options.urls = this.options.urls.map((urlSettings) => Object.assign(
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

  load(filepath) {
    let result = null;
    const settings = this.options.urls.find((setting) => setting.filter(filepath));
    if (settings) {
      const info = path.parse(filepath);
      this._toCopy.push({
        from: filepath,
        to: this._formatName(settings.output, info),
      });

      const fileURL = this._formatName(settings.url, info);
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

  _formatName(placeholder, info) {
    return placeholder
    .replace(/\[name\]/g, info.name)
    .replace(/\[ext\]/g, info.ext.substr(1));
  }
}

const urls = (options, name) => new RollupURLsPlugin(options, name);

module.exports = {
  RollupURLsPlugin,
  urls,
};
