const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const zopfli = require('node-zopfli');

class RollupCompressionPlugin {
  constructor(options = {}, name = 'rollup-plugin-compression') {
    this._options = extend(
      true,
      {
        folder: './dist',
        include: [],
        exclude: [],
      },
      options
    );

    this.name = name;

    this._validateOptions();

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
    return this._findAllTheFiles().map((file) => this._compressFile(file));
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
    return new Promise((resolve, reject) => {
      const newFilepath = `${filepath}.gz`;
      fs.createReadStream(filepath)
      .on('error', reject)
      .pipe(zopfli.createGzip())
      .pipe(fs.createWriteStream(newFilepath))
      .on('error', reject)
      .on('close', () => resolve({
        original: filepath,
        compressed: newFilepath,
      }));
    });
  }
}

const compression = (options, name) => new RollupCompressionPlugin(options, name);

module.exports = {
  RollupCompressionPlugin,
  compression,
};
