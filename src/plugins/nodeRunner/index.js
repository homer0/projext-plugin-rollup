const { fork } = require('child_process');
const fs = require('fs-extra');
const extend = require('extend');
const ProjextRollupUtils = require('../utils');
/**
 * This a Rollup plugin that takes care of executing the bundled Noded app after the build is
 * generated.
 */
class ProjextRollupNodeRunnerPlugin {
  /**
   * @param {ProjextRollupNodeRunnerPluginOptions} [options={}]
   * The options to customize the plugin behaviour.
   * @param {string} [name='projext-rollup-plugin-node-runner']
   * The name of the plugin's instance.
   */
  constructor(options, name = 'projext-rollup-plugin-node-runner') {
    /**
     * The plugin options.
     * @type {ProjextRollupNodeRunnerPluginOptions}
     * @access protected
     * @ignore
     */
    this._options = extend(
      true,
      {
        file: null,
        logger: null,
        inspect: {
          enabled: false,
          host: '0.0.0.0',
          port: 9229,
          command: 'inspect',
          ndb: false,
        },
        onStart: () => {},
        onStop: () => {},
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
     * The options that are going to be sent to the `fork` function.
     * @type {Object}
     * @access protected
     * @ignore
     */
    this._forkOptions = this._createForkOptions();
    /**
     * Validate the options and either create or assign a {@link Logger} instance for the plugin.
     * @type {Logger}
     * @access protected
     * @ignore
     */
    this._logger = ProjextRollupUtils.createLogger(this.name, this._options.logger);
    /**
     * This is the property that will eventually hold the execution instance.
     * @type {?Object}
     * @access protected
     * @ignore
     */
    this._instance = null;
    /**
     * The list of events that the plugin will listen for in order to stop the execution before
     * exiting the process.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._terminationEvents = ['SIGINT', 'SIGTERM'];
    /**
     * @ignore
     */
    this.writeBundle = this.writeBundle.bind(this);
    /**
     * @ignore
     */
    this._terminate = this._terminate.bind(this);
  }
  /**
   * Gets the plugin options
   * @return {ProjextRollupNodeRunnerPluginOptions}
   */
  getOptions() {
    return this._options;
  }
  /**
   * This is called after Rollup finishes writing the files on the file system. It takes care of
   * stopping the bundle execution, if it's already running, and starting it again.
   */
  writeBundle() {
    this._stopExecution();
    this._startExecution();
  }
  /**
   * Validate the plugin received options.
   * @throws {Error} If a `file` wasn't defined.
   * @access protected
   * @ignore
   */
  _validateOptions() {
    if (!this._options.file) {
      throw new Error(`${this.name}: You need to specify the file to execute`);
    }
  }
  /**
   * Generates the options for the `fork` function by evluating the inspect options.
   * @return {Object}
   * @access protected
   * @ignore
   */
  _createForkOptions() {
    const result = {};
    const {
      enabled,
      host,
      port,
      command,
      ndb,
    } = this._options.inspect;
    if (enabled) {
      if (ndb) {
        result.execPath = 'ndb';
      } else {
        result.execArgv = [`--${command}=${host}:${port}`];
      }
    }

    return result;
  }
  /**
   * Starts the execution of the bundle.
   * @throws {Error} If the bundled file doesn't exist.
   * @access protected
   * @ignore
   */
  _startExecution() {
    // Validate that the bundle exists.
    if (!fs.pathExistsSync(this._options.file)) {
      throw new Error(`${this.name}: The executable file doesn't exist`);
    }
    // Log an information message.
    this._logger.success(`Starting bundle execution: ${this._options.file}`);
    // Execute the bundle.
    this._instance = fork(this._options.file, [], this._forkOptions);
    // Start listening for termination events.
    this._startListeningForTermination();
    // Invoke the `onStart` callback.
    this._options.onStart(this);
  }
  /**
   * Stops the bundle execution.
   * @param {boolean} [logMessage=true] Whether or not to log an information message, since this
   *                                    is also called when the plugin receives a termination
   *                                    message. The method should only log the message when the
   *                                    instance is being restarted, not when the process is being
   *                                    terminated.
   * @access protected
   * @ignore
   */
  _stopExecution(logMessage = true) {
    // First make sure the instance is running.
    if (this._instance) {
      // Log the information message if needed.
      if (logMessage) {
        this._logger.info('Stopping bundle execution');
      }
      // Kill the instance.
      this._instance.kill();
      this._instance = null;
      // Stop listening for termination events.
      this._stopListeningForTermination();
      // Invoke the `onStop` callback.
      this._options.onStop(this);
    }
  }
  /**
   * This is called when the plugin receives a termination event. It stops the instance and exits
   * the process.
   * @access protected
   * @ignore
   */
  _terminate() {
    this._stopExecution(false);
    process.exit();
  }
  /**
   * This is called when the the bundle instance is created. It starts listening for termination
   * events that require the instance to be stopped.
   * @access protected
   * @ignore
   */
  _startListeningForTermination() {
    this._terminationEvents.forEach((eventName) => {
      process.on(eventName, this._terminate);
    });
  }
  /**
   * This is called when the instance is stopped. It removes the listeners for termination events.
   * @access protected
   * @ignore
   */
  _stopListeningForTermination() {
    this._terminationEvents.forEach((eventName) => {
      process.removeListener(eventName, this._terminate);
    });
  }
}
/**
 * Shorthand method to create an instance of {@link ProjextRollupNodeRunnerPlugin}.
 * @param {ProjextRollupNodeRunnerPluginOptions} options
 * The options to customize the plugin behaviour.
 * @param {string} name
 * The name of the plugin's instance.
 * @return {ProjextRollupNodeRunnerPlugin}
 */
const nodeRunner = (options, name) => new ProjextRollupNodeRunnerPlugin(options, name);

module.exports = {
  ProjextRollupNodeRunnerPlugin,
  nodeRunner,
};
