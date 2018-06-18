const path = require('path');
const rollup = require('rollup');
const fs = require('fs-extra');
const mime = require('mime');
const { provider } = require('jimple');
const { deferred } = require('wootils/shared');
/**
 * This service creates, configures and manages an Express-like middleware for bundling Rollup.
 */
class RollupMiddleware {
  /**
   * Class constructor.
   * @param {Logger}              appLogger           To log information messages.
   * @param {Events}              events              To reduce the middlewares configuration.
   * @param {Targets}             targets             To get targets information.
   * @param {RollupConfiguration} rollupConfiguration To get a target Rollup configuration.
   */
  constructor(appLogger, events, targets, rollupConfiguration) {
    /**
     * A local reference for the `appLogger` service.
     * @type {Logger}
     */
    this.appLogger = appLogger;
    /**
     * A local reference for the `events` service.
     * @type {Events}
     */
    this.events = events;
    /**
     * A local reference for the `targets` service.
     * @type {Targets}
     */
    this.targets = targets;
    /**
     * A local reference for the `rollupConfiguration` service.
     * @type {RollupConfiguration}
     */
    this.rollupConfiguration = rollupConfiguration;
    // Set the default mime type for the `mime` module.
    mime.default_type = 'text/plain';
    /**
     * The instance of the Rollup watcher.
     * @type {?Object}
     */
    this._watcher = null;
    /**
     * A dictionary of directories the middleware use as root for their file system.
     * It uses the targets names as the keys.
     * @type {Object}
     * @ignore
     * @access protected
     */
    this._directories = {};
    /**
     * A dictionary of flags that indicate if a target middleware finished bundling and if the
     * file system can be accessed..
     * The idea is that file system can't be used until Rollup finishes its process.
     * It uses the targets names as the keys.
     * @type {Object}
     * @ignore
     * @access protected
     */
    this._fileSystemsReady = {};
    /**
     * A dictionary of deferred promises the service uses to return when asked for a file system
     * while its Rollup hasn't finished compiling.
     * It uses the targets names as the keys.
     * @type {Object}
     * @ignore
     * @access protected
     */
    this._fileSystemsDeferreds = {};
  }
  /**
   * Generate the middleware for a given target.
   * @param {string} targetToBuild The name of the target that will be builded on the middleware.
   * @param {string} targetToServe The name of the target that will implement the middleware.
   *                               When the other target is builded, it will assume that is on the
   *                               distribution directory, and if the target serving it is being
   *                               executed from the source directory it won't be able to use the
   *                               file system without hardcoding some relatives paths from the
   *                               build to the source; to avoid that, the method gets the build
   *                               path of this target, so when using `getDirectory()`, it
   *                               will think they are both on the distribution directory and the
   *                               paths can be created relative to that.
   * @return {MiddlewareInformation}
   */
  generate(targetToBuild, targetToServe) {
    // Get the target information.
    const target = this.targets.getTarget(targetToBuild);
    // Set the target working directory as the target that serves it build folder
    this._directories[target.name] = this.targets.getTarget(targetToServe).paths.build;
    // Set the flag indicating the file system is not ready.
    this._fileSystemsReady[target.name] = false;
    // Create the deferred promise for when the file system is ready.
    this._fileSystemsDeferreds[target.name] = deferred();
    // Define the functions to get the file system promise and the middleware root directory.
    const getDirectory = () => this._directories[target.name];
    const getFileSystem = () => this._fileSystem(target);
    // Define the function to get the target middleware.
    const middleware = () => this._middleware(target);

    return {
      getDirectory,
      getFileSystem,
      middleware,
    };
  }
  /**
   * Gets access to file system. This returns a promise so the file system can't be accessed until
   * Rollup finishes the bundling.
   * @param {Target} target The target owner of the middleware.
   * @return {Promise<FileSystem,Error>}
   * @access protected
   * @ignore
   */
  _fileSystem(target) {
    return this._fileSystemsReady[target.name] ?
      Promise.resolve(fs) :
      this._fileSystemsDeferreds[target.name].promise;
  }
  /**
   * Gets the middleware the will serve the bundled files.
   * @param {Target} target The information of the target to bundle.
   * @return {Middleware}
   * @access protected
   * @ignore
   */
  _middleware(target) {
    // Bundle the target.
    this._compile(target);
    return (req, res, next) => {
      // If the file system is ready...
      if (this._fileSystemsReady[target.name]) {
        // Remove any query string from the requested path.
        const urlPath = decodeURI(req.url.split('?').shift());
        // Get the file absolute path.
        const filepath = path.join(target.paths.build, urlPath);
        // If the file exists...
        if (fs.pathExistsSync(filepath)) {
          // Set the type header with the file mime type.
          res.setHeader('Content-Type', mime.getType(filepath));
          // Try to respond with the file contents.
          res.sendFile(filepath, (error) => {
            /**
             * If sending the file fails, move to the next middleware with an error, otherwise,
             * end the response.
             */
            if (error) {
              next(error);
            } else {
              res.end();
            }
          });
        } else {
          // If the file doesn't exist, move to the next middleware.
          next();
        }
      } else {
        /**
         * If the file system is not ready, log a message, wait for the file system and then
         * move to the next middleware.
         */
        this.appLogger.warning(`Request on hold until the build is ready: ${req.originalUrl}`);
        this._fileSystem(target)
        .then(() => {
          next();
        });
      }
    };
  }
  /**
   * Compile a target and watch for changes.
   * @param {Target} target The target information.
   * @access protected
   * @ignore
   */
  _compile(target) {
    // Make sure there's not an instance already.
    if (!this._watcher) {
      // Get the Rollup configuration for the target.
      const configuration = this.rollupConfiguration.getConfig(target, 'development');
      // Create the watcher instance.
      this._watcher = rollup.watch(configuration);
      // Listen for the watcher events.
      this._watcher.on('event', (event) => {
        switch (event.code) {
        case 'START':
          this._onStart(target);
          break;
        case 'END':
          this._onFinish(target);
          break;
        case 'ERROR':
          this._onError(target, event);
          break;
        case 'FATAL':
        default:
          this._onError(target, event, true);
          break;
        }
      });
    }
  }
  /**
   * This is called when Rollup starts the bundling process. It logs an information message and
   * resets the file system flag for a target.
   * @param {Target} target The target information.
   * @access protected
   * @ignore
   */
  _onStart(target) {
    setTimeout(() => {
      this.appLogger.warning('Creating the Rollup build...');
    }, 1);
    if (!this._fileSystemsDeferreds[target.name]) {
      this._fileSystemsReady[target.name] = false;
      this._fileSystemsDeferreds[target.name] = deferred();
    }
  }
  /**
   * This is called when Rollup finishes the bundling process. It logs an information message
   * and resolves the target file system promise.
   * @param {Target} target The target information.
   * @access protected
   * @ignore
   */
  _onFinish(target) {
    setTimeout(() => {
      this.appLogger.success('The Rollup build is ready');
    }, 1);
    this._fileSystemsReady[target.name] = true;
    this._fileSystemsDeferreds[target.name].resolve(fs);
    delete this._fileSystemsDeferreds[target.name];
  }
  /**
   * This is called when Rollup finds an error on the build process. It just logs an error message.
   * @access protected
   * @ignore
   */
  _onError() {
    this.appLogger.error('There was a problem while creating the Rollup build');
  }
}
/**
 * The service provider that once registered on the app container will set an instance of
 * `RollupMiddleware` as the `rollupMiddleware` service.
 * @example
 * // Register it on the container
 * container.register(rollupMiddleware);
 * // Getting access to the service instance
 * const rollupMiddleware = container.get('rollupMiddleware');
 * @type {Provider}
 */
const rollupMiddleware = provider((app) => {
  app.set('rollupMiddleware', () => new RollupMiddleware(
    app.get('appLogger'),
    app.get('events'),
    app.get('targets'),
    app.get('rollupConfiguration')
  ));
});

module.exports = {
  RollupMiddleware,
  rollupMiddleware,
};
