/**
 * ================================================================================================
 * Externals
 * ================================================================================================
 */

/**
 * @external {Jimple}
 * https://yarnpkg.com/en/package/jimple
 */

/**
 * @external {Jimpex}
 * https://yarnpkg.com/en/package/jimpex
 */

/**
 * @external {Express}
 * https://expressjs.com
 */

/**
 * @external {FileSystem}
 * https://nodejs.org/api/fs.html
 */

/**
 * @external {PathUtils}
 * https://homer0.github.io/wootils/class/wootils/node/pathUtils.js~PathUtils.html
 */

/**
 * @external {Logger}
 * https://homer0.github.io/wootils/class/wootils/node/logger.js~Logger.html
 */

/**
 * @external {EnvironmentUtils}
 * https://homer0.github.io/wootils/class/wootils/node/environmentUtils.js~EnvironmentUtils.html
 */

/**
 * @external {Projext}
 * https://homer0.github.io/projext/class/src/app/index.js~Projext.html
 */

/**
 * @external {BuildVersion}
 * https://homer0.github.io/projext/class/src/services/building/buildVersion.js~BuildVersion.html
 */

/**
 * @external {Events}
 * https://homer0.github.io/projext/class/src/services/common/events.js~Events.html
 */

/**
 * @external {Targets}
 * https://homer0.github.io/projext/class/src/services/targets/targets.js~Targets.html
 */

/**
 * @external {TargetsFileRules}
 *  ttps://homer0.github.io/projext/class/src/services/targets/targetsFileRules/targetsFileRules.js~TargetsFileRules.html
  */

/**
 * @external {TargetFileRules}
 * https://homer0.github.io/projext/typedef/index.html#static-typedef-TargetFileRules
 */

/**
 * @external {TargetsHTML}
 * https://homer0.github.io/projext/class/src/services/targets/targetsHTML.js~TargetsHTML.html
 */

/**
 * @external {Target}
 * https://homer0.github.io/projext/typedef/index.html#static-typedef-Target
 */

/**
 * @external {TargetConfigurationCreator}
 * https://homer0.github.io/projext/typedef/index.html#static-typedef-TargetConfigurationCreator
 */

/**
 * @external {TargetExtraFile}
 * https://homer0.github.io/projext/typedef/index.html#static-typedef-TargetExtraFile
 */

/**
 * @external {BabelConfiguration}
 *  ttps://homer0.github.io/projext/class/src/services/configurations/babelConfiguration.js~BabelConfiguration.html
  */

/**
 * @external {NodeInspectorSettings}
 * https://homer0.github.io/projext/typedef/index.html#static-typedef-NodeInspectorSettings
 */

/**
 * @external {Middleware}
 * http://expressjs.com/en/guide/using-middleware.html
 */

/**
 * @external {HTTPRequest}
 * https://nodejs.org/api/http.html#http_class_http_clientrequest
 */

/**
 * @external {HTTPResponse}
 * https://nodejs.org/api/http.html#http_class_http_serverresponse
 */

/**
 * @external {Buffer}
 * https://nodejs.org/api/buffer.html
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
 * @return {Promise<StringOrObject,Error>} If the Promise gets resolved as a string, that would
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
 * Plugins > Copy
 * ================================================================================================
 */

/**
 * @typedef {function} ProjextRollupCopyPluginItemTransform
 * @param {Buffer} contents The original contents of the file.
 * @return {Promise<string,Error>} The updated contents.
 */

/**
 * @typedef {Object} ProjextRollupCopyPluginItem
 * @property {string}                                from      The file origin path.
 * @property {string}                                to        The file destination path.
 * @property {?ProjextRollupCopyPluginItemTransform} transform A custom function to modify the
 *                                                             contents of the file to copy.
 */

/**
 * @typedef {Object} ProjextRollupCopyPluginOptions
 * @property {Array}                      files A list of files information so the plugin can copy
 *                                              them. Each item should have a `from` and `to`
 *                                              property, otherwise the plugin will throw an error.
 *                                              See {@link ProjextRollupCopyPluginItem}.
 * @property {ProjextRollupPluginsStats}  stats The function the plugin will call in order to
 *                                              inform a file was copied.
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
 * @property {string} host
 * The host used to proxy the dev server.
 * @property {boolean} https
 * Whether or not the proxied host uses `https`.
 */

/**
 * @typedef {Object} ProjextRollupDevServerPluginOptions
 * @property {string} host
 * The server hostname.
 * @property {number} port
 * The server port.
 * @property {Array|string} contentBase
 * The directory from where the files are going to be served. It can be a single directory or a
 * list of them.
 * @property {boolean} historyApiFallback
 * Whether or not the server should redirect the user to the `index.html` after a `404`.
 * @property {null|HTTPSOptions} https
 * The required files to run the server on HTTPs. They are the same that `https.createServer`
 * supports.
 * @property {boolean} open
 * Whether or not the browser should be opened after starting the server.
 * @property {?Logger} logger
 * A custom logger to log the server events.
 * @property {?ProjextRollupDevServerPluginProxiedSettings} proxied
 * The settings in case the server is being proxied.
 * @property {ProjextRollupDevServerPluginEvent} onStart
 * A callback to be called when the server starts.
 * @property {ProjextRollupDevServerPluginEvent} onStop
 * A callback to be called when the server stops.
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
 * @property {?NodeInspectorSettings}             inspect The custom settings for the Node
 *                                                        Inspector.
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
 * @typedef {Object} ProjextRollupStatsPluginReset
 * @property {function} intro The method Rollup calls to get code to add on the top of the bundle.
 *                            The plugin uses it as a _"hook"_ in order to reset the entries list
 *                            and thus, avoid duplicated entries when Rollup is on _"watch mode"_.
 */

