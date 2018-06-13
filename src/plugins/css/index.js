const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const insertStyle = require('./insertFn');

class ProjextRollupCSSPlugin {
  constructor(options = {}, name = 'projext-rollup-plugin-css') {
    this._options = extend(
      true,
      {
        include: options.include || [/\.css$/i],
        exclude: [],
        insert: false,
        output: '',
        processor: null,
        insertFnName: '___$insertCSSBlocks',
        stats: () => {},
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
      if (!this._files.includes(filepath) || !this._options.output) {
        if (this._options.output) {
          this._files.push(filepath);
        }
        const css = code.trim();
        if (css) {
          result = this._process(css, filepath)
          .then((processed) => {
            let cssCode;
            let rest;
            let nextStep;
            if (typeof processed === 'string') {
              cssCode = processed;
            } else if (typeof processed.css !== 'string') {
              const error = new Error('You need to return the styles using the `css` property');
              nextStep = Promise.reject(error);
            } else {
              cssCode = processed.css;
              rest = processed;
              delete rest.css;
            }

            if (!nextStep) {
              if (this._options.insert) {
                const escaped = JSON.stringify(cssCode);
                const insertCall = `${this._options.insertFnName}(${escaped})`;
                nextStep = this._transformResult(insertCall, rest);
              } else if (this._options.output === false) {
                const escaped = JSON.stringify(cssCode);
                nextStep = this._transformResult(escaped, rest);
              } else {
                this._toBundle.push({
                  filepath,
                  css: cssCode,
                });
                nextStep = this._transformResult('', rest);
              }
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
    const { insert, output } = this._options;
    if (
      !insert &&
      output &&
      this._toBundle.length
    ) {
      const code = this._toBundle
      .map((file) => file.css)
      .join('\n');

      if (fs.pathExistsSync(output)) {
        const currentCode = fs.readFileSync(output, 'utf-8');
        fs.writeFileSync(output, `${currentCode}\n${code}`);
      } else {
        fs.ensureDirSync(path.dirname(output));
        fs.writeFileSync(output, code);
        this._options.stats(this.name, output, 'generated');
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

  _transformResult(css, rest = null) {
    const cssCode = css || '\'\'';
    let code = `export default ${cssCode};`;
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

const css = (options, name) => new ProjextRollupCSSPlugin(options, name);

module.exports = {
  ProjextRollupCSSPlugin,
  css,
};
