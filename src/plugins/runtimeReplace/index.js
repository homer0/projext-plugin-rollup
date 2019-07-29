const replace = require('rollup-plugin-replace');

class ProjextRollupRuntimeReplacePlugin {
  constructor(definitionsFn, name = 'projext-rollup-plugin-runtime-replace') {
    if (typeof definitionsFn !== 'function') {
      throw new Error('You need to provide a valid definitions function');
    }

    this.name = name;
    this._definitionsFn = definitionsFn;
    this._values = {};
    this._replace = this._createReplace();
    this._firstReload = false;

    this.buildStart = this.buildStart.bind(this);
    this.transform = this.transform.bind(this);
  }

  buildStart() {
    if (this._firstReload) {
      this._reloadValues();
    } else {
      this._firstReload = true;
    }
  }

  transform(code, filepath) {
    return this._replace.transform(code, filepath);
  }

  _reloadValues() {
    this._values = this._definitionsFn();
    return this._values;
  }

  _createReplace() {
    const keys = Object.keys(this._reloadValues());
    const values = keys.reduce(
      (settings, key) => Object.assign({}, settings, {
        [key]: () => this._getValue(key),
      }),
      {}
    );

    return replace({ values });
  }

  _getValue(key) {
    return this._values[key];
  }
}

const runtimeReplace = (definitionsFn, name) => new ProjextRollupRuntimeReplacePlugin(
  definitionsFn,
  name
);

module.exports = {
  ProjextRollupRuntimeReplacePlugin,
  runtimeReplace,
};
