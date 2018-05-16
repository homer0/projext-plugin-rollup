const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const zopfli = require('node-zopfli');

class RollupCompressionPlugin {
  constructor(options = {}, name) {
    this._options = extend(
      true,
      {
        folder: './dist',
        include: [],
        exclude: [],
      },
      options
    );

    this.name = name || 'rollup-plugin-compression';
    this._options.include = this._options.include || [/\.css$/i];
    this.filter = rollupUtils.createFilter(
      this._options.include,
      this._options.exclude
    );

    this.ongenerate = this.ongenerate.bind(this);
  }

  ongenerate() {
    return this._findAllTheFiles()
    .then((files) => Promise.all(files.map((file) => this._compressFile(file))))
    .catch((error) => {
      throw error;
    });
  }

  _findAllTheFiles() {
    return this._readDirectory(this._options.folder);
  }

  _readDirectory(directory) {
    const result = [];
    fs.readdirSync(directory)
    .filter((item) => !item.startsWith('.') && !item.endsWith('.gz'))
    .map((item) => path.join(directory, item))
    .filter((item) => this.filter(item))
    .forEach((item) => {
      if (fs.lstatSync(item).isDirectory()) {
        result.push(...this._readDirectory(item));
      } else {
        result.push(item);
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
