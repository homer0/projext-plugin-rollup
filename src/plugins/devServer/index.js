const { createServer: createHTTPSServer } = require('https');
const { createServer: createHTTPServer } = require('http');
const path = require('path');
const opener = require('opener');
const fs = require('fs-extra');
const extend = require('extend');
const mime = require('mime');
const statuses = require('statuses');
const ProjextRollupUtils = require('../utils');
/**
 * This a Rollup plugin that runs a dev server for a bundled application.
 */
class ProjextRollupDevServerPlugin {
  /**
   * @param {ProjextRollupDevServerPluginOptions} [options={}]
   * The options to customize the plugin behaviour.
   * @param {String} [name='projext-rollup-plugin-dev-server']
   * The name of the plugin's instance.
   */
  constructor(options = {}, name = 'projext-rollup-plugin-dev-server') {
    /**
     * The plugin options.
     * @type {ProjextRollupDevServerPluginOptions}
     * @access protected
     * @ignore
     */
    this._options = extend(
      true,
      {
        host: 'localhost',
        port: 8080,
        contentBase: [],
        historyApiFallback: false,
        https: null,
        open: true,
        logger: null,
        onStart: () => {},
        onStop: () => {},
      },
      options
    );
    // Normalize the received `contentBase` option into an array.
    this._options.contentBase = this._normalizeContentBase();
    /**
     * The name of the plugin's instance.
     * @type {string}
     */
    this.name = name;
    /**
     * The server URL.
     * @type {string}
     */
    this.url = this._createServerURL();
    // Set the default mime type for the server respones.
    mime.default_type = 'text/plain';
    /**
     * Validate the options and either create or assign a {@link Logger} instance for the plugin.
     * @type {Logger}
     * @access protected
     * @ignore
     */
    this._logger = ProjextRollupUtils.createLogger(this.name, this._options.logger);
    /**
     * This is the property that will hold the server instance after it gets created.
     * @type {?Object}
     * @access protected
     * @ignore
     */
    this._instance = null;
    /**
     * The list of events that the plugin will listen for in order to stop the server before
     * exiting the process.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._terminationEvents = ['SIGINT', 'SIGTERM'];
    /**
     * Whether or not the browser was already openend.
     * @type {boolean}
     * @access protected
     * @ignore
     */
    this._alreadyOpen = false;
    /**
     * The message of the error thrown when a requested file can't be found. It's on a property
     * because the plugin validates it more than once, and we don't want to have to write it
     * more than once.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._NOT_FOUND_ERROR = 'ENOENT: no such file or directory';
    /**
     * The path for the plugin's favicon. The browsers usually try to fetch an app favicon by
     * requesting `/favicon.ico`, so when the plugin detects that request but there's no file, it
     * will respond with a default favicon with the Rollup logo.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._defaultFaviconPath = path.join(path.dirname(__filename), 'favicon.ico');
    /**
     * @ignore
     */
    this.onwrite = this.onwrite.bind(this);
    /**
     * @ignore
     */
    this._handler = this._handler.bind(this);
    /**
     * @ignore
     */
    this._terminate = this._terminate.bind(this);
  }
  /**
   * Gets the plugin options
   * @return {ProjextRollupDevServerPluginOptions}
   */
  getOptions() {
    return this._options;
  }
  /**
   * This is called after Rollup finishes writing the files on the file system. It checks if
   * there's an instance of the server running and if there isn't, it creates a new one.
   */
  onwrite() {
    // Validate that there's no instance already running.
    if (!this._instance) {
      // Get the server basic options.
      const { https, port } = this._options;
      // Create the server instance.
      this._instance = https ?
        createHTTPSServer(https, this._handler) :
        createHTTPServer(this._handler);

      // Start listening for requests.
      this._instance.listen(port);
      // Log some information messages.
      this._logger.success(`Your app is running on the port ${port}`);
      this._logger.info(this.url);
      // Start listening for process events that require the sever instance to be terminated.
      this._startListeningForTermination();
      // Open the browser.
      this._open();
      // Invoke the `onStart` callback.
      this._options.onStart(this);
    }
  }
  /**
   * Creates the server full URL using the specified protocol, hostname and port.
   * @return {string}
   * @access protected
   * @ignore
   */
  _createServerURL() {
    const protocol = this._options.https ? 'https' : 'http';
    return `${protocol}://${this._options.host}:${this._options.port}`;
  }
  /**
   * Normalizes the `contentBase` option into an array.
   * @return {Array}
   * @access protected
   * @ignore
   */
  _normalizeContentBase() {
    // Define the Array that will be the option new value.
    const newContentBase = [];
    // Get the current option value.
    const { contentBase } = this._options;
    // If the option is already an Array...
    if (Array.isArray(contentBase)) {
      // If it has contents, which means the implementation overwrote the default value...
      if (contentBase.length) {
        // ...push the current items to the new Array.
        newContentBase.push(...contentBase);
      } else {
        // ...otherwise, push the current directory.
        newContentBase.push('./');
      }
    } else {
      // ...but if the option is an string, push it as the only item of the new Array.
      newContentBase.push(contentBase);
    }

    // Return the new option value.
    return newContentBase;
  }
  /**
   * This method gets called when one of the termination events the plugin listens for is emitted.
   * If stops the server, deletes the instance and exits the process.
   * @access protected
   * @ignore
   */
  _terminate() {
    if (this._instance) {
      this._instance.close();
      this._instance = null;
      this._stopListeningForTermination();
      this._options.onStop(this);
    }

    process.exit();
  }
  /**
   * This is called when the the server instance is created. It starts listening for termination
   * events that require the server to be stopped.
   * @access protected
   * @ignore
   */
  _startListeningForTermination() {
    this._terminationEvents.forEach((eventName) => {
      process.on(eventName, this._terminate);
    });
  }
  /**
   * This is called when the server is stopped. It removes the listeners for termination events.
   * @access protected
   * @ignore
   */
  _stopListeningForTermination() {
    this._terminationEvents.forEach((eventName) => {
      process.removeListener(eventName, this._terminate);
    });
  }
  /**
   * This is called when the server instance is created. It opens the browser after validating that
   * the option to do it is `true` and the browser was not already opened.
   * @access protected
   * @ignore
   */
  _open() {
    if (!this._alreadyOpen && this._options.open) {
      this._alreadyOpen = true;
      opener(this.url);
    }
  }
  /**
   * This method gets called every time the server needs to resolve a request. It validates the
   * request and tries to serve a file from the file system.
   * @param {HTTPRequest}  req The request information.
   * @param {HTTPResponse} res The response information.
   * @return {Promise<undefined,Error>}
   * @access protected
   * @ignore
   */
  _handler(req, res) {
    // Remove any query string from the URL.
    const urlPath = decodeURI(req.url.split('?').shift());
    // Get the file contents.
    return this._readFileFromContentBase(urlPath)
    // Serve the file.
    .then((contents) => this._serveFile(res, urlPath, contents))
    // In case of failure...
    .catch((error) => {
      let result = null;
      // If the file couldn't be found...
      if (error.message && error.message === this._NOT_FOUND_ERROR) {
        // If the request was for the favicon, serve the plugin's favicon.
        if (req.url === '/favicon.ico') {
          result = this._serveDefaultFavicon(res);
        } else if (this._options.historyApiFallback) {
          // If `historyApiFallback` is enabled, redirect to the `index.html`.
          result = res.redirect('/index.html');
        } else {
          // Otherwise, respond with a Not Found.
          result = this._notFound(res, urlPath);
        }
      } else {
        // If the error is unknown, respond with an Internal Error.
        result = this._internalError(res, error);
      }

      return result;
    });
  }
  /**
   * This method tries to find a file on the list of `contentBase` directories and return its
   * contents so it can be served.
   * If the method doesn't find a file on directory, it will call itself recursively with the next
   * directory until it finds it or returns a Not Found error.
   * @param {string} urlPath              The filepath received by the server.
   * @param {Number} [contentBaseIndex=0] The index of the dictionary it should try on the
   *                                      `contentBase` list.
   * @return {Promise<string,Error>}
   * @access protected
   * @ignore
   */
  _readFileFromContentBase(urlPath, contentBaseIndex = 0) {
    let result;
    // Get the directory to test from the list using the received index.
    const contentBase = this._options.contentBase[contentBaseIndex];
    // If there's a directory for the received index...
    if (contentBase) {
      // Build the path to the file.
      let filepath = path.join(contentBase, urlPath);
      // If the path ends with a `/`, automatically append an `index.html` to it.
      if (filepath.endsWith('/')) {
        filepath = `${filepath}index.html`;
      }

      // If the file exists...
      if (fs.pathExistsSync(filepath)) {
        // ...set to return the promise with the file contents.
        result = fs.readFile(filepath);
      } else {
        // ...otherwise, continue to the next directory.
        result = this._readFileFromContentBase(urlPath, contentBaseIndex + 1);
      }
    } else {
      // If there are no more directories to test, set to return a Not Found error.
      result = Promise.reject(new Error(this._NOT_FOUND_ERROR));
    }

    return result;
  }
  /**
   * This is the method that actually serves a file.
   * @param {HTTPResponse} res     The response information.
   * @param {string}       urlPath The path to the requested file.
   * @param {string}       file    The contents to serve.
   * @access protected
   * @ignore
   */
  _serveFile(res, urlPath, file) {
    /**
     * If the request ended with `/`, assume that `_readFileFromContentBase` appended an
     * `index.html` and the file mime type is for HTML, otherwise, use `mime` to obtain the right
     * type.
     */
    const mimeType = urlPath.endsWith('/') ?
      'text/html' :
      mime.getType(urlPath);
    // Add the mime type to the response headers.
    res.writeHead(statuses.ok, {
      'Content-Type': mimeType,
    });
    // Send the file contents and end the response.
    res.end(file, 'utf-8');
  }
  /**
   * This method gets called when the server recived a a request for `/favicon.ico` and the file
   * doesn't exist. It tries to load the plugin's favicon and serve it.
   * @param {HTTPResponse} res The response information.
   * @return {Promise<undefined,Error>}
   * @access protected
   * @ignore
   */
  _serveDefaultFavicon(res) {
    // Get the plugin's favicon file contents.
    return fs.readFile(this._defaultFaviconPath)
    // Serve it.
    .then((favicon) => {
      this._serveFile(res, '/favicon.ico', favicon);
    })
    // If something went wrong, respond with an Internal Error.
    .catch((error) => {
      this._internalError(res, error);
    });
  }
  /**
   * Sends a response with a Not Found error.
   * @param {HTTPResponse} res The response information.
   * @param {string}       urlPath The path to the requested file.
   * @access protected
   * @ignore
   */
  _notFound(res, urlPath) {
    this._responsdWithError(res, statuses['not found'], urlPath);
  }
  /**
   * Sends a response with an Internal Error.
   * @param {HTTPResponse} res   The response information.
   * @param {Error|*}      error The unexpected error.
   * @access protected
   * @ignore
   */
  _internalError(res, error) {
    let message;
    // If the received error is an actual Error...
    if (error instanceof Error) {
      // ...format the error stack information.
      const stackList = error.stack.split('\n');
      stackList.shift();
      const stackText = stackList.map((line) => `  -> ${line.trim()}`).join('\n');
      // Append the stack information to the error message.
      message = `${error.message}\n\n${stackText}`;
    } else {
      // ...otherwise, just assume that the received error is the message.
      message = error;
    }
    // Serve the error.
    this._responsdWithError(res, statuses['internal server error'], message);
  }
  /**
   * Sends an error response.
   * @param {HTTPResponse} res     The response information.
   * @param {number}       status  The HTTP status for the response.
   * @param {string}       message The error message.
   * @access protected
   * @ignore
   */
  _responsdWithError(res, status, message) {
    const title = statuses[status];
    /**
     * Define the response text by prefixing the received message with the response status and
     * adding the plugin's name at the end.
     */
    const text = `${status} ${title}\n\n` +
      `${message}\n\n` +
      `${this.name}`;

    // Set the response HTTP status.
    res.writeHead(status);
    // Send the error message and end the response.
    res.end(text, 'utf-8');
  }
}
/**
 * Shorthand method to create an instance of {@link ProjextRollupDevServerPlugin}.
 * @param {ProjextRollupDevServerPluginOptions} options
 * The options to customize the plugin behaviour.
 * @param {string} name
 * The name of the plugin's instance.
 * @return {ProjextRollupDevServerPlugin}
 */
const devServer = (options, name) => new ProjextRollupDevServerPlugin(options, name);

module.exports = {
  ProjextRollupDevServerPlugin,
  devServer,
};
