const JimpleMock = require('/tests/mocks/jimple.mock');

jest.unmock('wootils/shared');
jest.unmock('wootils/shared/deferred.js');
jest.mock('jimple', () => JimpleMock);
jest.mock('rollup');
jest.mock('fs-extra');
jest.mock('mime');
jest.unmock('/src/services/server/middleware');

require('jasmine-expect');
const rollup = require('rollup');
const fs = require('fs-extra');
const mime = require('mime');
const {
  RollupMiddleware,
  rollupMiddleware,
} = require('/src/services/server/middleware');

const originalProcessExit = process.exit;

describe('services/server:middleware', () => {
  beforeEach(() => {
    fs.pathExistsSync.mockReset();
    rollup.watch.mockReset();
    process.exit = originalProcessExit;
  });

  it('should be instantiated with all its dependencies', () => {
    // Given
    const appLogger = 'appLogger';
    const events = 'events';
    const targets = 'targets';
    const rollupConfiguration = 'rollupConfiguration';
    let sut = null;
    // When
    sut = new RollupMiddleware(
      appLogger,
      events,
      targets,
      rollupConfiguration
    );
    // Then
    expect(sut).toBeInstanceOf(RollupMiddleware);
    expect(sut.appLogger).toBe(appLogger);
    expect(sut.events).toBe(events);
    expect(sut.targets).toBe(targets);
    expect(sut.rollupConfiguration).toBe(rollupConfiguration);
  });

  it('should generate the middleware information object for a target', () => {
    // Given
    const appLogger = 'appLogger';
    const events = 'events';
    const targetToBuild = {
      name: 'target-to-build',
    };
    const targetToServe = {
      name: 'target-to-serve',
      paths: {
        build: 'dist/server',
      },
    };
    const targetsList = {
      [targetToBuild.name]: targetToBuild,
      [targetToServe.name]: targetToServe,
    };
    const targets = {
      getTarget: jest.fn((name) => targetsList[name]),
    };
    const rollupConfiguration = 'rollupConfiguration';
    let sut = null;
    let result = null;
    // When
    sut = new RollupMiddleware(appLogger, events, targets, rollupConfiguration);
    result = sut.generate(targetToBuild.name, targetToServe.name);
    // Then
    expect(result).toEqual({
      getDirectory: expect.any(Function),
      getFileSystem: expect.any(Function),
      middleware: expect.any(Function),
    });
    expect(targets.getTarget).toHaveBeenCalledTimes(2);
    expect(targets.getTarget).toHaveBeenCalledWith(targetToBuild.name);
    expect(targets.getTarget).toHaveBeenCalledWith(targetToServe.name);
  });

  it('should generate the middleware for a target', () => {
    // Given
    const rollupWatch = {
      on: jest.fn(),
    };
    rollup.watch.mockImplementationOnce(() => rollupWatch);
    const appLogger = 'appLogger';
    const events = {
      reduce: jest.fn((name, options) => options),
    };
    const targetToBuild = {
      name: 'target-to-build',
    };
    const targetToServe = {
      name: 'target-to-serve',
      paths: {
        build: 'dist/server',
      },
    };
    const targetsList = {
      [targetToBuild.name]: targetToBuild,
      [targetToServe.name]: targetToServe,
    };
    const targets = {
      getTarget: jest.fn((name) => targetsList[name]),
    };
    const rollupConfig = 'target-rollup-config';
    const rollupConfiguration = {
      getConfig: jest.fn(() => rollupConfig),
    };
    let sut = null;
    let middleware = null;
    // When
    sut = new RollupMiddleware(appLogger, events, targets, rollupConfiguration);
    middleware = sut.generate(targetToBuild.name, targetToServe.name).middleware();
    // Then
    expect(middleware).toBeFunction();
    expect(rollupConfiguration.getConfig).toHaveBeenCalledTimes(1);
    expect(rollupConfiguration.getConfig).toHaveBeenCalledWith(targetToBuild, 'development');
    expect(rollup.watch).toHaveBeenCalledTimes(1);
    expect(rollup.watch).toHaveBeenCalledWith(rollupConfig);
    expect(rollupWatch.on).toHaveBeenCalledTimes(1);
    expect(rollupWatch.on).toHaveBeenCalledWith('event', expect.any(Function));
  });

  it('should log a warning when trying to serve a file before the build is ready', () => {
    // Given
    const rollupWatch = {
      on: jest.fn(),
    };
    rollup.watch.mockImplementationOnce(() => rollupWatch);
    const appLogger = {
      warning: jest.fn(),
      success: jest.fn(),
    };
    const events = {
      reduce: jest.fn((name, options) => options),
    };
    const targetToBuild = {
      name: 'target-to-build',
    };
    const targetToServe = {
      name: 'target-to-serve',
      paths: {
        build: 'dist/server',
      },
    };
    const targetsList = {
      [targetToBuild.name]: targetToBuild,
      [targetToServe.name]: targetToServe,
    };
    const targets = {
      getTarget: jest.fn((name) => targetsList[name]),
    };
    const rollupConfig = 'target-rollup-config';
    const rollupConfiguration = {
      getConfig: jest.fn(() => rollupConfig),
    };
    const req = {
      originalUrl: 'some-url',
    };
    let sut = null;
    let middleware = null;
    let eventHandler = null;
    // When
    sut = new RollupMiddleware(appLogger, events, targets, rollupConfiguration);
    middleware = sut.generate(targetToBuild.name, targetToServe.name).middleware();
    return new Promise((resolve) => {
      middleware(req, {}, resolve);
      [[, eventHandler]] = rollupWatch.on.mock.calls;
      eventHandler({ code: 'END' });
    })
    // Then
    .then(() => {
      expect(appLogger.warning).toHaveBeenCalledTimes(1);
      return new Promise((resolve) => {
        setTimeout(() => resolve(), 1);
        jest.runAllTimers();
      });
    })
    .then(() => {
      expect(appLogger.success).toHaveBeenCalledTimes(1);
    })
    .catch(() => {
      expect(true).toBeFalse();
    });
  });

  it('should move to the next middleware if a file doesn\'t exist', () => {
    // Given
    fs.pathExistsSync.mockImplementationOnce(() => false);
    const rollupWatch = {
      on: jest.fn(),
    };
    rollup.watch.mockImplementationOnce(() => rollupWatch);
    const appLogger = {
      warning: jest.fn(),
      success: jest.fn(),
    };
    const events = {
      reduce: jest.fn((name, options) => options),
    };
    const targetToBuild = {
      name: 'target-to-build',
      paths: {
        build: 'dist/build',
      },
    };
    const targetToServe = {
      name: 'target-to-serve',
      paths: {
        build: 'dist/server',
      },
    };
    const targetsList = {
      [targetToBuild.name]: targetToBuild,
      [targetToServe.name]: targetToServe,
    };
    const targets = {
      getTarget: jest.fn((name) => targetsList[name]),
    };
    const rollupConfig = 'target-rollup-config';
    const rollupConfiguration = {
      getConfig: jest.fn(() => rollupConfig),
    };
    const req = {
      url: 'some-url',
      originalUrl: 'some-url',
    };
    let sut = null;
    let middleware = null;
    let eventHandler = null;
    // When
    sut = new RollupMiddleware(appLogger, events, targets, rollupConfiguration);
    middleware = sut.generate(targetToBuild.name, targetToServe.name).middleware();
    [[, eventHandler]] = rollupWatch.on.mock.calls;
    eventHandler({ code: 'END' });
    return new Promise((resolve) => {
      middleware(req, {}, resolve);
    })
    // Then
    .then(() => {
      expect(appLogger.warning).toHaveBeenCalledTimes(0);
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(`${targetToBuild.paths.build}/${req.url}`);
    })
    .catch(() => {
      expect(true).toBeFalse();
    });
  });

  it('should throw an error while trying to serve a file', () => {
    // Given
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const rollupWatch = {
      on: jest.fn(),
    };
    rollup.watch.mockImplementationOnce(() => rollupWatch);
    const mimeType = 'text/html';
    mime.getType.mockImplementationOnce(() => mimeType);
    const appLogger = {
      warning: jest.fn(),
      success: jest.fn(),
    };
    const events = {
      reduce: jest.fn((name, options) => options),
    };
    const targetToBuild = {
      name: 'target-to-build',
      paths: {
        build: 'dist/build',
      },
    };
    const targetToServe = {
      name: 'target-to-serve',
      paths: {
        build: 'dist/server',
      },
    };
    const targetsList = {
      [targetToBuild.name]: targetToBuild,
      [targetToServe.name]: targetToServe,
    };
    const targets = {
      getTarget: jest.fn((name) => targetsList[name]),
    };
    const rollupConfig = 'target-rollup-config';
    const rollupConfiguration = {
      getConfig: jest.fn(() => rollupConfig),
    };
    const req = {
      url: 'some-url',
      originalUrl: 'some-url',
    };
    const error = new Error('unknown');
    const res = {
      setHeader: jest.fn(),
      sendFile: jest.fn((filepath, fn) => {
        fn(error);
      }),
    };
    let sut = null;
    let middleware = null;
    let eventHandler = null;
    const expectedFilepath = `${targetToBuild.paths.build}/${req.url}`;
    // When
    sut = new RollupMiddleware(appLogger, events, targets, rollupConfiguration);
    middleware = sut.generate(targetToBuild.name, targetToServe.name).middleware();
    [[, eventHandler]] = rollupWatch.on.mock.calls;
    eventHandler({ code: 'END' });
    return new Promise((resolve) => {
      middleware(req, res, resolve);
    })
    // Then
    .then((result) => {
      expect(result).toBe(error);
      expect(appLogger.warning).toHaveBeenCalledTimes(0);
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(expectedFilepath);
      expect(res.setHeader).toHaveBeenCalledTimes(1);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', mimeType);
      expect(res.sendFile).toHaveBeenCalledTimes(1);
      expect(res.sendFile).toHaveBeenCalledWith(expectedFilepath, expect.any(Function));
    })
    .catch(() => {
      expect(true).toBeFalse();
    });
  });

  it('should serve a file', () => {
    // Given
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const rollupWatch = {
      on: jest.fn(),
    };
    rollup.watch.mockImplementationOnce(() => rollupWatch);
    const mimeType = 'text/html';
    mime.getType.mockImplementationOnce(() => mimeType);
    const appLogger = {
      warning: jest.fn(),
      success: jest.fn(),
    };
    const events = {
      reduce: jest.fn((name, options) => options),
    };
    const targetToBuild = {
      name: 'target-to-build',
      paths: {
        build: 'dist/build',
      },
    };
    const targetToServe = {
      name: 'target-to-serve',
      paths: {
        build: 'dist/server',
      },
    };
    const targetsList = {
      [targetToBuild.name]: targetToBuild,
      [targetToServe.name]: targetToServe,
    };
    const targets = {
      getTarget: jest.fn((name) => targetsList[name]),
    };
    const rollupConfig = 'target-rollup-config';
    const rollupConfiguration = {
      getConfig: jest.fn(() => rollupConfig),
    };
    const req = {
      url: 'some-url',
      originalUrl: 'some-url',
    };
    const res = {
      setHeader: jest.fn(),
      sendFile: jest.fn((filepath, fn) => {
        fn();
      }),
      end: null,
    };
    let sut = null;
    let middleware = null;
    let eventHandler = null;
    const expectedFilepath = `${targetToBuild.paths.build}/${req.url}`;
    // When
    sut = new RollupMiddleware(appLogger, events, targets, rollupConfiguration);
    middleware = sut.generate(targetToBuild.name, targetToServe.name).middleware();
    [[, eventHandler]] = rollupWatch.on.mock.calls;
    eventHandler({ code: 'END' });
    return new Promise((resolve) => {
      res.end = jest.fn(() => resolve());
      middleware(req, res);
    })
    // Then
    .then(() => {
      expect(appLogger.warning).toHaveBeenCalledTimes(0);
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(expectedFilepath);
      expect(res.setHeader).toHaveBeenCalledTimes(1);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', mimeType);
      expect(res.sendFile).toHaveBeenCalledTimes(1);
      expect(res.sendFile).toHaveBeenCalledWith(expectedFilepath, expect.any(Function));
      expect(res.end).toHaveBeenCalledTimes(1);
    })
    .catch(() => {
      expect(true).toBeFalse();
    });
  });

  it('should only compile once, no matter how many times the middleware is created', () => {
    // Given
    const rollupWatch = {
      on: jest.fn(),
    };
    rollup.watch.mockImplementationOnce(() => rollupWatch);
    const appLogger = 'appLogger';
    const events = {
      reduce: jest.fn((name, options) => options),
    };
    const targetToBuild = {
      name: 'target-to-build',
      paths: {
        build: 'dist/build',
      },
    };
    const targetToServe = {
      name: 'target-to-serve',
      paths: {
        build: 'dist/server',
      },
    };
    const targetsList = {
      [targetToBuild.name]: targetToBuild,
      [targetToServe.name]: targetToServe,
    };
    const targets = {
      getTarget: jest.fn((name) => targetsList[name]),
    };
    const rollupConfig = 'target-rollup-config';
    const rollupConfiguration = {
      getConfig: jest.fn(() => rollupConfig),
    };
    let sut = null;
    let middlewareGenerator = null;
    // When
    sut = new RollupMiddleware(appLogger, events, targets, rollupConfiguration);
    middlewareGenerator = sut.generate(targetToBuild.name, targetToServe.name).middleware;
    middlewareGenerator();
    middlewareGenerator();
    middlewareGenerator();
    // Then
    expect(rollup.watch).toHaveBeenCalledTimes(1);
  });

  it('should return access to the file system when Rollup finishes the build', () => {
    // Given
    const rollupWatch = {
      on: jest.fn(),
    };
    rollup.watch.mockImplementationOnce(() => rollupWatch);
    const appLogger = {
      warning: jest.fn(),
      success: jest.fn(),
    };
    const events = {
      reduce: jest.fn((name, options) => options),
    };
    const targetToBuild = {
      name: 'target-to-build',
      paths: {
        build: 'dist/build',
      },
    };
    const targetToServe = {
      name: 'target-to-serve',
      paths: {
        build: 'dist/server',
      },
    };
    const targetsList = {
      [targetToBuild.name]: targetToBuild,
      [targetToServe.name]: targetToServe,
    };
    const targets = {
      getTarget: jest.fn((name) => targetsList[name]),
    };
    const rollupConfig = 'target-rollup-config';
    const rollupConfiguration = {
      getConfig: jest.fn(() => rollupConfig),
    };
    let sut = null;
    let info = null;
    let eventHandler = null;
    let promise = null;
    // When
    sut = new RollupMiddleware(appLogger, events, targets, rollupConfiguration);
    info = sut.generate(targetToBuild.name, targetToServe.name);
    info.middleware();
    [[, eventHandler]] = rollupWatch.on.mock.calls;
    eventHandler({ code: 'START' });
    promise = info.getFileSystem();
    eventHandler({ code: 'END' });
    return promise
    .then((result) => {
      // Then
      expect(result).toBe(fs);
      return new Promise((resolve) => {
        setTimeout(() => resolve(), 1);
        jest.runAllTimers();
      });
    })
    .then(() => {
      expect(appLogger.warning).toHaveBeenCalledTimes(1);
      expect(appLogger.success).toHaveBeenCalledTimes(1);
      return info.getFileSystem();
    })
    .then((result) => {
      expect(result).toBe(fs);
      eventHandler({ code: 'START' });
      promise = info.getFileSystem();
      eventHandler({ code: 'END' });
      return promise;
    })
    .then((result) => {
      expect(result).toBe(fs);
    })
    .catch(() => {
      expect(true).toBeFalse();
    });
  });

  it('should provide access to the build directory', () => {
    // Given
    const rollupWatch = {
      on: jest.fn(),
    };
    rollup.watch.mockImplementationOnce(() => rollupWatch);
    const appLogger = {
      warning: jest.fn(),
      success: jest.fn(),
    };
    const events = {
      reduce: jest.fn((name, options) => options),
    };
    const targetToBuild = {
      name: 'target-to-build',
      paths: {
        build: 'dist/build',
      },
    };
    const targetToServe = {
      name: 'target-to-serve',
      paths: {
        build: 'dist/server',
      },
    };
    const targetsList = {
      [targetToBuild.name]: targetToBuild,
      [targetToServe.name]: targetToServe,
    };
    const targets = {
      getTarget: jest.fn((name) => targetsList[name]),
    };
    const rollupConfig = 'target-rollup-config';
    const rollupConfiguration = {
      getConfig: jest.fn(() => rollupConfig),
    };
    let sut = null;
    let info = null;
    let result = null;
    // When
    sut = new RollupMiddleware(appLogger, events, targets, rollupConfiguration);
    info = sut.generate(targetToBuild.name, targetToServe.name);
    result = info.getDirectory();
    // Then
    expect(result).toBe(targetToServe.paths.build);
  });

  it('should log an error message when Rollup fails to build a target', () => {
    // Given
    process.exit = jest.fn();
    const rollupWatch = {
      on: jest.fn(),
    };
    rollup.watch.mockImplementationOnce(() => rollupWatch);
    const appLogger = {
      error: jest.fn(),
    };
    const events = {
      reduce: jest.fn((name, options) => options),
    };
    const targetToBuild = {
      name: 'target-to-build',
      paths: {
        build: 'dist/build',
      },
    };
    const targetToServe = {
      name: 'target-to-serve',
      paths: {
        build: 'dist/server',
      },
    };
    const targetsList = {
      [targetToBuild.name]: targetToBuild,
      [targetToServe.name]: targetToServe,
    };
    const targets = {
      getTarget: jest.fn((name) => targetsList[name]),
    };
    const rollupConfig = 'target-rollup-config';
    const rollupConfiguration = {
      getConfig: jest.fn(() => rollupConfig),
    };
    const errorEvent = {
      code: 'ERROR',
    };
    const fatalEvent = {
      code: 'FATAL',
      error: new Error('Some fatal error'),
    };
    let sut = null;
    let info = null;
    let eventHandler = null;
    // When
    sut = new RollupMiddleware(appLogger, events, targets, rollupConfiguration);
    info = sut.generate(targetToBuild.name, targetToServe.name);
    info.middleware();
    [[, eventHandler]] = rollupWatch.on.mock.calls;
    eventHandler(errorEvent);
    eventHandler(fatalEvent);
    // Then
    expect(appLogger.error).toHaveBeenCalledTimes([
      'error',
      'fatal',
      'fatal-error',
    ].length);
    expect(appLogger.error).toHaveBeenCalledWith('The Rollup build can\'t be created');
    expect(appLogger.error)
    .toHaveBeenCalledWith('There was a problem while creating the Rollup build');
    expect(appLogger.error).toHaveBeenCalledWith(fatalEvent.error);
    expect(process.exit).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should include a provider for the DIC', () => {
    // Given
    let sut = null;
    const container = {
      set: jest.fn(),
      get: jest.fn((service) => service),
    };
    let serviceName = null;
    let serviceFn = null;
    // When
    rollupMiddleware(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('rollupMiddleware');
    expect(serviceFn).toBeFunction();
    expect(sut).toBeInstanceOf(RollupMiddleware);
    expect(sut.appLogger).toBe('appLogger');
    expect(sut.events).toBe('events');
    expect(sut.targets).toBe('targets');
    expect(sut.rollupConfiguration).toBe('rollupConfiguration');
  });
});
