const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.mock('projext/index', () => ({ get: jest.fn() }));
jest.mock('jimpex', () => ({ middleware: jest.fn() }));
jest.mock('/src/jimpex/index', () => ({
  rollupFrontendFs: jest.fn(() => 'rollupFrontendFs'),
  rollupSendFile: 'rollupSendFile',
}));
jest.unmock('/src/jimpex.js');

require('jasmine-expect');

const projext = require('projext/index');
const jimpex = require('jimpex');
const jimpexServices = require('/src/jimpex/index');
const jimpexImplementation = require('/src/jimpex.js');

describe('plugin:projextRollup/Jimpex', () => {
  beforeEach(() => {
    projext.get.mockClear();
    jimpexServices.rollupFrontendFs.mockClear();
  });

  it('should implement the middlewares on the Jimpex App', () => {
    // Given
    const events = {
      once: jest.fn(),
    };
    const services = {
      events,
    };
    const jimpexApp = {
      register: jest.fn(),
      use: jest.fn(),
      get: jest.fn((service) => services[service] || service),
    };
    const middlewareCall = 'middleware!';
    const info = {
      middleware: () => middlewareCall,
      getDirectory: 'getDirectory',
      getFileSystem: 'getFileSystem',
    };
    const rollupMiddleware = {
      generate: jest.fn(() => info),
    };
    projext.get.mockImplementationOnce(() => rollupMiddleware);
    jimpex.middleware.mockImplementation((fn) => fn());
    const targetToBuild = 'target-to-build';
    const targetToServe = 'target-to-serve';
    const expectedRegisteredServices = [
      'rollupFrontendFs',
      'rollupSendFile',
    ];
    // When
    jimpexImplementation(jimpexApp, targetToBuild, targetToServe);
    // Then
    expect(projext.get).toHaveBeenCalledTimes(1);
    expect(projext.get).toHaveBeenCalledWith('rollupMiddleware');
    expect(rollupMiddleware.generate).toHaveBeenCalledTimes(1);
    expect(rollupMiddleware.generate).toHaveBeenCalledWith(targetToBuild, targetToServe);
    expect(jimpexApp.register).toHaveBeenCalledTimes(expectedRegisteredServices.length);
    expectedRegisteredServices.forEach((service) => {
      expect(jimpexApp.register).toHaveBeenCalledWith(service);
    });
    expect(jimpexApp.use).toHaveBeenCalledTimes(1);
    expect(jimpexApp.use).toHaveBeenCalledWith(middlewareCall);
    expect(jimpexServices.rollupFrontendFs).toHaveBeenCalledTimes(1);
    expect(jimpexServices.rollupFrontendFs).toHaveBeenCalledWith(
      info.getDirectory,
      info.getFileSystem
    );
    expect(events.once).toHaveBeenCalledTimes(1);
    expect(events.once).toHaveBeenCalledWith('after-start', expect.any(Function));
  });

  it('should add an "after start message" on the Jimpex App', () => {
    // Given
    const events = {
      once: jest.fn(),
    };
    const appLogger = {
      warning: jest.fn(),
    };
    const services = {
      events,
      appLogger,
    };
    const jimpexApp = {
      register: jest.fn(),
      use: jest.fn(),
      get: jest.fn((service) => services[service]),
    };
    const middlewareCall = 'middleware!';
    const info = {
      middleware: () => middlewareCall,
      getDirectory: 'getDirectory',
      getFileSystem: 'getFileSystem',
    };
    const rollupMiddleware = {
      generate: jest.fn(() => info),
    };
    projext.get.mockImplementationOnce(() => rollupMiddleware);
    jimpex.middleware.mockImplementation((fn) => fn());
    const targetToBuild = 'target-to-build';
    const targetToServe = 'target-to-serve';
    let eventListener = null;
    const expectedRegisteredServices = [
      'rollupFrontendFs',
      'rollupSendFile',
    ];
    // When
    jimpexImplementation(jimpexApp, targetToBuild, targetToServe);
    [[, eventListener]] = events.once.mock.calls;
    eventListener();
    // Then
    expect(projext.get).toHaveBeenCalledTimes(1);
    expect(projext.get).toHaveBeenCalledWith('rollupMiddleware');
    expect(rollupMiddleware.generate).toHaveBeenCalledTimes(1);
    expect(rollupMiddleware.generate).toHaveBeenCalledWith(targetToBuild, targetToServe);
    expect(jimpexApp.register).toHaveBeenCalledTimes(expectedRegisteredServices.length);
    expectedRegisteredServices.forEach((service) => {
      expect(jimpexApp.register).toHaveBeenCalledWith(service);
    });
    expect(jimpexApp.use).toHaveBeenCalledTimes(1);
    expect(jimpexApp.use).toHaveBeenCalledWith(middlewareCall);
    expect(jimpexServices.rollupFrontendFs).toHaveBeenCalledTimes(1);
    expect(jimpexServices.rollupFrontendFs).toHaveBeenCalledWith(
      info.getDirectory,
      info.getFileSystem
    );
    expect(events.once).toHaveBeenCalledTimes(1);
    expect(events.once).toHaveBeenCalledWith('after-start', expect.any(Function));
    expect(appLogger.warning).toHaveBeenCalledTimes(1);
    expect(appLogger.warning).toHaveBeenCalledWith(expect.any(String));
  });
});
