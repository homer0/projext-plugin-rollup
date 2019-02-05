jest.mock('opener');
jest.mock('fs-extra');
jest.mock('mime');
jest.mock('https');
jest.mock('http');
jest.unmock('/src/plugins/devServer');

require('jasmine-expect');
const path = require('path');
const { createServer: createHTTPSServer } = require('https');
const { createServer: createHTTPServer } = require('http');
const opener = require('opener');
const fs = require('fs-extra');
const mime = require('mime');
const ProjextRollupUtils = require('/src/plugins/utils');
const {
  ProjextRollupDevServerPlugin,
  devServer,
} = require('/src/plugins/devServer');

const originalProcessOn = process.on;
const originalProcessRemoveListener = process.removeListener;
const originalProcessExit = process.exit;

describe('plugins:devServer', () => {
  beforeEach(() => {
    ProjextRollupUtils.createLogger.mockClear();
    createHTTPSServer.mockClear();
    createHTTPServer.mockClear();
    opener.mockClear();
    fs.pathExistsSync.mockClear();
    fs.readFile.mockClear();
    mime.getType.mockClear();
  });

  afterEach(() => {
    process.on = originalProcessOn;
    process.removeListener = originalProcessRemoveListener;
    process.exit = originalProcessExit;
  });

  it('should be instantiated with default options', () => {
    // Given
    let sut = null;
    let result = null;
    let onStartFnResult = null;
    let onStopFnResult = null;
    // When
    sut = new ProjextRollupDevServerPlugin();
    result = sut.getOptions();
    onStartFnResult = result.onStart();
    onStopFnResult = result.onStop();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupDevServerPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-dev-server');
    expect(sut.url).toBe('http://localhost:8080');
    expect(sut.writeBundle).toBeFunction();
    expect(result).toEqual({
      host: 'localhost',
      port: 8080,
      contentBase: ['./'],
      historyApiFallback: false,
      https: null,
      open: true,
      logger: null,
      proxied: null,
      onStart: expect.any(Function),
      onStop: expect.any(Function),
    });
    expect(ProjextRollupUtils.createLogger).toHaveBeenCalledTimes(1);
    expect(ProjextRollupUtils.createLogger).toHaveBeenCalledWith(sut.name, null);
    expect(onStartFnResult).toBeUndefined();
    expect(onStopFnResult).toBeUndefined();
  });

  it('should be instantiated with custom options', () => {
    // Given
    const options = {
      host: 'my-host',
      port: 2509,
      contentBase: ['/'],
      historyApiFallback: true,
      https: {
        key: '.key',
        cert: '.cert',
        ca: '.ca',
      },
      open: false,
      logger: 'logger',
      proxied: {
        enabled: true,
        host: 'my-host',
      },
      onStart: jest.fn(),
      onStop: jest.fn(),
    };
    const name = 'my-dev-server-plugin';
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options, name);
    result = sut.getOptions();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupDevServerPlugin);
    expect(sut.name).toBe(name);
    expect(sut.url).toBe(`https://${options.host}:${options.port}`);
    expect(result).toEqual(options);
  });

  it('should be instantiated with a custom proxied host', () => {
    // Given
    const options = {
      host: 'my-host',
      port: 2509,
      contentBase: ['/'],
      historyApiFallback: true,
      https: null,
      open: false,
      logger: 'logger',
      proxied: {
        enabled: true,
        host: 'my-proxied-host',
      },
      onStart: jest.fn(),
      onStop: jest.fn(),
    };
    const name = 'my-dev-server-plugin';
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options, name);
    result = sut.getOptions();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupDevServerPlugin);
    expect(sut.name).toBe(name);
    expect(sut.url).toBe(`http://${options.proxied.host}`);
    expect(result).toEqual(options);
  });

  it('should be instantiated with a custom SSL proxied host', () => {
    // Given
    const options = {
      host: 'my-host',
      port: 2509,
      contentBase: ['/'],
      historyApiFallback: true,
      https: null,
      open: false,
      logger: 'logger',
      proxied: {
        enabled: true,
        host: 'my-proxied-host',
        https: true,
      },
      onStart: jest.fn(),
      onStop: jest.fn(),
    };
    const name = 'my-dev-server-plugin';
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options, name);
    result = sut.getOptions();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupDevServerPlugin);
    expect(sut.name).toBe(name);
    expect(sut.url).toBe(`https://${options.proxied.host}`);
    expect(result).toEqual(options);
  });

  it('should start the server', () => {
    // Given
    process.on = jest.fn();
    const server = {
      listen: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    const options = {
      onStart: jest.fn(),
    };
    let sut = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    // Then
    expect(createHTTPServer).toHaveBeenCalledTimes(1);
    expect(createHTTPServer).toHaveBeenCalledWith(expect.any(Function));
    expect(server.listen).toHaveBeenCalledTimes(1);
    expect(server.listen).toHaveBeenCalledWith(8080);
    expect(ProjextRollupUtils.createLogger).toHaveBeenCalledTimes(1);
    expect(ProjextRollupUtils.createLogger).toHaveBeenCalledWith(sut.name, null);
    expect(logger.warning).toHaveBeenCalledTimes(2);
    expect(logger.warning).toHaveBeenCalledWith('Starting on http://localhost:8080');
    expect(logger.warning).toHaveBeenCalledWith('waiting for Rollup...');
    expect(options.onStart).toHaveBeenCalledTimes(1);
    expect(options.onStart).toHaveBeenCalledWith(sut);
    expect(process.on).toHaveBeenCalledTimes(2);
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
  });

  it('shouldn\'t start the server if it is already running', () => {
    // Given
    process.on = jest.fn();
    const server = {
      listen: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    let sut = null;
    // When
    sut = new ProjextRollupDevServerPlugin();
    sut.writeBundle();
    sut.writeBundle();
    // Then
    expect(createHTTPServer).toHaveBeenCalledTimes(1);
  });

  it('should start the server with SSL', () => {
    // Given
    process.on = jest.fn();
    const server = {
      listen: jest.fn(),
    };
    createHTTPSServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    const options = {
      contentBase: './',
      https: {
        key: '.key',
        cert: '.cert',
        ca: '.ca',
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    result = sut.getOptions();
    sut.writeBundle();
    // Then
    expect(result.contentBase).toEqual([options.contentBase]);
    expect(createHTTPSServer).toHaveBeenCalledTimes(1);
    expect(createHTTPSServer).toHaveBeenCalledWith(options.https, expect.any(Function));
  });

  it('should start and stop the server', () => {
    // Given
    process.on = jest.fn();
    process.removeListener = jest.fn();
    process.exit = jest.fn();
    const server = {
      listen: jest.fn(),
      close: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    const options = {
      onStart: jest.fn(),
      onStop: jest.fn(),
    };
    let sut = null;
    let terminate = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    [[, terminate]] = process.on.mock.calls;
    terminate();
    // Then
    expect(createHTTPServer).toHaveBeenCalledTimes(1);
    expect(options.onStart).toHaveBeenCalledTimes(1);
    expect(options.onStart).toHaveBeenCalledWith(sut);
    expect(process.on).toHaveBeenCalledTimes(2);
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(options.onStop).toHaveBeenCalledTimes(1);
    expect(options.onStop).toHaveBeenCalledWith(sut);
    expect(server.close).toHaveBeenCalledTimes(1);
    expect(process.removeListener).toHaveBeenCalledTimes(2);
    expect(process.removeListener).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.removeListener).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(process.exit).toHaveBeenCalledTimes(1);
  });

  it('shouldn\'t stop the server if it\'s not running', () => {
    // Given
    process.on = jest.fn();
    process.removeListener = jest.fn();
    process.exit = jest.fn();
    const server = {
      listen: jest.fn(),
      close: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    const options = {
      onStart: jest.fn(),
      onStop: jest.fn(),
    };
    let sut = null;
    let terminate = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    [[, terminate]] = process.on.mock.calls;
    terminate();
    terminate();
    // Then
    expect(server.close).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledTimes(2);
  });

  it('should log the server URL using the the `showURL` sub plugin', () => {
    // Given
    process.on = jest.fn();
    const server = {
      listen: jest.fn(),
    };
    createHTTPSServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
      success: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    const options = {
      contentBase: './',
      https: {
        key: '.key',
        cert: '.cert',
        ca: '.ca',
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    result = sut.getOptions();
    sut.writeBundle();
    sut.showURL().writeBundle();
    jest.runAllTimers();
    // Then
    expect(result.contentBase).toEqual([options.contentBase]);
    expect(createHTTPSServer).toHaveBeenCalledTimes(1);
    expect(createHTTPSServer).toHaveBeenCalledWith(options.https, expect.any(Function));
    expect(logger.warning).toHaveBeenCalledTimes(2);
    expect(logger.warning).toHaveBeenCalledWith('Starting on https://localhost:8080');
    expect(logger.warning).toHaveBeenCalledWith('waiting for Rollup...');
    expect(logger.success).toHaveBeenCalledTimes(1);
    expect(logger.success).toHaveBeenCalledWith('Your app is running on https://localhost:8080');
  });

  it('should open the browser only once', () => {
    // Given
    process.on = jest.fn();
    process.removeListener = jest.fn();
    process.exit = jest.fn();
    const server = {
      listen: jest.fn(),
      close: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    const options = {
      onStart: jest.fn(),
      onStop: jest.fn(),
    };
    let sut = null;
    let terminate = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    [[, terminate]] = process.on.mock.calls;
    terminate();
    sut.writeBundle();
    // Then
    expect(opener).toHaveBeenCalledTimes(1);
    expect(opener).toHaveBeenCalledWith('http://localhost:8080');
  });

  it('should serve a file', () => {
    // Given
    process.on = jest.fn();
    const contentBase = './';
    const req = {
      url: 'some-file.html',
    };
    const res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const options = {
      contentBase,
    };
    const mimeType = 'text/something';
    mime.getType.mockImplementationOnce(() => mimeType);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const fileContents = 'some-code';
    fs.readFile.mockImplementationOnce(() => Promise.resolve(fileContents));
    const server = {
      listen: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    let sut = null;
    let handler = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    [[handler]] = createHTTPServer.mock.calls;
    return handler(req, res)
    .then(() => {
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(contentBase, req.url));
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(path.join(contentBase, req.url));
      expect(mime.getType).toHaveBeenCalledTimes(1);
      expect(mime.getType).toHaveBeenCalledWith(req.url);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': mimeType,
      });
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledWith(fileContents, 'utf-8');
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should serve a directory index', () => {
    // Given
    process.on = jest.fn();
    const contentBase = './';
    const req = {
      url: 'some/',
    };
    const res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const options = {
      contentBase,
    };
    const mimeType = 'text/html';
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const fileContents = 'some-code';
    fs.readFile.mockImplementationOnce(() => Promise.resolve(fileContents));
    const server = {
      listen: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    let sut = null;
    let handler = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    [[handler]] = createHTTPServer.mock.calls;
    return handler(req, res)
    .then(() => {
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(
        contentBase,
        req.url,
        'index.html'
      ));
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(path.join(contentBase, req.url, 'index.html'));
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': mimeType,
      });
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledWith(fileContents, 'utf-8');
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should serve a file after validating multiple directories', () => {
    // Given
    process.on = jest.fn();
    const firstContentBase = './first';
    const secondContentBase = './second';
    const req = {
      url: 'some-file.html',
    };
    const res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const options = {
      contentBase: [
        firstContentBase,
        secondContentBase,
      ],
    };
    const mimeType = 'text/something';
    mime.getType.mockImplementationOnce(() => mimeType);
    fs.pathExistsSync.mockImplementationOnce(() => false);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const fileContents = 'some-code';
    fs.readFile.mockImplementationOnce(() => Promise.resolve(fileContents));
    const server = {
      listen: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    let sut = null;
    let handler = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    [[handler]] = createHTTPServer.mock.calls;
    return handler(req, res)
    .then(() => {
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(2);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(firstContentBase, req.url));
      expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(secondContentBase, req.url));
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(path.join(secondContentBase, req.url));
      expect(fs.readFile).toHaveBeenCalledWith(path.join(secondContentBase, req.url));
      expect(mime.getType).toHaveBeenCalledTimes(1);
      expect(mime.getType).toHaveBeenCalledWith(req.url);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': mimeType,
      });
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledWith(fileContents, 'utf-8');
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should fail to serve a file', () => {
    // Given
    process.on = jest.fn();
    const contentBase = './';
    const req = {
      url: '/something.png',
    };
    const res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const options = {
      contentBase,
      historyApiFallback: false,
    };
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const readError = 'Some unknown error';
    fs.readFile.mockImplementationOnce(() => Promise.reject(readError));
    const server = {
      listen: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    let sut = null;
    let handler = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    [[handler]] = createHTTPServer.mock.calls;
    return handler(req, res)
    .then(() => {
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(contentBase, req.url));
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(expect.any(String));
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledWith(500);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledWith(expect.any(String), 'utf-8');
    })
    .catch((error) => {
      throw error;
    });
  });

  it('shouldn\'t find a file to serve', () => {
    // Given
    process.on = jest.fn();
    const contentBase = './';
    const req = {
      url: 'some-file.html',
    };
    const res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const options = {
      contentBase,
      historyApiFallback: false,
    };
    fs.pathExistsSync.mockImplementationOnce(() => false);
    const server = {
      listen: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    let sut = null;
    let handler = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    [[handler]] = createHTTPServer.mock.calls;
    return handler(req, res)
    .then(() => {
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(contentBase, req.url));
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledWith(404);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledWith(
        `404 Not Found\n\n${req.url}\n\n${sut.name}`,
        'utf-8'
      );
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should serve the default favicon', () => {
    // Given
    process.on = jest.fn();
    const contentBase = './';
    const req = {
      url: '/favicon.ico',
    };
    const res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const options = {
      contentBase,
      historyApiFallback: false,
    };
    const mimeType = 'image/ico';
    mime.getType.mockImplementationOnce(() => mimeType);
    fs.pathExistsSync.mockImplementationOnce(() => false);
    const fileContents = 'favicon-code';
    fs.readFile.mockImplementationOnce(() => Promise.resolve(fileContents));
    const server = {
      listen: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    let sut = null;
    let handler = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    [[handler]] = createHTTPServer.mock.calls;
    return handler(req, res)
    .then(() => {
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(contentBase, req.url));
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(expect.any(String));
      expect(mime.getType).toHaveBeenCalledTimes(1);
      expect(mime.getType).toHaveBeenCalledWith(req.url);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': mimeType,
      });
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledWith(fileContents, 'utf-8');
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should fail to serve the default favicon', () => {
    // Given
    process.on = jest.fn();
    const contentBase = './';
    const req = {
      url: '/favicon.ico',
    };
    const res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const options = {
      contentBase,
      historyApiFallback: false,
    };
    fs.pathExistsSync.mockImplementationOnce(() => false);
    const readError = new Error('Unknown error');
    fs.readFile.mockImplementationOnce(() => Promise.reject(readError));
    const server = {
      listen: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    let sut = null;
    let handler = null;
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    [[handler]] = createHTTPServer.mock.calls;
    return handler(req, res)
    .then(() => {
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(contentBase, req.url));
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(expect.any(String));
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledWith(500);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledWith(expect.any(String), 'utf-8');
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should serve the index when a file is not found', () => {
    // Given
    process.on = jest.fn();
    const contentBase = './';
    const req = {
      url: '/something',
    };
    const res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const options = {
      contentBase,
      historyApiFallback: true,
    };
    const mimeType = 'text/something';
    mime.getType.mockImplementationOnce(() => mimeType);
    fs.pathExistsSync.mockImplementationOnce(() => false);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const fileContents = 'some-code';
    fs.readFile.mockImplementationOnce(() => Promise.resolve(fileContents));
    const server = {
      listen: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    let sut = null;
    let handler = null;
    const expectedIndex = 'index.html';
    const expectedIndexPath = path.join(contentBase, expectedIndex);
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    [[handler]] = createHTTPServer.mock.calls;
    return handler(req, res)
    .then(() => {
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(2);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(contentBase, req.url));
      expect(fs.pathExistsSync).toHaveBeenCalledWith(expectedIndexPath);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(expectedIndexPath);
      expect(mime.getType).toHaveBeenCalledTimes(1);
      expect(mime.getType).toHaveBeenCalledWith(expectedIndex);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': mimeType,
      });
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledWith(fileContents, 'utf-8');
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should fail to serve the fallback', () => {
    // Given
    process.on = jest.fn();
    const contentBase = './';
    const req = {
      url: '/something',
    };
    const res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const options = {
      contentBase,
      historyApiFallback: true,
    };
    fs.pathExistsSync.mockImplementationOnce(() => false);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const readError = 'Some unknown error';
    fs.readFile.mockImplementationOnce(() => Promise.reject(readError));
    const server = {
      listen: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    let sut = null;
    let handler = null;
    const expectedIndex = 'index.html';
    const expectedIndexPath = path.join(contentBase, expectedIndex);
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    [[handler]] = createHTTPServer.mock.calls;
    return handler(req, res)
    .then(() => {
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(2);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(contentBase, req.url));
      expect(fs.pathExistsSync).toHaveBeenCalledWith(expectedIndexPath);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(expectedIndexPath);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledWith(500);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledWith(expect.any(String), 'utf-8');
    })
    .catch((error) => {
      throw error;
    });
  });

  it('shouldn\'t find the fallback file', () => {
    // Given
    process.on = jest.fn();
    const contentBase = './';
    const req = {
      url: '/something',
    };
    const res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const options = {
      contentBase,
      historyApiFallback: true,
    };
    fs.pathExistsSync.mockImplementationOnce(() => false);
    fs.pathExistsSync.mockImplementationOnce(() => false);
    const server = {
      listen: jest.fn(),
    };
    createHTTPServer.mockImplementationOnce(() => server);
    const logger = {
      warning: jest.fn(),
    };
    ProjextRollupUtils.createLogger.mockImplementationOnce(() => logger);
    let sut = null;
    let handler = null;
    const expectedIndex = 'index.html';
    const expectedIndexPath = path.join(contentBase, expectedIndex);
    // When
    sut = new ProjextRollupDevServerPlugin(options);
    sut.writeBundle();
    [[handler]] = createHTTPServer.mock.calls;
    return handler(req, res)
    .then(() => {
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(2);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(contentBase, req.url));
      expect(fs.pathExistsSync).toHaveBeenCalledWith(expectedIndexPath);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledWith(404);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledWith(
        `404 Not Found\n\n${req.url}\n\n${sut.name}`,
        'utf-8'
      );
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should provide a shorthand method to instantiate the plugin', () => {
    // Given
    let sut = null;
    // When
    sut = devServer();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupDevServerPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-dev-server');
    expect(sut.writeBundle).toBeFunction();
  });
});
