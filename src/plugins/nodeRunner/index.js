const { fork } = require('child_process');
const fs = require('fs-extra');
const extend = require('extend');
const { Logger } = require('wootils/node/logger');

class RollupNodeRunnerPlugin {
  constructor(options = {}, name = 'rollup-plugin-node-runner') {
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

    this.start = {
      ongenerate: this._startExecution.bind(this),
    };
    this.stop = {
      load: this._stopExecution.bind(this),
    };

    this._logger = this._createLogger();
    this._instance = null;
    this._terminationEvents = ['SIGINT', 'SIGTERM'];

    this._terminate = this._terminate.bind(this);
  }

  getOptions() {
    return this._options;
  }

  _validateOptions() {
    if (!this._options.file) {
      throw new Error(`${this.name}: You need to specify the file to execute`);
    } else if (!fs.pathExistsSync(this._options.file)) {
      throw new Error(`${this.name}: The executable file doesn't exists`);
    }
  }

  _createLogger() {
    let pluginLogger;
    if (this._options.logger && !(this._options.logger instanceof Logger)) {
      throw new Error(`${this.name}: The logger must be an instance of wootils's Logger class`);
    } else if (this._options.logger) {
      pluginLogger = this._options.logger;
      delete this._options.logger;
    } else {
      pluginLogger = new Logger();
    }

    return pluginLogger;
  }

  _startExecution() {
    if (!this._instance) {
      this._logger.success(`Starting bundle execution: ${this._options.file}`);
      this._instance = fork(this._options.file);
      this._startListeningForTermination();
      this._options.onOpen(this);
    }
  }

  _stopExecution() {
    if (this._instance) {
      this._logger.info('Stopping bundle execution');
      this._instance.kill();
      this._instance = null;
      this._stopListeningForTermination();
      this._options.onStop(this);
    }
  }

  _terminate() {
    this._stopExecution();
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

const nodeRunner = (options, name) => new RollupNodeRunnerPlugin(options, name);

module.exports = {
  RollupNodeRunnerPlugin,
  nodeRunner,
};
