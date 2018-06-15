const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const ProjextRollupUtils = require('../utils');
const { stylesheetAssetsHelper } = require('./helper');

class ProjextRollupStylesheetAssetsPlugin {
  static get helper() {
    return stylesheetAssetsHelper;
  }

  constructor(options, name = 'projext-rollup-plugin-stylesheet-assets') {
    this._options = extend(
      true,
      {
        stylesheet: '',
        insertFnNames: options.insertFnNames || [
          '___$insertCSSBlocks',
          '___$insertStyle',
          '___$styleHelper',
        ],
        urls: [],
        stats: () => {},
      },
      options
    );

    this.name = name;

    this._validateOptions();

    this._options.urls = this._options.urls.map((urlSettings) => Object.assign(
      urlSettings,
      {
        filter: rollupUtils.createFilter(
          urlSettings.include,
          urlSettings.exclude
        ),
      }
    ));

    this._expressions = {
      url: /url\s*\(\s*(?:['|"])?(\.\.?\/.*?)(?:['|"])?\)/ig,
      map: /\/\*#.*?\*\//gi,
      js: /\.jsx?$/i,
      fullMap: /(\/\*# sourceMappingURL=[\w:/]+;base64,((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?) \*\/)/ig,
    };

    this._mapFragments = {
      prefix: '/*# sourceMappingURL=',
      header: 'data:application/json;base64,',
      sufix: '*/',
    };

    this._sourcesCache = {};
    this._createdDirectoriesCache = [];

    this.onwrite = this.onwrite.bind(this);
  }

  getOptions() {
    return this._options;
  }

  onwrite() {
    const { stylesheet } = this._options;
    if (fs.pathExistsSync(stylesheet)) {
      this._sourcesCache = {};
      this._createdDirectoriesCache = [];
      const code = fs.readFileSync(stylesheet, 'utf-8');
      const processed = stylesheet.match(this._expressions.js) ?
        this._processJS(code) :
        this._processCSS(code);

      fs.writeFileSync(stylesheet, processed);
    }
  }

  _validateOptions() {
    if (!this._options.stylesheet) {
      throw new Error(`${this.name}: You need to define the stylesheet path`);
    } else if (!this._options.urls.length) {
      throw new Error(`${this.name}: You need to define the URLs`);
    }
  }

  _processJS(code) {
    let newCode = code;
    const blocks = this._extractJSBlocks(code);
    blocks.forEach((block) => {
      const css = block.css
      .map((cssBlock) => this._updateCSSBlock(cssBlock).css)
      .join('\n');
      const escaped = JSON.stringify(css);
      const newBlock = `${block.fn}(${escaped});`;
      newCode = newCode.replace(block.match, newBlock);
    });

    return newCode;
  }

  _processCSS(code) {
    const blocks = this._extractCSSBlocks(code);
    const updated = blocks.map((cssBlock) => this._updateCSSBlock(cssBlock).css);
    return updated.join('\n\n');
  }

  _extractJSBlocks(code) {
    const result = [];
    const fns = this._options.insertFnNames
    .map((name) => ProjextRollupUtils.escapeRegex(name))
    .join('|');

    const time = Date.now();
    const separators = {
      block: `___STYLE-BLOCK-SEPARATOR-${time}__`,
      map: `__STYLE-MAP-SEPARATOR-${time}__`,
    };

    const fnsRegexStr = `(${fns}\\s*\\(\\s*['|"])`;
    const fnsRegex = new RegExp(fnsRegexStr, 'ig');
    const blockRegexStr = `^(${fns})\\s*\\(\\s*['|"](.*?)${separators.map}(?:\\\\n)?\\s*['|"]\\s*(?:,\\s*(\\{.*?\\}|['|"].*?['|"]|null))?\\s*\\);`;
    const blockRegex = new RegExp(blockRegexStr, 'ig');

    code
    .replace(fnsRegex, `${separators.block}$1`)
    .split(separators.block)
    .forEach((part) => {
      let map;
      const partCode = part.replace(this._expressions.fullMap, (match) => {
        map = match;
        return separators.map;
      });

      if (map) {
        let match = blockRegex.exec(partCode);
        while (match) {
          const [fullMatch, fn, css] = match;
          const parsed = JSON.parse(`{"css": "${css}"}`).css;

          result.push({
            match: fullMatch.replace(separators.map, map),
            css: [{
              css: parsed.trim(),
              map,
            }],
            fn,
          });

          match = blockRegex.exec(partCode);
        }
      }
    });

    return result;
  }

  _extractCSSBlocks(code) {
    const result = [];
    const { prefix, header, sufix } = this._mapFragments;
    code
    .split(prefix)
    .forEach((block, index) => {
      if (block.startsWith(header)) {
        const mapEnd = block.indexOf(sufix);
        const mapEndLength = mapEnd + sufix.length;
        const map = block.substr(0, mapEndLength);
        const previousIndex = index - 1;
        result[previousIndex].map = `${prefix}${map}`;
        const css = block.substr(mapEndLength).trim();
        if (css) {
          result.push({
            css,
            map: '',
          });
        }
      } else {
        result.push({
          css: block.trim(),
          map: '',
        });
      }
    });

    return result;
  }

  _updateCSSBlock(block) {
    const paths = this._getPathsForCSSBlock(block);
    let { css } = block;
    paths
    .filter((pathChange) => !!pathChange.absPath)
    .forEach((pathChange) => {
      const {
        absPath,
        line,
        query,
        info,
      } = pathChange;

      const settings = this._options.urls.find((setting) => setting.filter(absPath));
      if (settings) {
        const output = ProjextRollupUtils.formatPlaceholder(settings.output, info);
        const outputDir = path.dirname(output);
        const urlBase = ProjextRollupUtils.formatPlaceholder(settings.url, info);
        const url = `${urlBase}${query}`;
        const newLine = `url('${url}')`;
        const lineRegex = new RegExp(ProjextRollupUtils.escapeRegex(line.trim()), 'ig');

        if (!this._createdDirectoriesCache.includes(outputDir)) {
          fs.ensureDirSync(outputDir);
          this._createdDirectoriesCache.push(outputDir);
        }

        fs.copySync(absPath, output);
        this._options.stats(this.name, output);

        css = css.replace(lineRegex, newLine);
      }
    });

    return Object.assign({}, block, { css });
  }

  _getPathsForCSSBlock(block) {
    const { sources } = this._parseMap(block.map);
    const files = this._loadSources(sources);
    return this._extractPaths(block.css)
    .map((pathInfo) => {
      let absPath;
      files.find((file) => {
        const pathFromFile = path.join(file.info.dir, pathInfo.file);
        const found = pathInfo.lines.some((line) => file.code.includes(line)) &&
          fs.pathExistsSync(pathFromFile);

        if (found) {
          absPath = path.resolve(pathFromFile.replace(/\/\.\//ig, '/'));
        }

        return found;
      });

      return Object.assign({}, pathInfo, { absPath });
    });
  }

  _parseMap(map) {
    const { prefix, header, sufix } = this._mapFragments;
    const fullPrefix = `${prefix}${header}`;
    const codeRange = (map.length - fullPrefix.length - sufix.length);
    const code = map.substr(fullPrefix.length, codeRange).trim();
    const decoded = Buffer.from(code, 'base64').toString('ascii');
    return JSON.parse(decoded.trim());
  }

  _loadSources(sources) {
    return sources.map((source) => {
      if (!this._sourcesCache[source]) {
        const code = fs.readFileSync(source, 'utf-8');
        this._sourcesCache[source] = {
          file: source,
          code,
          info: path.parse(source),
        };
      }

      return this._sourcesCache[source];
    });
  }

  _extractPaths(code) {
    const result = [];
    const saved = [];
    let match = this._expressions.url.exec(code);
    while (match) {
      const [line, url] = match;
      if (!saved.includes(line)) {
        saved.push(line);
        const urlInfo = this._parseURL(url);
        result.push(Object.assign(
          urlInfo,
          {
            line,
            lines: [
              line,
              line.replace(/"/g, '\''),
            ],
            info: path.parse(urlInfo.file),
          }
        ));
      }

      match = this._expressions.url.exec(code);
    }

    return result;
  }

  _parseURL(url) {
    let file = url;
    let query = '';
    ['?', '#'].some((delimiter) => {
      let result = false;
      if (url.includes(delimiter)) {
        const delimiterIndex = url.indexOf(delimiter);
        file = url.substr(0, delimiterIndex);
        query = url.substr(delimiterIndex);
        result = true;
      }

      return result;
    });

    return {
      file,
      query,
    };
  }
}

const stylesheetAssets = (
  options,
  name
) => new ProjextRollupStylesheetAssetsPlugin(options, name);

module.exports = {
  ProjextRollupStylesheetAssetsPlugin,
  stylesheetAssets,
};
