const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');

class ProjextRollupStylesheetModulesFixerPlugin {
  constructor(options = {}, name = 'projext-rollup-plugin-stylesheet-modules-fixer') {
    this._options = extend(
      true,
      {
        include: [],
        exclude: [],
        modulesExportName: 'locals',
      },
      options
    );

    this.name = name;
    this.filter = rollupUtils.createFilter(
      this._options.include,
      this._options.exclude
    );

    this._expressions = {
      firstExport: /^(export\s*)/mi,
      line: /^((?:\w+(?: \w+)?)\s*=|default)\s*([\s\S]*?);$/ig,
      definition: /^(\w+)\s*([\S\s]*?)\s*=/,
      empty: /['|"]{2}/,
    };

    this.transform = this.transform.bind(this);
  }

  getOptions() {
    return this._options;
  }

  transform(code, filepath) {
    let result = null;
    if (this.filter && this.filter(filepath)) {
      const parts = this._getFileParts(code);
      const fileExports = this._getFileExports(parts.exports);
      const updatedFileExports = this._updateFileExports(fileExports);
      const statements = this._generateFileExports(updatedFileExports);
      result = {
        code: `${parts.contents}\n${statements}`,
        map: {
          mappings: '',
        },
      };
    }

    return result;
  }

  _getFileParts(code) {
    const time = Date.now();
    const separator = `__EXPORTS-BLOCK-SEPARATOR-${time}__`;
    const [contents, exports] = code
    .replace(this._expressions.firstExport, `${separator}$1`)
    .split(separator);

    return {
      contents,
      exports,
    };
  }

  _getFileExports(code) {
    let defaultExportIndex = -1;
    let modulesExportIndex = -1;
    const fileExports = code
    .split('export')
    .map((line) => line.trim())
    .filter((line) => !!line && line.match(this._expressions.line))
    .map((line, index) => {
      const info = {
        isDefault: false,
        name: '',
        value: '',
        type: null,
      };
      let [, name, value] = this._expressions.line.exec(line);
      this._expressions.line.lastIndex = 0;

      let endsWithSemi = value.endsWith(';');
      while (endsWithSemi) {
        value = value.substr(0, value.length - 1);
        endsWithSemi = value.endsWith(';');
      }

      let type;

      if (name === 'default') {
        defaultExportIndex = index;
        info.isDefault = true;
      } else {
        [, type, name] = this._expressions.definition.exec(line);
        this._expressions.definition.lastIndex = 0;
      }

      if (name === this._options.modulesExportName) {
        modulesExportIndex = index;
      }

      info.name = name;
      info.value = value;
      info.type = type;

      return info;
    });

    return {
      default: defaultExportIndex > -1 ? fileExports[defaultExportIndex] : null,
      modules: modulesExportIndex > -1 ? fileExports[modulesExportIndex] : null,
      all: fileExports,
    };
  }

  _updateFileExports(fileExports) {
    const modulesExport = fileExports.modules;
    let result;
    if (modulesExport) {
      const defaultExport = fileExports.default;
      if (defaultExport.value.match(this._expressions.empty)) {
        defaultExport.value = modulesExport.value;
      } else {
        defaultExport.value = [
          '(() => {',
          `  ${defaultExport.value}`,
          `  return ${modulesExport.value};`,
          '})()',
        ]
        .join('\n');
      }

      result = fileExports.all.filter((info) => info.name !== modulesExport.name);
    } else {
      result = fileExports.all;
    }

    return result;
  }

  _generateFileExports(fileExports) {
    return fileExports
    .map((info) => {
      const name = info.isDefault ? 'default' : `${info.type} ${info.name} =`;
      return `export ${name} ${info.value};`;
    })
    .join('\n');
  }
}

const stylesheetModulesFixer = (
  options,
  name
) => new ProjextRollupStylesheetModulesFixerPlugin(options, name);

module.exports = {
  ProjextRollupStylesheetModulesFixerPlugin,
  stylesheetModulesFixer,
};
