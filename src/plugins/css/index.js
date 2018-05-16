const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const insertStyle = require('./insert');

class RollupCSSPlugin {
  constructor(options = {}, name) {
    this._options = extend(
      true,
      {
        include: [],
        exclude: [],
        insert: false,
        output: '',
        processor: null,
        insertFnName: '___$insertCSSBlocks',
      },
      options
    );

    this._options.include = this._options.include || [/\.css$/i];
    this._filter = rollupUtils.createFilter(
      this._options.include,
      this._options.exclude
    );
    this.name = name || 'rollup-plugin-css';

    if (!this._options.insert && !this._options.output) {
      throw new Error(`${this.name}: You need to specify either insert or output`);
    }

    this._files = [];
    this._toBundle = [];

    this.intro = this.intro.bind(this);
    this.transform = this.transform.bind(this);
    this.ongenerate = this.ongenerate.bind(this);
  }

  intro() {
    let result = null;
    if (this._options.insert) {
      result = insertStyle.toString().replace(insertStyle.name, this._options.insertFnName);
    }

    return result;
  }

  transform(code, filepath) {
    let result = null;
    if (this._filter(filepath)) {
      if (this._files[filepath]) {
        const css = code.trim();
        if (css) {
          result = this._process(css)
          .then((processed) => {
            let nextStep;
            if (this._options.insert) {
              const escaped = JSON.stringify(processed);
              nextStep = this._formatTransform(`${this._options.insertFnName}(${escaped})`);
            } else {
              this._toBundle.push({
                filepath,
                css: processed,
              });
              nextStep = this._formatTransform();
            }

            return nextStep;
          });
        } else {
          result = this._formatTransform();
        }
      } else {
        result = this._formatTransform();
      }
    }

    return result;
  }

  ongenerate() {
    if (!this._options.insert && this._toBundle.length) {
      const { output } = this._options;

      const code = this._toBundle
      .map((file) => file.css)
      .join('\n');

      if (fs.pathExistsSync(output)) {
        const currentCode = fs.readFileSync(output, 'utf-8');
        fs.writeFileSync(output, `${currentCode}\n${code}`);
      } else {
        fs.ensureDirSync(path.dirname(output));
        fs.writeFileSync(output, code);
      }
    }
  }

  _process(css) {
    return this._options.processor ?
      this._options.processor(css) :
      Promise.resolve(css);
  }

  _transformResult(code = '\'\'') {
    return Promise.resolve({
      code: `export default ${code};`,
      map: {
        mappings: '',
      },
    });
  }
}

const css = (options, name) => new RollupCSSPlugin(options, name);

module.exports = {
  RollupCSSPlugin,
  css,
};
