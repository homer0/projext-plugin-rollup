const path = require('path');
const rollup = require('rollup');
const fs = require('fs-extra');
const mime = require('mime');
const { provider } = require('jimple');
const { deferred } = require('wootils/shared');

class RollupMiddleware {
  constructor(appLogger, events, targets, rollupConfiguration) {
    this.appLogger = appLogger;
    this.events = events;
    this.targets = targets;
    this.rollupConfiguration = rollupConfiguration;

    mime.default_type = 'text/plain';

    this._watcher = null;
    this._directories = {};
    this._fileSystemsReady = {};
    this._fileSystemsDeferreds = {};
  }

  generate(targetToBuild, targetToServe) {
    const target = this.targets.getTarget(targetToBuild);
    this._directories[target.name] = this.targets.getTarget(targetToServe).paths.build;
    this._fileSystemsReady[target.name] = false;
    this._fileSystemsDeferreds[target.name] = deferred();
    const getDirectory = () => this._directories[target.name];
    const getFileSystem = () => this._fileSystem(target);
    const middleware = () => this._middleware(target);

    return {
      getDirectory,
      getFileSystem,
      middleware,
    };
  }

  _fileSystem(target) {
    return this._fileSystemsReady[target.name] ?
      Promise.resolve(fs) :
      this._fileSystemsDeferreds[target.name].promise;
  }

  _middleware(target) {
    this._compile(target);
    return (req, res, next) => {
      if (this._fileSystemsReady[target.name]) {
        const urlPath = decodeURI(req.url.split('?').shift());
        const filepath = path.join(target.paths.build, urlPath);
        if (fs.pathExistsSync(filepath)) {
          res.setHeader('Content-Type', mime.getType(filepath));
          res.sendFile(filepath, (error) => {
            if (error) {
              next(error);
            } else {
              res.end();
            }
          });
        } else {
          next();
        }
      } else {
        this.appLogger.warning(`Request on hold until the build is ready: ${req.originalUrl}`);
        this._fileSystem(target)
        .then(() => {
          next();
        });
      }
    };
  }

  _compile(target) {
    if (!this._watcher) {
      const configuration = this.rollupConfiguration.getConfig(target, 'development');
      this._watcher = rollup.watch(configuration);

      this._watcher.on('event', (event) => {
        switch (event.code) {
        case 'START':
          this._onStart(target);
          break;
        case 'END':
          this._onFinish(target);
          break;
        case 'ERROR':
          this._onError(target, event);
          break;
        case 'FATAL':
          this._onError(target, event, true);
          break;
        default:
        }
      });
    }
  }

  _onStart(target) {
    setTimeout(() => {
      this.appLogger.warning('Creating the Rollup build...');
    }, 1);
    if (!this._fileSystemsDeferreds[target.name]) {
      this._fileSystemsReady[target.name] = false;
      this._fileSystemsDeferreds[target.name] = deferred();
    }
  }

  _onFinish(target) {
    setTimeout(() => {
      this.appLogger.success('The Rollup build is ready');
    }, 1);
    this._fileSystemsReady[target.name] = true;
    this._fileSystemsDeferreds[target.name].resolve(fs);
    delete this._fileSystemsDeferreds[target.name];
  }

  _onError() {
    this.appLogger.error('There was a problem while creating the Rollup build');
  }
}

const rollupMiddleware = provider((app) => {
  app.set('rollupMiddleware', () => new RollupMiddleware(
    app.get('appLogger'),
    app.get('events'),
    app.get('targets'),
    app.get('rollupConfiguration')
  ));
});

module.exports = {
  RollupMiddleware,
  rollupMiddleware,
};
