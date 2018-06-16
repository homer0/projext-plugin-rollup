const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const ProjextRollupUtils = require('../utils');

class ProjextRollupTemplatePlugin {
  constructor(options = {}, name = 'projext-rollup-plugin-template') {
    this._options = extend(
      true,
      {
        template: '',
        output: '',
        scripts: [],
        scriptsAsync: true,
        scriptsOnBody: true,
        stylesheets: [],
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

    this._base = path.dirname(this._options.template);
    this._path = path.dirname(this._options.output);
    this._expressions = {
      url: /<%=\s*require\s*\(\s*['|"](.*?)['|"]\s*\).*?%>/ig,
      head: /([\t ]*)(<\/head>)/i,
      body: /([\t ]*)(<\/body>)/i,
    };
    this._createdDirectoriesCache = [];

    this.onwrite = this.onwrite.bind(this);
  }

  getOptions() {
    return this._options;
  }

  onwrite() {
    this._createdDirectoriesCache = [];
    const async = this._options.scriptsAsync ? ' async="async"' : '';
    const scripts = this._options.scripts
    .map((url) => `<script type="text/javascript" src="${url}"${async}></script>`);
    const stylesheets = this._options.stylesheets
    .map((url) => `<link href="${url}" rel="stylesheet" />`);

    const head = [];
    head.push(...stylesheets);
    const body = [];
    if (this._options.scriptsOnBody) {
      body.push(...scripts);
    } else {
      head.push(...scripts);
    }

    let template = fs.readFileSync(this._options.template, 'utf-8');
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
    fs.writeFileSync(this._options.output, template.trim());
    this._options.stats(this.name, this._options.output);
  }

  _validateOptions() {
    if (!this._options.template) {
      throw new Error(`${this.name}: You need to define the template file`);
    } else if (!this._options.output) {
      throw new Error(`${this.name}: You need to define an output file`);
    }
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
      const settings = this._options.urls.find((setting) => setting.filter(file));
      if (settings) {
        const output = ProjextRollupUtils.formatPlaceholder(settings.output, info);
        const outputDir = path.dirname(output);
        const url = ProjextRollupUtils.formatPlaceholder(settings.url, info);
        const lineRegex = new RegExp(ProjextRollupUtils.escapeRegex(line), 'ig');

        if (!this._createdDirectoriesCache.includes(outputDir)) {
          fs.ensureDirSync(outputDir);
          this._createdDirectoriesCache.push(outputDir);
        }

        fs.copySync(file, output);
        this._options.stats(this.name, output);
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

const template = (options, name) => new ProjextRollupTemplatePlugin(options, name);

module.exports = {
  ProjextRollupTemplatePlugin,
  template,
};
