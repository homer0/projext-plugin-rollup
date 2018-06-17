/**
 * ================================================================================================
 * Externals
 * ================================================================================================
 */

/**
 * ================================================================================================
 * Plugins > Commons
 * ================================================================================================
 */

/**
 * @typedef {function} RollupFilter
 * @param {string} filepath The path to validate.
 * @return {boolean} Whether or not the path is valid.
 */

/**
 * @typedef {function} RollupStylesheetProcessor
 * @param {string} code The style code to process.
 * @return {Promise<(string|Object),Error>} If the Promise gets resolved as a string, that would
 *                                          be used as the style code to either return or inject.
 *                                          But if it gets resolved as an `Object`, it's expected
 *                                          for it to have a `css`  key with the style code, the
 *                                          rest of the keys will be added as named exports.
 */

/**
 * @typedef {Object} RollupFileDefinition
 * @param {string} code The file contents.
 * @param {Object} map Extra information for the file map.
 */

/**
 * @typedef {function} ProjextRollupPluginsStats
 * @param {string} plugin   The name of the plugin that generated/copied the file.
 * @param {string} filepath The file that was generated/copied.
 */

/**
 * @typedef {Object} ProjextRollupPluginURL
 * @property {Array}  include A list of expressions the name of a file should match in order to be
 *                            processed by the plugin.
 * @property {Array}  exclude A list of expressions the name of a file shouldn't match in order to
 *                            be processed by the plugin.
 * @property {string} output  The path to the where the a file would be copied. It supports the
 *                            placeholders `[name]` for the file name and `[ext]` for its
 *                            extension.
 * @property {string} url     The URL for the file. It supports the placeholders `[name]` for the
 *                            file name and `[ext]` for its extension.
 */

/**
 * ================================================================================================
 * Plugins > Compression
 * ================================================================================================
 */

/**
 * @typedef {Object} ProjextRollupCompressionPluginOptions
 * @property {string}                    folder  The directory where the plugin will search for
 *                                               files.
 * @property {Array}                     include A list of expressions the name of a file should
 *                                               match in order to be processed by the plugin.
 * @property {Array}                     exclude A list of expressions the name of a file
 *                                               shouldn't match in order to be processed by the
 *                                               plugin.
 * @property {ProjextRollupPluginsStats} stats   The function the plugin will call in order to
 *                                               inform a file was created.
 */

/**
 * @typedef {Object} ProjextRollupCompressionPluginEntry
 * @property {string} original   The path to the file that was compressed.
 * @property {string} compressed The path to the compressed file.
 */

/**
 * ================================================================================================
 * Plugins > CSS
 * ================================================================================================
 */

/**
 * @typedef {Object} ProjextRollupCSSPluginOptions
 * @property {Array}                      include      A list of expressions the name of a file
 *                                                     should match in order to be processed by
 *                                                     the plugin.
 * @property {Array}                      exclude      A list of expressions the name of a file
 *                                                     shouldn't match in order to be processed by
 *                                                     the plugin.
 * @property {boolean}                    insert       Whether the styles should be injected on
 *                                                     the app `<head >` when the bundle finishes
 *                                                     loading.
 * @property {string|boolean}             output       This can be the name a file where all the
 *                                                     files that match the filter would be
 *                                                     bundled. The option can also be set to
 *                                                     `false` so the styles would be returned as
 *                                                     a string when `require`d.
 * @property {?RollupStylesheetProcessor} processor    A custom function to processed the styles.
 * @property {string}                     insertFnName If `insert` is `true`, this will be used as
 *                                                     the name of the function in charge of
 *                                                     injecting the styles.
 * @property {ProjextRollupPluginsStats}  stats        The function the plugin will call in order
 *                                                     to inform a file was created.
 */

/**
 * ================================================================================================
 * Plugins > DevServer
 * ================================================================================================
 */

/**
 * @typedef {function} ProjextRollupDevServerPluginEvent
 * @param {ProjextRollupDevServerPlugin} plugin
 */

/**
 * @typedef {Object} ProjextRollupDevServerPluginOptions
 * @property {string}                            host               The server hostname.
 * @property {number}                            port               The server port.
 * @property {Array|string}                      contentBase        The directory from where the
 *                                                                  files are going to be served.
 *                                                                  It can be a single directory
 *                                                                  or a list of them.
 * @property {boolean}                           historyApiFallback Whether or not the server
 *                                                                  should redirect the user to
 *                                                                  the `index.html` after a
 *                                                                  `404`.
 * @property {null|HTTPSOptions}                 https              The required files to run the
 *                                                                  server on HTTPs. They are the
 *                                                                  same that `https.createServer`
 *                                                                  supports.
 * @property {boolean}                           open               Whether or not the browser
 *                                                                  should be opened after
 *                                                                  starting the server.
 * @property {?Logger}                           logger             A custom logger to log the
 *                                                                  server events.
 * @property {ProjextRollupDevServerPluginEvent} onStart            A callback to be called when
 *                                                                  the server starts.
 * @property {ProjextRollupDevServerPluginEvent} onStop             A callback to be called when
 *                                                                  the server stops.
 */

/**
 * ================================================================================================
 * Plugins > NodeRunner
 * ================================================================================================
 */

