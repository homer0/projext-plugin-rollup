const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const helperFn = require('./helperFn');

class ProjextRollupStylesheetAssetsHelperPlugin {
  constructor(options = {}, name = 'projext-rollup-plugin-stylesheet-assets-helper') {
    this._options = extend(
      true,
      {
        include: options.include || [/\.(s?css|sass)$/i],
        exclude: [],
        fnName: '___$styleHelper',
      },
      options
    );

    this.name = name;
    this.filter = rollupUtils.createFilter(
      this._options.include,
      this._options.exclude
    );

    this._expressions = {
      code: /^(?:export\s*default|module\.exports\s*=\s*)(.*?);$/ig,
    };

    this.intro = this.intro.bind(this);
    this.transform = this.transform.bind(this);
  }

  intro() {
    return helperFn.toString().replace(helperFn.name, this._options.fnName);
  }

  transform(code, filepath) {
    let result = null;
    if (this.filter(filepath) && code.match(this._expressions.code)) {
      const styles = [];
      let match = this._expressions.code.exec(code);
      while (match) {
        const [, style] = match;
        styles.push(style.trim());
        match = this._expressions.code.exec(code);
      }

      const [style] = styles;
      result = {
        code: `export default ${this._options.fnName}(${style});`,
        map: {
          mappings: '',
        },
      };
    }

    return result;
  }
}

const stylesheetAssetsHelper = (
  options,
  name
) => new ProjextRollupStylesheetAssetsHelperPlugin(options, name);

module.exports = {
  ProjextRollupStylesheetAssetsHelperPlugin,
  stylesheetAssetsHelper,
};
