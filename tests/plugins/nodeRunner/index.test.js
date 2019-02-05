jest.mock('child_process');
jest.mock('fs-extra');
jest.unmock('/src/plugins/nodeRunner');

require('jasmine-expect');
const { fork } = require('child_process');
const fs = require('fs-extra');
const ProjextRollupUtils = require('/src/plugins/utils');
const {
  ProjextRollupNodeRunnerPlugin,
  nodeRunner,
} = require('/src/plugins/nodeRunner');

const originalProcessOn = process.on;
const originalProcessRemoveListener = process.removeListener;
const originalProcessExit = process.exit;

describe('plugins:nodeRunner', () => {
  beforeEach(() => {
    ProjextRollupUtils.createLogger.mockClear();
    fork.mockClear();
    fs.pathExistsSync.mockClear();
  });

  afterEach(() => {
    process.on = originalProcessOn;
    process.removeListener = originalProcessRemoveListener;
    process.exit = originalProcessExit;
  });

  it('should be instantiated with default options', () => {
    // Given
    const options = {
      file: 'index.js',
    };
    let sut = null;
    let result = null;
    let onStartFnResult = null;
    let onStopFnResult = null;
    // When
    sut = new ProjextRollupNodeRunnerPlugin(options);
    result = sut.getOptions();
    onStartFnResult = result.onStart();
    onStopFnResult = result.onStop();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupNodeRunnerPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-node-runner');
    expect(sut.writeBundle).toBeFunction();
    expect(result).toEqual({
      file: 'index.js',
      logger: null,
      inspect: {
        enabled: false,
        host: '0.0.0.0',
        port: 9229,
        command: 'inspect',
        ndb: false,
      },
      onStart: expect.any(Function),
      onStop: expect.any(Function),
    });
    expect(ProjextRollupUtils.createLogger).toHaveBeenCalledTimes(1);
    expect(ProjextRollupUtils.createLogger).toHaveBeenCalledWith(sut.name, null);
    expect(onStartFnResult).toBeUndefined();
    expect(onStopFnResult).toBeUndefined();
  });

  it('should throw an error if no `file` is defined', () => {
    // Given/When/Then
    expect(() => new ProjextRollupNodeRunnerPlugin())
    .toThrow(/You need to specify the file to execute/i);
  });

  it('should throw an error when trying to run a file that doesn\'t exist', () => {
    // Given
    fs.pathExistsSync.mockImplementationOnce(() => false);
    const options = {
      file: 'index.js',
    };
    let sut = null;
    // When
    sut = new ProjextRollupNodeRunnerPlugin(options);
    // Then
    expect(() => sut.writeBundle()).toThrow(/The executable file doesn't exist/i);
  });

  it('should run a file', () => {
    // Given
    process.on = jest.fn();
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const logger = {
      success: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    const options = {
      file: 'index.js',
      onStart: jest.fn(),
    };
    let sut = null;
    // When
    sut = new ProjextRollupNodeRunnerPlugin(options);
    sut.writeBundle();
    // Then
    expect(logger.success).toHaveBeenCalledTimes(1);
    expect(fork).toHaveBeenCalledTimes(1);
    expect(fork).toHaveBeenCalledWith(options.file, [], {});
    expect(process.on).toHaveBeenCalledTimes(2);
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(options.onStart).toHaveBeenCalledTimes(1);
    expect(options.onStart).toHaveBeenCalledWith(sut);
  });

  it('should run a file and enable the Node inspector', () => {
    // Given
    process.on = jest.fn();
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const logger = {
      success: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    const inspect = {
      enabled: true,
      host: '0.0.0.0',
      port: 9229,
      command: 'inspect',
      ndb: false,
    };
    const options = {
      file: 'index.js',
      onStart: jest.fn(),
      inspect,
    };
    let sut = null;
    // When
    sut = new ProjextRollupNodeRunnerPlugin(options);
    sut.writeBundle();
    // Then
    expect(logger.success).toHaveBeenCalledTimes(1);
    expect(fork).toHaveBeenCalledTimes(1);
    expect(fork).toHaveBeenCalledWith(options.file, [], {
      execArgv: [`--${inspect.command}=${inspect.host}:${inspect.port}`],
    });
    expect(process.on).toHaveBeenCalledTimes(2);
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(options.onStart).toHaveBeenCalledTimes(1);
    expect(options.onStart).toHaveBeenCalledWith(sut);
  });

  it('should run a file and enable the ndb inspector', () => {
    // Given
    process.on = jest.fn();
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const logger = {
      success: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    const inspect = {
      enabled: true,
      ndb: true,
    };
    const options = {
      file: 'index.js',
      onStart: jest.fn(),
      inspect,
    };
    let sut = null;
    // When
    sut = new ProjextRollupNodeRunnerPlugin(options);
    sut.writeBundle();
    // Then
    expect(logger.success).toHaveBeenCalledTimes(1);
    expect(fork).toHaveBeenCalledTimes(1);
    expect(fork).toHaveBeenCalledWith(options.file, [], {
      execPath: 'ndb',
    });
    expect(process.on).toHaveBeenCalledTimes(2);
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(options.onStart).toHaveBeenCalledTimes(1);
    expect(options.onStart).toHaveBeenCalledWith(sut);
  });

  it('should restart a file execution', () => {
    // Given
    process.on = jest.fn();
    process.removeListener = jest.fn();
    const instance = {
      kill: jest.fn(),
    };
    fork.mockImplementationOnce(() => instance);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const logger = {
      success: jest.fn(),
      info: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    const options = {
      file: 'index.js',
      onStart: jest.fn(),
      onStop: jest.fn(),
    };
    let sut = null;
    // When
    sut = new ProjextRollupNodeRunnerPlugin(options);
    sut.writeBundle();
    sut.writeBundle();
    // Then
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(instance.kill).toHaveBeenCalledTimes(1);
    expect(process.removeListener).toHaveBeenCalledTimes(2);
    expect(process.removeListener).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.removeListener).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(options.onStop).toHaveBeenCalledTimes(1);
    expect(options.onStop).toHaveBeenCalledWith(sut);
  });

  it('should stop the file execution if the process gets terminated', () => {
    // Given
    process.on = jest.fn();
    process.removeListener = jest.fn();
    process.exit = jest.fn();
    const instance = {
      kill: jest.fn(),
    };
    fork.mockImplementationOnce(() => instance);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const logger = {
      success: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    const options = {
      file: 'index.js',
      onStop: jest.fn(),
    };
    let sut = null;
    let terminate = null;
    // When
    sut = new ProjextRollupNodeRunnerPlugin(options);
    sut.writeBundle();
    [[, terminate]] = process.on.mock.calls;
    terminate();
    // Then
    expect(instance.kill).toHaveBeenCalledTimes(1);
    expect(process.removeListener).toHaveBeenCalledTimes(2);
    expect(process.removeListener).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.removeListener).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(options.onStop).toHaveBeenCalledTimes(1);
    expect(options.onStop).toHaveBeenCalledWith(sut);
  });

  it('should provide a shorthand method to instantiate the plugin', () => {
    // Given
    const options = {
      file: 'index.js',
    };
    let sut = null;
    // When
    sut = nodeRunner(options);
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupNodeRunnerPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-node-runner');
    expect(sut.writeBundle).toBeFunction();
  });
});
