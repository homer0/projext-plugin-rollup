const path = require('path');
const { provider } = require('jimple');
/**
 * This service overwrites the `Jimpex` default `FrontendFs` so all its methods will wait for
 * Rollup to finish building the files before being able to read, write or delete them.
 */
class RollupFrontendFs {
  /**
   * @param {RollupMiddlewareGetDirectory}  getDirectory  A function to get the directory where
   *                                                      Rollup is bundling the files.
   * @param {RollupMiddlewareGetFileSystem} getFileSystem A function to get access to the file
   *                                                      system after Rollup finishes bundling
   *                                                      the files.
   */
  constructor(getDirectory, getFileSystem) {
    /**
     * A function to get the directory where Rollup is bundling the files.
     * @type {RollupMiddlewareGetDirectory}
     */
    this.getDirectory = getDirectory;
    /**
     * A function to get access to the file system after Rollup finishes bundling the files.
     * @type {RollupMiddlewareGetFileSystem}
     */
    this.getFileSystem = getFileSystem;
  }
  /**
   * Read a file from the file system.
   * @param {string} filepath           The path to the file.
   * @param {string} [encoding='utf-8'] The text encoding in which the file should be read.
   * @return {Promise<string,Error>}
   */
  read(filepath, encoding = 'utf-8') {
    return this.getFileSystem()
    .then((fileSystem) => new Promise((resolve, reject) => {
      fileSystem.readFile(this._getPath(filepath), encoding, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    }));
  }
  /**
   * Write a file on the file system.
   * @param {string} filepath The path to the file.
   * @param {string} data     The contents of the file.
   * @return {Promise<undefined,Error>}
   */
  write(filepath, data) {
    return this.getFileSystem()
    .then((fileSystem) => new Promise((resolve, reject) => {
      fileSystem.writeFile(this._getPath(filepath), data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    }));
  }
  /**
   * Delete a file from the file system.
   * @param {string} filepath The path to the file.
   * @return {Promise<undefined,Error>}
   */
  delete(filepath) {
    return this.getFileSystem()
    .then((fileSystem) => new Promise((resolve, reject) => {
      fileSystem.unlink(this._getPath(filepath), (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    }));
  }
  /**
   * Generate a path using the Rollup output directory as root.
   * @param {string} rest The path you want to prefix with the Rollup output directory.
   * @return {string}
   * @ignore
   * @access protected
   */
  _getPath(rest) {
    return path.join(this.getDirectory(), rest);
  }
}
/**
 * Generate a `Provider` with an already defined `getDirectory` and `getFileSystem` functions.
 * @example
 * // Generate the provider
 * const provider = rollupFrontendFs(() => 'some-dir', () => ...);
 * // Register it on the container
 * container.register(provider);
 * // Getting access to the service instance
 * const frontendFs = container.get('frontendFs');
 * @param {RollupMiddlewareGetDirectory}  getDirectory  A function to get the directory where
 *                                                      Rollup is bundling the files.
 * @param {RollupMiddlewareGetFileSystem} getFileSystem A function to get access to the file
 *                                                      system after Rollup finishes bundling
 *                                                      the files.
 * @return {Provider}
 */
const rollupFrontendFs = (getDirectory, getFileSystem) => provider((app) => {
  app.set('frontendFs', () => new RollupFrontendFs(
    getDirectory,
    getFileSystem
  ));
});

module.exports = {
  RollupFrontendFs,
  rollupFrontendFs,
};
