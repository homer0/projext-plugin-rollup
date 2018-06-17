const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const ProjextRollupUtils = require('../utils');
/**
 * This is a Rollup plugin that generates an HTML file and injects a given list of scripts and
 * stylesheets.
 */
class ProjextRollupTemplatePlugin {
  /**
   * @param {ProjextRollupTemplatePluginOptions} [options={}]
   * The options to customize the plugin behaviour.
   * @param {String} [name='projext-rollup-plugin-template']
   * The name of the plugin's instance.
   */
  constructor(options = {}, name = 'projext-rollup-plugin-template') {
    /**
     * The plugin options.
     * @type {ProjextRollupTemplatePluginOptions}
     * @access protected
     * @ignore
     */
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
    /**
     * The name of the plugin's instance.
     * @type {string}
     */
    this.name = name;
    // Validate the received options before doing anything else.
    this._validateOptions();
    /**
     * Loop all `urls` options and create a filter function with their `include` and `exclude`
     * properties.
     */
    this._options.urls = this._options.urls.map((urlSettings) => Object.assign(
      urlSettings,
      {
        filter: rollupUtils.createFilter(
          urlSettings.include,
          urlSettings.exclude
        ),
      }
    ));
    /**
     * The base directory where the template file is located.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._base = path.dirname(this._options.template);
    /**
     * The base directory where the final file is going to be created.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._path = path.dirname(this._options.output);
    /**
     * A dictionary of common expressions the plugin uses while parsing files.
     * @type {Object}
     * @property {RegExp} url  Matches `require` statements.
     * @property {RexExp} head Matches the end of the template `<head />` tag.
     * @property {RegExp} body Matches the end of the template `<body />` tag.
     * @access protected
     * @ignore
     */
    this._expressions = {
      url: /<%=\s*require\s*\(\s*['|"](.*?)['|"]\s*\).*?%>/ig,
      head: /([\t ]*)(<\/head>)/i,
      body: /([\t ]*)(<\/body>)/i,
    };
    /**
     * A list of the directories the plugin created while copying files. This list exists in order
     * to prevent the plugin from trying to create the same directory more than once.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._createdDirectoriesCache = [];
    /**
     * @ignore
     */
    this.onwrite = this.onwrite.bind(this);
  }
  /**
   * Gets the plugin options
   * @return {ProjextRollupTemplatePluginOptions}
   */
  getOptions() {
    return this._options;
  }
  /**
   * This is called by Rollup after writing the files on the file system. This is where the plugin
   * parses the template and generates the HTML file.
   */
  onwrite() {
    // Reset the directories cache.
    this._createdDirectoriesCache = [];
    // Define the async attribute.
    const async = this._options.scriptsAsync ? ' async="async"' : '';
    // Create all the script tags.
    const scripts = this._options.scripts
    .map((url) => `<script type="text/javascript" src="${url}"${async}></script>`);
    // Create all the stylesheet links.
    const stylesheets = this._options.stylesheets
    .map((url) => `<link href="${url}" rel="stylesheet" />`);
    // Define the list for tags that are going to go on the `<head />`.
    const head = [];
    // Push the links by default.
    head.push(...stylesheets);
    // Define the list for tags that are going to go on the `<body />`.
    const body = [];
    /**
     * If the scripts should go on the `<body />`, push them on its list, otherwise push them to
     * the list for the `<head />`
     */
    if (this._options.scriptsOnBody) {
      body.push(...scripts);
    } else {
      head.push(...scripts);
    }
    // Read the contents of the template.
    let template = fs.readFileSync(this._options.template, 'utf-8');
    // Parse the template `require` expressions.
    template = this._parseTemplateExpressions(template);
    // If there are scripts for the `<head />`, add them to the template.
    if (head.length) {
      const headStr = head.join('\n');
      template = template.replace(this._expressions.head, `$1${headStr}\n$1$2`);
    }
    // If there are scripts for the `<body />`, add them to the template.
    if (body.length) {
      const bodyStr = body.join('\n');
      template = template.replace(this._expressions.body, `$1${bodyStr}\n$1$2`);
    }
    // Make sure the output directory exists.
    fs.ensureDirSync(this._path);
    // Write the HTML file.
    fs.writeFileSync(this._options.output, template.trim());
    // Send the information to the stats callback.
    this._options.stats(this.name, this._options.output);
  }
  /**
   * Validate the plugin options.
   * @throws {Error} If no template path was defined.
   * @throws {Error} If no output path was defined.
   * @access protected
   * @ignore
   */
  _validateOptions() {
    if (!this._options.template) {
      throw new Error(`${this.name}: You need to define the template file`);
    } else if (!this._options.output) {
      throw new Error(`${this.name}: You need to define an output file`);
    }
  }
  /**
   * Parses `require` statements on the template, copy the files and replaces the URLs.
   * @param {string} template The template code.
   * @return {string} The updated template.
   * @access protected
   * @ignore
   */
  _parseTemplateExpressions(template) {
    // Define the new template.
    let newTemplate = template;
    // Get all the `require` expressions information.
    this._extractPaths(template)
    // Loop them...
    .forEach((pathChange) => {
      const {
        file,
        line,
        info,
      } = pathChange;
      // Try to find a URL setting which filter matches a file absolute path.
      const settings = this._options.urls.find((setting) => setting.filter(file));
      // If a URL setting was found...
      if (settings) {
        // Generate the output path where the file will be copied.
        const output = ProjextRollupUtils.formatPlaceholder(settings.output, info);
        // Get the directory where the file will be copied.
        const outputDir = path.dirname(output);
        // Generate the new URL for the file.
        const url = ProjextRollupUtils.formatPlaceholder(settings.url, info);
        // Generate a RegExp that matches the old statement.
        const lineRegex = new RegExp(ProjextRollupUtils.escapeRegex(line), 'ig');
        // if the directory wasn't already created, create it.
        if (!this._createdDirectoriesCache.includes(outputDir)) {
          fs.ensureDirSync(outputDir);
          this._createdDirectoriesCache.push(outputDir);
        }
        // Copy the file.
        fs.copySync(file, output);
        // Add an stats entry that the file was copied.
        this._options.stats(this.name, output);
        // Replace the old statement with the new URL.
        newTemplate = newTemplate.replace(lineRegex, url);
      }
    });
    // Return the new template
    return newTemplate;
  }
  /**
   * Extracts `require` statements from a given code.
   * @param {string} code The code to parse.
   * @return {Array} A list of dictionaries with information about the `require` statements.
   * @access protected
   * @ignore
   */
  _extractPaths(code) {
    // Define the list to return.
    const result = [];
    /**
     * Define a list to save already processed lines, to avoid parsing the same line more than
     * once.
     */
    const saved = [];
    // Loop all the statements.
    let match = this._expressions.url.exec(code);
    while (match) {
      // Get the line and the URL of the `require`.
      const [line, url] = match;
      // If the line wasn't parsed already.
      if (!saved.includes(line)) {
        // Flag the line.
        saved.push(line);
        // Build the full path for the file.
        const file = path.join(this._base, url);
        // If the file exists, push it to the return list.
        if (fs.pathExistsSync(file)) {
          result.push({
            line,
            file,
            info: path.parse(file),
          });
        }
      }
      // Execute the expression again to keep the loop.
      match = this._expressions.url.exec(code);
    }
    // Return the final list.
    return result;
  }
}
/**
 * Shorthand method to create an instance of {@link ProjextRollupTemplatePlugin}.
 * @param {ProjextRollupTemplatePluginOptions} options
 * The options to customize the plugin behaviour.
 * @param {string} name
 * The name of the plugin's instance.
 * @return {ProjextRollupTemplatePlugin}
 */
const template = (options, name) => new ProjextRollupTemplatePlugin(options, name);

module.exports = {
  ProjextRollupTemplatePlugin,
  template,
};
