const { fork } = require('child_process');
const fs = require('fs-extra');
const extend = require('extend');
const ProjextRollupUtils = require('../utils');

class ProjextRollupNodeRunnerPlugin {
  constructor(options = {}, name = 'projext-rollup-plugin-node-runner') {
    this._options = extend(
      true,
      {
        file: null,
        logger: null,
        onStart: () => {},
        onStop: () => {},
      },
      options
    );

    this.name = name;

    this._validateOptions();

    this._logger = ProjextRollupUtils.createLogger(this.name, this._options.logger);
    this._instance = null;
    this._terminationEvents = ['SIGINT', 'SIGTERM'];

    this.onwrite = this.onwrite.bind(this);
    this._terminate = this._terminate.bind(this);
  }

  getOptions() {
    return this._options;
  }

  onwrite() {
    this._stopExecution();
    this._startExecution();
  }

  _validateOptions() {
    if (!this._options.file) {
      throw new Error(`${this.name}: You need to specify the file to execute`);
    }
  }

  _startExecution() {
    if (!this._instance) {
      if (!fs.pathExistsSync(this._options.file)) {
        throw new Error(`${this.name}: The executable file doesn't exists`);
      }

      this._logger.success(`Starting bundle execution: ${this._options.file}`);
      this._instance = fork(this._options.file);
      this._startListeningForTermination();
      this._options.onStart(this);
    }
  }

  _stopExecution(logMessage = true) {
    if (this._instance) {
      if (logMessage) {
        this._logger.info('Stopping bundle execution');
      }

      this._instance.kill();
      this._instance = null;
      this._stopListeningForTermination();
      this._options.onStop(this);
    }
  }

  _terminate() {
    this._stopExecution(false);
    process.exit();
  }

  _startListeningForTermination() {
    this._terminationEvents.forEach((eventName) => {
      process.on(eventName, this._terminate);
    });
  }

  _stopListeningForTermination() {
    this._terminationEvents.forEach((eventName) => {
      process.removeListener(eventName, this._terminate);
    });
  }
}

const nodeRunner = (options, name) => new ProjextRollupNodeRunnerPlugin(options, name);

module.exports = {
  ProjextRollupNodeRunnerPlugin,
  nodeRunner,
};
