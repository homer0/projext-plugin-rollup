const { createServer: createHTTPSServer } = require('https');
const { createServer: createHTTPServer } = require('http');
const path = require('path');
const opener = require('opener');
const fs = require('fs-extra');
const extend = require('extend');
const mime = require('mime');
const statuses = require('statuses');

class RollupDevServerPlugin {
  constructor(options = {}, name) {
    this.options = extend(
      true,
      {
        host: 'localhost',
        port: 8080,
        contentBase: [],
        historyApiFallback: false,
        https: null,
        open: true,
        onStart: () => {},
        onStop: () => {},
      },
      options
    );

    if (Array.isArray(this.options.contentBase)) {
      if (!this.options.contentBase.length) {
        this.options.contentBase.push('./');
      }
    } else {
      this.options.contentBase = [this.options.contentBase];
    }

    this.name = name || 'rollup-plugin-dev-server';
    this.start = {
      overwrite: this._startServer.bind(this),
    };
    this.stop = {
      load: this._stopServer.bind(this),
    };

    const protocol = this.options.https ? 'https' : 'http';
    this.url = `${protocol}://${this.options.host}:${this.options.port}`;

    this._instance = null;
    this._terminationEvents = ['SIGINT', 'SIGTERM'];
    this._alreadyOpen = false;
    this._NOT_FOUND_ERROR = 'ENOENT: no such file or directory';
    this._defaultFaviconPath = path.join(path.dirname(__filename), 'favicon.ico');

    mime.default_type = 'text/plain';

    this._handler = this._handler.bind(this);
    this._terminate = this._terminate.bind(this);
  }

  _startServer() {
    if (!this._instance) {
      const { https, port } = this.options;
      this._instance = https ?
        createHTTPSServer(https, this._handler) :
        createHTTPServer(this._handler);

      this._instance.listen(port);
      this._startListeningForTermination();
      this._open();
      this.options.onStart(this);
    }
  }

  _stopServer() {
    if (this._instance) {
      this._instance.close();
      this._instance = null;
      this._stopListeningForTermination();
      this.options.onStop(this);
    }
  }

  _terminate() {
    this._stopServer();
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
    if (!this._alreadyOpen && this.options.open) {
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
        } else if (this.options.historyApiFallback) {
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
    const contentBase = this.options.contentBase[contentBaseIndex];
    if (!contentBase) {
      result = Promise.reject(new Error(this._NOT_FOUND_ERROR));
    } else {
      let filepath = path.join(this.options.contentBase, urlPath);
      if (filepath.endsWith('/')) {
        filepath = `${filepath}/index.html`;
      }

      if (fs.pathExistsSync(filepath)) {
        result = fs.readFile(filepath, 'utf-8');
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
    fs.readFile(this._defaultFaviconPath, 'utf-8')
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