/**
 * @typedef {function} ProjextRollupNodeRunnerPluginEvent
 * @param {ProjextRollupNodeRunnerPlugin} plugin
 */

/**
 * @typedef {Object} ProjextRollupNodeRunnerPluginOptions
 * @property {string}                             file    The file to execute
 * @property {?Logger}                            logger  A custom logger to log the server
 *                                                        events.
 * @property {ProjextRollupNodeRunnerPluginEvent} onStart A callback to be called when the
 *                                                        execution starts.
 * @property {ProjextRollupNodeRunnerPluginEvent} onStop  A callback to be called when the
 *                                                        execution stops.
 */

/**
 * ================================================================================================
 * Plugins > Stats
 * ================================================================================================
 */

/**
 * @typedef {Object} ProjextRollupStatsPluginOptions
 * @property {string} path The path to the directory where all the files are generated. The plugin
 *                         needs it so it can be removed when showing the files list.
 */

/**
 * @typedef {Object} ProjextRollupStatsPluginLogOptions
 * @property {Array}   extraEntries A list of extra entries to add.
 * @property {?Logger} logger       A custom instance of {@link Logger} to log the report table.
 */

/**
 * @typedef {Object} ProjextRollupStatsPluginLog
 * @property {function} onwrite The method Rollup calls after writing the files on the file system.
 *                              When this happens, the plugin will log the report table on the
 *                              console.
 */

/**
 * @typedef {Object} ProjextRollupStatsPluginCellsWidth
 * @property {number} plugin The width for the plugin's cell.
 * @property {number} file   The width for the file path cell.
 * @property {number} size   The width for the file size cell.
 */

/**
 * ================================================================================================
 * Plugins > Stylesheet Assets
 * ================================================================================================
 */

/**
 * @typedef {Object} ProjextRollupStylesheetAssetsPluginOptions
 * @property {string}                    stylesheet    The path to the CSS or JS file where the
 *                                                     styles should be fixed.
 * @property {Array}                     insertFnNames In case the `stylesheet` is a JS file, it's
 *                                                     possible that the styles are being injected
 *                                                     by a function, so this option can be used
 *                                                     the different function names the plugin
 *                                                     should search for in order to find CSS
 *                                                     blocks.
 * @property {ProjextRollupPluginURL}    urls          The set of URLs the plugin will use to
 *                                                     validate the files inside the stylesheet in
 *                                                     order to know if they should be processed,
 *                                                     where to copy them and which URL to use.
 * @property {ProjextRollupPluginsStats} stats         The function the plugin will call in order
 *                                                     to inform a file was created.
 */

/**
 * @typedef {Object} ProjextRollupStylesheetAssetsHelperPluginOptions
 * @property {Array}  include A list of expressions the name of a file should match in order to be
 *                            processed by the plugin.
 * @property {Array}  exclude A list of expressions the name of a file shouldn't match in order to
 *                            be processed by the plugin.
 * @property {string} fnName  The name of the function that will be used to wrap the code.
 */

/**
 * ================================================================================================
 * Plugins > Stylesheet Modules Fixer
 * ================================================================================================
 */

/**
 * @typedef {Object} ProjextRollupStylesheetModulesFixerPluginOptions
 * @property {Array}  include           A list of expressions the name of a file should match in
 *                                      order to be processed by the plugin.
 * @property {Array}  exclude           A list of expressions the name of a file shouldn't match
 *                                      in order to be processed by the plugin.
 * @property {string} modulesExportName The name of the export statement for the CSS modules
 *                                      locals.
 */

/**
 * ================================================================================================
 * Plugins > Template
 * ================================================================================================
 */

/**
 * @typedef {Object} ProjextRollupTemplatePluginOptions
 * @property {string}                    template      The path to the template file the plugin
 *                                                     will use to inject the JS and CSS files.
 * @property {string}                    output        The path where the final file will be
 *                                                     written.
 * @property {Array}                     scripts       A list of JS files that will be linked on
 *                                                     the template.
 * @property {boolean}                   scriptsAsync  Whether or not to use `async` attribute on
 *                                                     the script tags.
 * @property {boolean}                   scriptsOnBody Whether or not to place the script tags on
 *                                                     the body.
 * @property {Array}                     stylesheets   A list of CSS files that will be linked on
 *                                                     the template.
 * @property {ProjextRollupPluginURL}    urls          The set of URLs the plugin will use to
 *                                                     validate the files `require`d on the
 *                                                     template in order to know if they should be
 *                                                     processed, where to copy them and which URL
 *                                                     to use.
 * @property {ProjextRollupPluginsStats} stats         The function the plugin will call in order
 *                                                     to inform a file was copied.
 */

/**
 * ================================================================================================
 * Plugins > URLS
 * ================================================================================================
 */

/**
 * @typedef {Object} ProjextRollupURLsPluginOptions
 * @property {ProjextRollupPluginURL}    urls  The set of URLs the plugin will use to validate the
 *                                             files in order to know if they should be processed,
 *                                             where to copy them and which URL to use.
 * @property {ProjextRollupPluginsStats} stats The function the plugin will call in order to
 *                                             inform a file was copied.
 */
