const projext = require('projext/index');
const { middleware } = require('jimpex');

const { rollupFrontendFs, rollupSendFile } = require('./jimpex/index');
/**
 * Implements the Rollup middleware for a target on a Jimpex app.
 * @param {Jimpex} jimpexApp     The app where the middleware is going to be registered.
 * @param {string} targetToBuild The name of the target that will be builded on the middleware.
 * @param {string} targetToServe The name of the target that will implement the middleware.
 *                               When the other target is builded, it will assume that is on the
 *                               distribution directory, and if the target serving it is being
 *                               executed from the source directory it won't be able to use the
 *                               file system without hardcoding some relatives paths from the
 *                               build to the source; to avoid that, the method gets the build
 *                               path of this target, so when using `getDirectory()`, it
 *                               will think they are both on the distribution directory and the
 *                               paths can be created relative to that.
 * @return {MiddlewareInformation}
 */
const useJimpex = (jimpexApp, targetToBuild, targetToServe) => {
  // Get the middleware service.
  const rollupMiddleware = projext.get('rollupMiddleware');
  // Generate the middleware for the target.
  const info = rollupMiddleware.generate(targetToBuild, targetToServe);
  /**
   * Register the overwrite services...
   * - The `rollupFrontendFs` overwrites the regular `frontendFs` in order to block the file system
   * until Rollup finishes the build process.
   * - The `rollupSendFile` overwrites the regular `sendFile`, so instead of doing
   * `reqsponse.sendFile`, it will first read the file using the updated `frontendFs` and then
   * send its data as response.
   */
  jimpexApp.register(rollupFrontendFs(
    info.getDirectory,
    info.getFileSystem
  ));
  jimpexApp.register(rollupSendFile);
  // Register the middleware.
  jimpexApp.use(middleware(() => info.middleware()));
  // Add an event listener that shows a _'waiting'_ message when the server starts.
  jimpexApp.get('events').once('after-start', () => {
    jimpexApp.get('appLogger').warning('waiting for Rollup...');
  });

  return info;
};

module.exports = useJimpex;
