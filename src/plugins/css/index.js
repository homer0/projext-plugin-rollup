const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const insertStyle = require('./insertFn');

class RollupCSSPlugin {
  constructor(options = {}, name = 'rollup-plugin-css') {
    this._options = extend(
      true,
      {
        include: options.include || [/\.css$/i],
        exclude: [],
        insert: false,
        output: '',
        processor: null,
        insertFnName: '___$insertCSSBlocks',
      },
      options
    );

    if (!this._options.insert && !this._options.output) {
      this._options.output = !!this._options.output;
    }

    this.name = name;
    this.filter = rollupUtils.createFilter(
      this._options.include,
      this._options.exclude
    );

    this._files = [];
    this._toBundle = [];

    this.intro = this.intro.bind(this);
    this.transform = this.transform.bind(this);
    this.ongenerate = this.ongenerate.bind(this);
  }

  getOptions() {
    return this._options;
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
    if (this.filter(filepath)) {
      if (!this._files[filepath]) {
        this._files.push(filepath);
        const css = code.trim();
        if (css) {
          result = this._process(css, filepath)
          .then((processed) => {
            let cssCode;
            let rest;
            if (typeof processed === 'string') {
              cssCode = processed;
            } else if (typeof processed.css !== 'string') {
              throw new Error('You need to return the styles using the `css` property');
            } else {
              cssCode = processed.css;
              rest = processed;
              delete rest.css;
            }

            let nextStep;
            if (this._options.insert) {
              const escaped = JSON.stringify(cssCode);
              const insertCall = `${this._options.insertFnName}(${escaped})`;
              nextStep = this._transformResult(insertCall, rest);
            } else if (this._options.output === false) {
              nextStep = this._transformResult(processed, rest);
            } else {
              this._toBundle.push({
                filepath,
                css: cssCode,
              });
              nextStep = this._transformResult('', rest);
            }

            return nextStep;
          });
        } else {
          result = this._transformResult();
        }
      } else {
        result = this._transformResult();
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

    this._files = [];
    this._toBundle = [];
  }

  _process(css, filepath) {
    return this._options.processor ?
      this._options.processor(css, filepath) :
      Promise.resolve(css);
  }

  _transformResult(css = '\'\'', rest = null) {
    let code = `export default ${css};`;
    if (rest) {
      const restCode = Object.keys(rest)
      .map((name) => {
        const value = JSON.stringify(rest[name]);
        return `export const ${name} = ${value};`;
      })
      .join('\n');

      code = `${code}\n${restCode}`;
    }

    return Promise.resolve({
      code,
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
