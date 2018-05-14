const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const RollupProjextUtils = require('../utils');

class RollupTemplatePlugin {
  constructor(options = {}, name) {
    this.options = extend(
      true,
      {
        template: '',
        output: '',
        scripts: [],
        scriptsAsync: true,
        scriptsOnBody: true,
        stylesheets: [],
        urls: [],
      },
      options
    );

    this.name = name || 'rollup-plugin-template';

    if (!this.options.template) {
      throw new Error(`${this.name}: You need to define the template file`);
    } else if (!this.options.output) {
      throw new Error(`${this.name}: You need to define an output file`);
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

    this._base = path.dirname(this.template);
    this._path = path.dirname(this.output);
    this._expressions = {
      url: /<%=\s*require\s*\(\s*['|"](.*?)['|"]\s*\).*?%>/ig,
      head: /([\t ]*)(<\/head>)/i,
      body: /([\t ]*)(<\/body>)/i,
    };
    this._createdDirectoriesCache = [];
    this._copyCache = [];

    this.ongenerate = this.ongenerate.bind(this);
  }

  ongenerate() {
    this._createdDirectoriesCache = [];
    this._copyCache = [];
    const async = this.options.scriptsAsync ? ' async="async"' : '';
    const scripts = this.options.scripts
    .map((url) => `<script type="text/javascript" src="${url}"${async}></script>`);
    const stylesheets = this.options.stylesheets
    .map((url) => `<link href="${url}" rel="stylesheet" />`);

    const head = [stylesheets];
    const body = [];
    if (this.options.scriptsOnBody) {
      body.push(...scripts);
    } else {
      head.push(...scripts);
    }

    let template = fs.readFileSync(this.options.template, 'utf-8');
    template = this._parseTemplateExpressions(template);

    if (head.length) {
      const headStr = head.join('\n');
      template = template.replace(this._expressions.head, `$1${headStr}\n$1$2`);
    }

    if (body.length) {
      const bodyStr = body.join('\n');
      template = template.replace(this._expressions.body, `$1${bodyStr}\n$1$2`);
    }

    fs.ensureDirSync(this._path);
    fs.writeFileSync(this.output, template);
  }

  _parseTemplateExpressions(template) {
    let newTemplate = template;
    this._extractPaths(template)
    .forEach((pathChange) => {
      const {
        file,
        line,
        info,
      } = pathChange;
      const settings = this.urls.find((setting) => setting.filter(file));
      if (settings) {
        const output = RollupProjextUtils.formatPlaceholder(settings.output, info);
        const outputDir = path.dirname(output);
        const url = RollupProjextUtils.formatPlaceholder(settings.url, info);
        const lineRegex = new RegExp(RollupProjextUtils.escapeRegex(line), 'ig');

        if (!this._createdDirectoriesCache.includes(outputDir)) {
          fs.ensureDirSync(outputDir);
          this._createdDirectoriesCache.push(outputDir);
        }

        if (!this._copyCache.includes(file)) {
          fs.copySync(file, output);
        }

        newTemplate = newTemplate.replace(lineRegex, url);
      }
    });

    return newTemplate;
  }

  _extractPaths(code) {
    const result = [];
    const saved = [];
    let match = this._expressions.url.exec(code);
    while (match) {
      const [line, url] = match;
      if (!saved.includes(line)) {
        saved.push(line);
        const file = path.join(this._base, url);
        if (fs.pathExistsSync(file)) {
          result.push({
            line,
            file,
            info: path.parse(file),
          });
        }
      }
      match = this._expressions.url.exec(code);
    }

    return result;
  }
}

const template = (options, name) => new RollupTemplatePlugin(options, name);

module.exports = {
  RollupTemplatePlugin,
  template,
};
