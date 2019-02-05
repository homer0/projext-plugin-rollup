const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const insertStyle = require('./insertFn');
/**
 * This is a Rollup plugin for handling CSS stylesheets: Move them into a separated bundle,
 * inject them when the browser loads the app and transform them into strings so they can be used
 * on Node.
 */
class ProjextRollupCSSPlugin {
  /**
   * @param {ProjextRollupCSSPluginOptions} [options={}]
   * The options to customize the plugin behaviour.
   * @param {string} [name='projext-rollup-plugin-css']
   * The name of the plugin's instance.
   */
  constructor(options = {}, name = 'projext-rollup-plugin-css') {
    /**
     * The plugin options.
     * @type {ProjextRollupCSSPluginOptions}
     * @access protected
     * @ignore
     */
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
    // Normalize the value of the `output` option.
    if (!this._options.insert && !this._options.output) {
      this._options.output = !!this._options.output;
    }
    /**
     * The name of the plugin instance.
     * @type {string}
     */
    this.name = name;
    /**
     * The filter to decide which files will be processed and which won't.
     * @type {RollupFilter}
     */
    this.filter = rollupUtils.createFilter(
      this._options.include,
      this._options.exclude
    );
    /**
     * A list with all the files the plugin processed. This gets resetted every time the build
     * process starts.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._files = [];
    /**
     * A list of dictionaries with the information of all the files that will end up on a bundle.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._toBundle = [];
    /**
     * @ignore
     */
    this.intro = this.intro.bind(this);
    /**
     * @ignore
     */
    this.transform = this.transform.bind(this);
    /**
     * @ignore
     */
    this.generateBundle = this.generateBundle.bind(this);
  }
  /**
   * Gets the plugin options
   * @return {ProjextRollupCSSPluginOptions}
   */
  getOptions() {
    return this._options;
  }
  /**
   * This gets called when Rollup starts the bundling process. If the `insert` option was set to
   * `true`, this method will return the custom function the bundle will use to inject the
   * styles on the `<head />`.
   * @return {?string}
   */
  intro() {
    let result = null;
    if (this._options.insert) {
      result = insertStyle.toString().replace(insertStyle.name, this._options.insertFnName);
    }

    return result;
  }
  /**
   * Processes a file in order to determine whether it should export an empty string (in case
   * the styles are being moved to a bundle), export the code and/or add extra named exports.
   * @param {string} code     The contents of the file that it's being processed.
   * @param {string} filepath The path of the file that it's being processed.
   * @return {?Promise<RollupFileDefinition,Error>}
   */
  transform(code, filepath) {
    let result = null;
    // Validate that the file matches the plugin's filter.
    if (this.filter(filepath)) {
      // If the file wasn't already processed or the plugin won't generate a bundle...
      if (!this._files.includes(filepath) || !this._options.output) {
        // If the plugin will generate a bundle, mark the file as processed.
        if (this._options.output) {
          this._files.push(filepath);
        }
        const css = code.trim();
        // If there's code on the file...
        if (css) {
          // ...then process the code.
          result = this._process(css, filepath)
          .then((processed) => {
            let cssCode;
            let rest;
            let nextStep;
            // If the processed value is a string...
            if (typeof processed === 'string') {
              // ...assume that's the style code.
              cssCode = processed;
            } else if (typeof processed.css !== 'string') {
              /**
               * If the object doesn't have a `css` property, it means that there's no style code,
               * so throw an error.
               */
              const error = new Error('You need to return the styles using the `css` property');
              nextStep = Promise.reject(error);
            } else {
              // But if the object has a `css` property, assume that's the style code.
              cssCode = processed.css;
              // Take the other keys as `rest` so they'll be used as the extra named exports.
              rest = processed;
              delete rest.css;
            }
            /**
             * If a next step on the promise chain wasn't already defined, it means that there are
             * no errors so far, so let's continue.
             */
            if (!nextStep) {
              // If the code should be injected on the `<head />`.
              if (this._options.insert) {
                // ...format the code.
                const escaped = JSON.stringify(cssCode);
                // Define the call to the inject function.
                const insertCall = `${this._options.insertFnName}(${escaped})`;
                // Use the call inject function as the default export.
                nextStep = this._transformResult(insertCall, rest);
              } else if (this._options.output === false) {
                /**
                 * But if the code should be returned as a string, format it and set it as the
                 * default export.
                 */
                const escaped = JSON.stringify(cssCode);
                nextStep = this._transformResult(escaped, rest);
              } else {
                /**
                 * Finally, if the code will be added to a bundle, keep the code and path
                 * information so they'll be used on `generateBundle` and set the default export as
                 * an empty string.
                 */
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
          // If there wasn't any code to process, set an empty string as the default export.
          result = Promise.resolve(this._transformResult());
        }
      } else {
        /**
         * If the file was already processed or it shouldn't be returned as a string, set an empty
         * string as the default export.
         */
        result = Promise.resolve(this._transformResult());
      }
    }

    return result;
  }
  /**
   * This gets called by Rollup when the bundle is being generated. It takes care, if needed, to
   * create the stylesheet bundle.
   */
  generateBundle() {
    const { insert, output } = this._options;
    /**
     * If the code shouldn't be injected, there's a valid path for the bundle and there are files
     * to put on the bundle...
     */
    if (
      !insert &&
      output &&
      this._toBundle.length
    ) {
      // Puth all the files' contents on a single string.
      const code = this._toBundle
      .map((file) => file.css)
      .join('\n');

      // If there's already a file on the specified path for the bundle...
      if (fs.pathExistsSync(output)) {
        // Append the code to the existing file.
        const currentCode = fs.readFileSync(output, 'utf-8');
        fs.writeFileSync(output, `${currentCode}\n${code}`);
      } else {
        // Otherwise, create the new the file and add the code to it.
        fs.ensureDirSync(path.dirname(output));
        fs.writeFileSync(output, code);
        this._options.stats(this.name, output);
      }
    }
    // Reset the lists that keep track of the processed files.
    this._files = [];
    this._toBundle = [];
  }
  /**
   * If an custom processor was specified on the options, the method will return the call to the
   * processor, otherwise, it will return a promise with the received code.
   * The idea of this method is that `transform` won't need to make an `if` and check whether
   * the process should start with a promise or be sync, as this method always returns a promise.
   * @param {string} css      The code to process.
   * @param {string} filepath The path of the file which code will be processed.
   * @return {Promise<StringOrObject,Error>}
   * @access protected
   * @ignore
   */
  _process(css, filepath) {
    return this._options.processor ?
      this._options.processor(css, filepath) :
      Promise.resolve(css);
  }
  /**
   * Formats the results of `transform` so they can be accepted by Rollup.
   * @param {string}  css         The value of the file defult export.
   * @param {?Object} [rest=null] A dictionary that will be used to create extra named exports if
   *                              defined.
   * @return {RollupFileDefinition}
   * @access protected
   * @ignore
   */
  _transformResult(css, rest = null) {
    // If no code was defined, set the value of the default export to an empty string.
    const cssCode = css || '\'\'';
    // Generate the line with the default export.
    let code = `export default ${cssCode};`;
    // If extra named exports were defined...
    if (rest) {
      // Format each entry as a named export.
      const restCode = Object.keys(rest)
      .map((name) => {
        const value = JSON.stringify(rest[name]);
        return `export const ${name} = ${value};`;
      })
      .join('\n');

      // Append the named exports to the existing code.
      code = `${code}\n${restCode}`;
    }

    // Return the definition for Rollup.
    return {
      code,
      map: {
        mappings: '',
      },
    };
  }
}
/**
 * Shorthand method to create an instance of {@link ProjextRollupCSSPlugin}.
 * @param {ProjextRollupCSSPluginOptions} options
 * The options to customize the plugin behaviour.
 * @param {string} name
 * The name of the plugin's instance.
 * @return {ProjextRollupCSSPlugin}
 */
const css = (options, name) => new ProjextRollupCSSPlugin(options, name);

module.exports = {
  ProjextRollupCSSPlugin,
  css,
};
