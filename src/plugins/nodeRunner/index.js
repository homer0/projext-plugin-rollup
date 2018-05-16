const { fork } = require('child_process');
const fs = require('fs-extra');
const extend = require('extend');

class RollupNodeRunnerPlugin {
  constructor(options = {}, name) {
    this.options = extend(
      true,
      {
        file: null,
        onStart: () => {},
        onStop: () => {},
      },
      options
    );

    this.name = name || 'rollup-plugin-node-runner';
    if (!this.options.file) {
      throw new Error(`${this.name}: You need to specify the file to execute`);
    } else if (!fs.pathExistsSync(this.options.file)) {
      throw new Error(`${this.name}: The executable file doesn't exists`);
    }

    this.start = {
      overwrite: this._startExecution.bind(this),
    };
    this.stop = {
      load: this._stopExecution.bind(this),
    };

    this._instance = null;
    this._terminationEvents = ['SIGINT', 'SIGTERM'];

    this._terminate = this._terminate.bind(this);
  }

  _startExecution() {
    if (!this._instance) {
      this._instance = fork(this.options.file);
      this._startListeningForTermination();
      this.options.onOpen(this);
    }
  }

  _stopExecution() {
    if (this._instance) {
      this._instance.kill();
      this._instance = null;
      this._stopListeningForTermination();
      this.options.onStop(this);
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
