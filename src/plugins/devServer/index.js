const { createServer: createHTTPSServer } = require('https');
const { createServer: createHTTPServer } = require('http');
const path = require('path');
const opener = require('opener');
const fs = require('fs-extra');
const extend = require('extend');
const mime = require('mime');
const statuses = require('statuses');
const { Logger } = require('wootils/node/logger');

class RollupDevServerPlugin {
  constructor(options = {}, name) {
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

    this.name = name || 'rollup-plugin-dev-server';

    this._options.contentBase = this._normalizeContentBase();

    this.start = {
      ongenerate: this._startServer.bind(this),
    };
    this.stop = {
      load: this._stopServer.bind(this),
    };

    const protocol = this._options.https ? 'https' : 'http';
    this.url = `${protocol}://${this._options.host}:${this._options.port}`;

    this._logger = this._createLogger();
    this._instance = null;
    this._terminationEvents = ['SIGINT', 'SIGTERM'];
    this._alreadyOpen = false;
    this._NOT_FOUND_ERROR = 'ENOENT: no such file or directory';
    this._defaultFaviconPath = path.join(path.dirname(__filename), 'favicon.ico');

    mime.default_type = 'text/plain';

    this._handler = this._handler.bind(this);
    this._terminate = this._terminate.bind(this);
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

  _normalizeContentBase() {
    const newContentBase = [];
    const { contentBase } = this._options;
    if (Array.isArray(contentBase)) {
      if (contentBase.length) {
        contentBase.push(...contentBase);
      } else {
        contentBase.push('./');
      }
    } else {
      newContentBase.push(contentBase);
    }

    return newContentBase;
  }

  _startServer() {
    if (!this._instance) {
      const { https, port } = this._options;
      this._instance = https ?
        createHTTPSServer(https, this._handler) :
        createHTTPServer(this._handler);

      this._instance.listen(port);
      this._logger.success(`Your app is running on the port ${port}`);
      this._startListeningForTermination();
      this._open();
      this._options.onStart(this);
    }
  }

  _stopServer() {
    if (this._instance) {
      this._instance.close();
      this._instance = null;
      this._stopListeningForTermination();
      this._options.onStop(this);
    }
  }

  _terminate() {
    this._stopServer();
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

  _open() {
    if (!this._alreadyOpen && this._options.open) {
      opener(this.url);
    }
  }

  _handler(req, res) {
    const urlPath = decodeURI(req.url.split('?').shift());
    this._readFileFromContentBase(urlPath)
    .then((contents) => {
      this._serveFile(res, urlPath, contents);
    })
    .catch((error) => {
      if (error.message && error.message === this._NOT_FOUND_ERROR) {
        if (req.url === '/favicon.ico') {
          this._serveDefaultFavicon(res);
        } else if (this._options.historyApiFallback) {
          this._fallback(res);
        } else {
          this._notFound(res, urlPath);
        }
      } else {
        this._internalError(res, error);
      }
    });
  }

  _readFileFromContentBase(urlPath, contentBaseIndex = 0) {
    let result;
    const contentBase = this._options.contentBase[contentBaseIndex];
    if (!contentBase) {
      result = Promise.reject(new Error(this._NOT_FOUND_ERROR));
    } else {
      let filepath = path.join(contentBase, urlPath);
      if (filepath.endsWith('/')) {
        filepath = `${filepath}/index.html`;
      }

      if (fs.pathExistsSync(filepath)) {
        result = fs.readFile(filepath);
      } else {
        result = this._readFileFromContentBase(urlPath, contentBaseIndex + 1);
      }
    }

    return result;
  }

  _serveFile(res, urlPath, file) {
    res.writeHead(statuses.ok, {
      'Content-Type': mime.getType(urlPath),
    });

    res.end(file, 'utf-8');
  }

  _serveDefaultFavicon(res) {
    fs.readFile(this._defaultFaviconPath)
    .then((favicon) => {
      this._serveFile(res, '/favicon.ico', favicon);
    })
    .catch((error) => {
      this._internalError(res, error);
    });
  }

  _notFound(res, urlPath) {
    this._responsdWithError(res, statuses['not found'], urlPath);
  }

  _internalError(res, error) {
    let message;
    if (error instanceof Error) {
      const stackList = error.stack.split('\n');
      stackList.shift();
      const stackText = stackList.map((line) => `  -> ${line.trim()}`).join('\n');
      message = `${error.message}\n\n${stackText}`;
    } else {
      message = error;
    }

    this._responsdWithError(res, statuses['internal server error'], message);
  }

  _responsdWithError(res, status, message) {
    const title = statuses[status];
    const text = `${status} ${title}\n\n` +
      `${message}\n\n` +
      `${this.name}`;

    res.writeHead(status);
    res.end(text, 'utf-8');
  }
}

const devServer = (options, name) => new RollupDevServerPlugin(options, name);

module.exports = {
  RollupDevServerPlugin,
  devServer,
};