/**
 * @typedef {Object} ProjextRollupStatsPluginLogOptions
 * @property {Array}     extraEntries A list of extra entries to add.
 * @property {?Logger}   logger       A custom instance of {@link Logger} to log the report table.
 * @property {?function} afterLog     A custom callback to call after the report table is logged.
 */

/**
 * @typedef {Object} ProjextRollupStatsPluginLog
 * @property {function} writeBundle The method Rollup calls after writing the files on the file
 *                                  system. When this happens, the plugin will log the report
 *                                  table on the console.
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

/**
 * ================================================================================================
 * Middleware
 * ================================================================================================
 */

/**
 * @typedef {function} MiddlewareGetDirectory
 * @return {string}
 * The build directory of the target implementing the middleware.
 */

/**
 * @typedef {function} MiddlewareGetFileSystem
 * @return {Promise<FileSystem,Error>}
 * The reason this is resolved on a promise is to avoid trying to accessing files before they are
 * generated.
 */

/**
 * @typedef {Object} MiddlewareInformation
 * @property {Middleware} middleware
 * The middleware that implements the Rollup build process.
 * @property {MiddlewareGetDirectory} getDirectory
 * To access the target implementing the middleware build directory.
 * @property {MiddlewareGetFileSystem} getFileSystem
 * To access the file system only when the middleware finishes the build process.
 */

/**
 * ================================================================================================
 * Configurations
 * ================================================================================================
 */

/**
 * @typedef {Object} RollupConfigurationsByEnvironment
 * @property {ConfigurationFile} production
 * The configuration service for a the target type production build.
 * @property {ConfigurationFile} development
 * The configuration service for a the target type development build.
 */

/**
 * @typedef {Object} RollupConfigurations
 * @property {RollupConfigurationsByEnvironment} node
 * The build types configurations for a Node target.
 * @property {RollupConfigurationsByEnvironment} browser
 * The build types configurations for a browser target.
 */

/**
 * ================================================================================================
 * Others
 * ================================================================================================
 */

/**
 * @typedef {Object} RollupConfigurationOutputParams
 * @property {string}  file      The path where the bundle will be generated.
 * @property {string}  format    The format of the bundle (`iife`, `cjs` or `umd`).
 * @property {boolean} sourcemap Whether or not a source map should be generated for the bundle.
 * @property {string}  name      The export name of the bundle.
 * @property {?string} exports   This is implemented when the target is a library. It allows the
 *                               bundle to have named exports.
 */

/**
 * @typedef {Object} RollupConfigurationPathsParams
 * @property {string} js
 * The filename format and path for the bundle, on the distribution directory.
 * @property {string} css
 * The filename format and path for the generated stylesheet, on the distribution directory.
 * @property {string} images
 * The filename format and path for the images that are going to be copied to the distribution
 * directory.
 * @property {string} fonts
 * The filename format and path for the font files that are going to be copied to the distribution
 * directory.
 */

/**
 * @typedef {Object} RollupConfigurationParams
 * @property {string} input
 * The path for the entry file.
 * @property {RollupConfigurationOutputParams} output
 * The Rollup settings for the bundle generation.
 * @property {Target} target
 * The information of the target being bundled.
 * @property {TargetFileRules} targetRules
 * The rules to find the different file types a target may use.
 * @property {Function():Object} definitions
 * A function that generates a dictionary of variables that will be replaced on the bundled code.
 * @property {string} buildType
 * The intended build type: `development` or `production`.
 * @property {RollupConfigurationPathsParams} paths
 * A dictionary with the filenames formats and paths of the different files the bundle can
 * generate.
 * @property {Array} copy
 * A list of {@link TargetExtraFile} with the information of files that need to be copied during
 * the bundling process.
 * @property {Array} additionalWatch
 * A list of additional paths Rollup should watch for in order to restart the bundle.
 */

/**
 * @typedef {Object} RollupPluginInfo
 * @property {string} name          The name of the plugin.
 * @property {string} configuration The path to the Rollup configuration file.
 * @property {Array}  external      The list of subpaths the plugin exposes and that should be
 *                                  handled as external dependencies, in order to avoid bundling
 *                                  them.
 */

/**
 * @typedef {function} ProviderRegisterMethod
 * @param {Jimple} app
 * A reference to the dependency injection container.
 */

/**
 * @typedef {Object} Provider
 * @property {ProviderRegisterMethod} register
 * The method that gets called when registering the provider.
 */

/**
 * @typedef {string|Object} StringOrObject
 */
