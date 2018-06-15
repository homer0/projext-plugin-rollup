const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const zopfli = require('node-zopfli');
const { deferred } = require('wootils/shared');

class ProjextRollupCompressionPlugin {
  constructor(options = {}, name = 'projext-rollup-plugin-compression') {
    this._options = extend(
      true,
      {
        folder: './dist',
        include: [],
        exclude: [],
        stats: () => {},
      },
      options
    );

    this.name = name;

    this.filter = rollupUtils.createFilter(
      this._options.include,
      this._options.exclude
    );

    this.onwrite = this.onwrite.bind(this);
  }

  getOptions() {
    return this._options;
  }

  onwrite() {
    return Promise.all(this._findAllTheFiles().map((file) => this._compressFile(file)));
  }

  _findAllTheFiles() {
    return this._readDirectory(this._options.folder);
  }

  _readDirectory(directory) {
    const result = [];
    fs.readdirSync(directory)
    .filter((item) => !item.startsWith('.') && !item.endsWith('.gz'))
    .map((item) => {
      const itemPath = path.join(directory, item);
      return {
        path: itemPath,
        isDirectory: fs.lstatSync(itemPath).isDirectory(),
      };
    })
    .filter((item) => item.isDirectory || this.filter(item.path))
    .forEach((item) => {
      if (item.isDirectory) {
        result.push(...this._readDirectory(item.path));
      } else {
        result.push(item.path);
      }
    });

    return result;
  }

  _compressFile(filepath) {
    const statsDeferred = deferred();
    this._options.stats(statsDeferred.promise);
    return new Promise((resolve, reject) => {
      const newFilepath = `${filepath}.gz`;
      fs.createReadStream(filepath)
      .on('error', reject)
      .pipe(zopfli.createGzip())
      .pipe(fs.createWriteStream(newFilepath))
      .on('error', (error) => {
        statsDeferred.reject(error);
        reject(error);
      })
      .on('close', () => {
        statsDeferred.resolve({
          plugin: this.name,
          filepath: newFilepath,
        });
        resolve({
          original: filepath,
          compressed: newFilepath,
        });
      });
    });
  }
}

const compression = (options, name) => new ProjextRollupCompressionPlugin(options, name);

module.exports = {
  ProjextRollupCompressionPlugin,
  compression,
};
