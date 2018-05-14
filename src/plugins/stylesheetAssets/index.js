const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const RollupProjextUtils = require('../utils');

class RollupStylesheetAssetsPlugin {
  constructor(options = {}, name) {
    this.options = extend(
      true,
      {
        stylesheet: '',
        insertFnNames: options.insertFnNames || [
          '___$insertCSSBlocks',
          '___$insertStyle',
        ],
        urls: [],
      },
      options
    );

    this.name = name || 'rollup-plugin-stylesheet-assets';

    if (!this.options.stylesheet) {
      throw new Error(`${this.name}: You need to define the stylesheet path`);
    } else if (!this.options.urls.length) {
      throw new Error(`${this.name}: You need to define the URLs`);
    }

    this.options.urls = this.options.urls.map((urlSettings) => Object.assign(
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
    };

    this._mapFragments = {
      prefix: '/*# sourceMappingURL=',
      header: 'data:application/json;base64,',
      sufix: '*/',
    };

    this._sourcesCache = {};
    this._createdDirectoriesCache = [];
    this._copyCache = [];

    this.ongenerate = this.ongenerate.bind(this);
  }

  ongenerate() {
    const { stylesheet } = this.options;
    if (fs.pathExistsSync(stylesheet)) {
      this._sourcesCache = {};
      this._createdDirectoriesCache = [];
      this._copyCache = [];
      const code = fs.readFileSync(stylesheet, 'utf-8');
      const processed = stylesheet.match(this._expressions.js) ?
        this._processJS(code) :
        this._processCSS(code);

      fs.writeFileSync(stylesheet, processed);
    }
  }

  _processJS(code) {
    let newCode = code;
    const blocks = this._extractJSBlocks(code);
    blocks.forEach((block) => {
      const css = block.css
      .map((cssBlock) => this._updateCSSBlock(cssBlock).css)
      .join('\n\n');
      const escaped = JSON.stringify(css);
      const newBlock = `${block.fn}(${escaped})\n\n`;
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
    const fns = this.options.insertFnNames
    .map((name) => RollupProjextUtils.escapeRegex(name))
    .join('|');

    const regexStr = `(${fns})\\s*\\(\\s*['|"](.*?)['|"]\\s*\\);\\s*\\n`;
    const regex = new RegExp(regexStr, 'ig');
    let match = regex.exec(code);
    while (match) {
      const [fullMatch, fn, css] = match;
      let parsed;
      try {
        parsed = (JSON.parse(`{"css": "${css}"}`).css);
      } catch (ignore) {
        parsed = css;
      }

      result.push({
        match: fullMatch,
        css: this._extractCSSBlocks(parsed),
        fn,
      });

      match = regex.exec(code);
    }

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
    paths.forEach((pathChange) => {
      const {
        absPath,
        line,
        file,
        query,
        info,
      } = pathChange;

      const settings = this.options.urls.find((setting) => setting.filter(file));
      if (settings) {
        const output = RollupProjextUtils.formatPlaceholder(settings.output, info);
        const outputDir = path.dirname(output);
        const urlBase = RollupProjextUtils.formatPlaceholder(settings.url, info);
        const url = `${urlBase}${query}`;
        const newLine = `url('${url}')`;
        const lineRegex = new RegExp(RollupProjextUtils.escapeRegex(line.trim()), 'ig');

        if (!this._createdDirectoriesCache.includes(outputDir)) {
          fs.ensureDirSync(outputDir);
          this._createdDirectoriesCache.push(outputDir);
        }

        if (!this._copyCache.includes(absPath)) {
          this._copyCache.push(absPath);
          fs.copySync(absPath, output);
        }

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
          absPath = pathFromFile.replace(/\/\.\//ig, '/');
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
    return JSON.parse(decoded);
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

const stylesheetAssets = (options, name) => new RollupStylesheetAssetsPlugin(options, name);

module.exports = {
  RollupStylesheetAssetsPlugin,
  stylesheetAssets,
};
