/* eslint-disable no-console */
jest.mock('fs-extra');
jest.mock('prettysize');
jest.mock('colors/safe');
jest.unmock('/src/plugins/stats');

require('jasmine-expect');
const fs = require('fs-extra');
const prettysize = require('prettysize');
const colors = require('colors/safe');
const {
  ProjextRollupStatsPlugin,
  stats,
} = require('/src/plugins/stats');

const originalLog = console.log;

describe('plugins:stats', () => {
  beforeEach(() => {
    fs.pathExistsSync.mockClear();
    fs.lstatSync.mockClear();
    prettysize.mockClear();
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it('should be instantiated with default options', () => {
    // Given
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupStatsPlugin();
    result = sut.getOptions();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupStatsPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-stats');
    expect(sut.log).toBeFunction();
    expect(sut.add).toBeFunction();
    expect(result).toEqual({
      path: '',
    });
  });

  it('should provide the `log` \'sub plugin\'', () => {
    // Given
    let mainPlugin = null;
    let sut = null;
    // When
    mainPlugin = new ProjextRollupStatsPlugin();
    sut = mainPlugin.log();
    // Then
    expect(sut).toEqual({
      onwrite: expect.any(Function),
    });
  });

  it('should throw an error when trying to use an invalid logger service', () => {
    // Given
    const logger = {};
    const options = {
      logger,
    };
    let mainPlugin = null;
    // When
    mainPlugin = new ProjextRollupStatsPlugin();
    // Then
    expect(() => mainPlugin.log(options))
    .toThrow(/The logger must be an instance of wootils' Logger class/i);
  });

  it('shouldn\'t throw an error when using a custom logger service', () => {
    // Given
    const logger = {
      log: jest.fn(),
    };
    const options = {
      logger,
    };
    let mainPlugin = null;
    // When/Then
    mainPlugin = new ProjextRollupStatsPlugin();
    mainPlugin.log(options);
  });

  it('should log an entry', () => {
    // Given
    console.log = jest.fn();
    colors.white = jest.fn((str) => str);
    colors.green = jest.fn((str) => str);
    colors.gray = jest.fn((str) => str);
    prettysize.mockImplementationOnce((size) => size);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const size = '1kb';
    fs.lstatSync.mockImplementationOnce(() => ({ size }));
    const entry = {
      plugin: 'my-plugin',
      filepath: 'index.js',
    };
    let mainPlugin = null;
    let sut = null;
    // When
    mainPlugin = new ProjextRollupStatsPlugin();
    mainPlugin.add(entry.plugin, entry.filepath);
    sut = mainPlugin.log();
    return sut.onwrite()
    .then(() => {
      // Then
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(entry.filepath);
      expect(fs.lstatSync).toHaveBeenCalledTimes(1);
      expect(fs.lstatSync).toHaveBeenCalledWith(entry.filepath);
      expect(prettysize).toHaveBeenCalledTimes(1);
      expect(prettysize).toHaveBeenCalledWith(size);
      expect(colors.white).toHaveBeenCalledTimes(4);
      expect(colors.green).toHaveBeenCalledTimes(1);
      expect(colors.gray).toHaveBeenCalledTimes(1);
      expect(colors.white).toHaveBeenCalledWith('   Asset');
      expect(colors.white).toHaveBeenCalledWith('Size');
      expect(colors.white).toHaveBeenCalledWith('Plugin   ');
      expect(colors.green).toHaveBeenCalledWith(entry.filepath);
      expect(colors.white).toHaveBeenCalledWith(`${size} `);
      expect(colors.gray).toHaveBeenCalledWith(entry.plugin);
      expect(console.log).toHaveBeenCalledTimes(1);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('shouldn\'t log anything if the queue is reseted', () => {
    // Given
    console.log = jest.fn();
    colors.white = jest.fn((str) => str);
    colors.green = jest.fn();
    colors.gray = jest.fn();
    let mainPlugin = null;
    let sut = null;
    // When
    mainPlugin = new ProjextRollupStatsPlugin();
    mainPlugin.add('my-plugin', 'charito.js');
    mainPlugin.reset().intro();
    sut = mainPlugin.log();
    return sut.onwrite()
    .then(() => {
      // Then
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(0);
      expect(fs.lstatSync).toHaveBeenCalledTimes(0);
      expect(prettysize).toHaveBeenCalledTimes(0);
      expect(colors.white).toHaveBeenCalledTimes(3);
      expect(colors.green).toHaveBeenCalledTimes(0);
      expect(colors.gray).toHaveBeenCalledTimes(0);
      expect(colors.white).toHaveBeenCalledWith('Asset');
      expect(colors.white).toHaveBeenCalledWith('Size');
      expect(colors.white).toHaveBeenCalledWith('Plugin');
      expect(console.log).toHaveBeenCalledTimes(1);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should log multiple entries', () => {
    // Given
    console.log = jest.fn();
    colors.white = jest.fn((str) => str);
    colors.green = jest.fn((str) => str);
    colors.gray = jest.fn((str) => str);
    prettysize.mockImplementationOnce((size) => size);
    prettysize.mockImplementationOnce((size) => size);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const sizeOne = '1kb';
    const sizeTwo = '20 Bytes';
    const sizeTwoNormalized = '20 B';
    fs.lstatSync.mockImplementationOnce(() => ({ size: sizeOne }));
    fs.lstatSync.mockImplementationOnce(() => ({ size: sizeTwo }));
    const entryOne = {
      plugin: 'my-plugin',
      filepath: 'index.js',
    };
    const entryTwo = {
      plugin: 'my-other-plugin',
      filepath: 'file.js',
    };
    let mainPlugin = null;
    let sut = null;
    // When
    mainPlugin = new ProjextRollupStatsPlugin();
    mainPlugin.add(entryOne.plugin, entryOne.filepath);
    mainPlugin.add(entryTwo.plugin, entryTwo.filepath);
    sut = mainPlugin.log();
    return sut.onwrite()
    .then(() => {
      // Then
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(2);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(entryOne.filepath);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(entryTwo.filepath);
      expect(fs.lstatSync).toHaveBeenCalledTimes(2);
      expect(fs.lstatSync).toHaveBeenCalledWith(entryOne.filepath);
      expect(fs.lstatSync).toHaveBeenCalledWith(entryTwo.filepath);
      expect(prettysize).toHaveBeenCalledTimes(2);
      expect(prettysize).toHaveBeenCalledWith(sizeOne);
      expect(prettysize).toHaveBeenCalledWith(sizeTwo);
      expect(colors.white).toHaveBeenCalledTimes(5);
      expect(colors.green).toHaveBeenCalledTimes(2);
      expect(colors.gray).toHaveBeenCalledTimes(2);
      expect(colors.white).toHaveBeenCalledWith('   Asset');
      expect(colors.white).toHaveBeenCalledWith('Size');
      expect(colors.white).toHaveBeenCalledWith('Plugin         ');
      expect(colors.green).toHaveBeenCalledWith(entryOne.filepath);
      expect(colors.green).toHaveBeenCalledWith(` ${entryTwo.filepath}`);
      expect(colors.white).toHaveBeenCalledWith(`${sizeOne} `);
      expect(colors.white).toHaveBeenCalledWith(sizeTwoNormalized);
      expect(colors.gray).toHaveBeenCalledWith(`${entryOne.plugin}      `);
      expect(colors.gray).toHaveBeenCalledWith(entryTwo.plugin);
      expect(console.log).toHaveBeenCalledTimes(1);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should log an entry with a custom logger', () => {
    // Given
    colors.white = jest.fn((str) => str);
    colors.green = jest.fn((str) => str);
    colors.gray = jest.fn((str) => str);
    prettysize.mockImplementationOnce((size) => size);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const size = '1kb';
    fs.lstatSync.mockImplementationOnce(() => ({ size }));
    const mainOptions = {
      path: '/dist/',
    };
    const entry = {
      plugin: 'my-plugin',
      filepath: 'index.js',
    };
    const logger = {
      log: jest.fn(),
    };
    const options = {
      logger,
    };
    let mainPlugin = null;
    let sut = null;
    // When
    mainPlugin = new ProjextRollupStatsPlugin(mainOptions);
    mainPlugin.add(entry.plugin, entry.filepath);
    sut = mainPlugin.log(options);
    return sut.onwrite()
    .then(() => {
      // Then
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(entry.filepath);
      expect(fs.lstatSync).toHaveBeenCalledTimes(1);
      expect(fs.lstatSync).toHaveBeenCalledWith(entry.filepath);
      expect(prettysize).toHaveBeenCalledTimes(1);
      expect(prettysize).toHaveBeenCalledWith(size);
      expect(colors.white).toHaveBeenCalledTimes(4);
      expect(colors.green).toHaveBeenCalledTimes(1);
      expect(colors.gray).toHaveBeenCalledTimes(1);
      expect(colors.white).toHaveBeenCalledWith('   Asset');
      expect(colors.white).toHaveBeenCalledWith('Size');
      expect(colors.white).toHaveBeenCalledWith('Plugin   ');
      expect(colors.green).toHaveBeenCalledWith(entry.filepath);
      expect(colors.white).toHaveBeenCalledWith(`${size} `);
      expect(colors.gray).toHaveBeenCalledWith(entry.plugin);
      expect(logger.log).toHaveBeenCalledTimes(1);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should remove the output path from the filepaths it logs', () => {
    // Given
    colors.white = jest.fn((str) => str);
    colors.green = jest.fn((str) => str);
    colors.gray = jest.fn((str) => str);
    prettysize.mockImplementationOnce((size) => size);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const size = '1kb';
    fs.lstatSync.mockImplementationOnce(() => ({ size }));
    const mainOptions = {
      path: '/dist/',
    };
    const entryFile = 'index.js';
    const entry = {
      plugin: 'my-plugin',
      filepath: `${mainOptions.path}${entryFile}`,
    };
    const logger = {
      log: jest.fn(),
    };
    const options = {
      logger,
    };
    let mainPlugin = null;
    let sut = null;
    // When
    mainPlugin = new ProjextRollupStatsPlugin(mainOptions);
    mainPlugin.add(entry.plugin, entry.filepath);
    sut = mainPlugin.log(options);
    return sut.onwrite()
    .then(() => {
      // Then
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(entry.filepath);
      expect(fs.lstatSync).toHaveBeenCalledTimes(1);
      expect(fs.lstatSync).toHaveBeenCalledWith(entry.filepath);
      expect(prettysize).toHaveBeenCalledTimes(1);
      expect(prettysize).toHaveBeenCalledWith(size);
      expect(colors.white).toHaveBeenCalledTimes(4);
      expect(colors.green).toHaveBeenCalledTimes(1);
      expect(colors.gray).toHaveBeenCalledTimes(1);
      expect(colors.white).toHaveBeenCalledWith('   Asset');
      expect(colors.white).toHaveBeenCalledWith('Size');
      expect(colors.white).toHaveBeenCalledWith('Plugin   ');
      expect(colors.green).toHaveBeenCalledWith(entryFile);
      expect(colors.white).toHaveBeenCalledWith(`${size} `);
      expect(colors.gray).toHaveBeenCalledWith(entry.plugin);
      expect(logger.log).toHaveBeenCalledTimes(1);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should add and log extra entries', () => {
    // Given
    console.log = jest.fn();
    colors.white = jest.fn((str) => str);
    colors.green = jest.fn((str) => str);
    colors.gray = jest.fn((str) => str);
    prettysize.mockImplementationOnce((size) => size);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const size = '1kb';
    fs.lstatSync.mockImplementationOnce(() => ({ size }));
    const entry = {
      plugin: 'my-plugin',
      filepath: 'index.js',
    };
    let mainPlugin = null;
    let sut = null;
    // When
    mainPlugin = new ProjextRollupStatsPlugin();
    sut = mainPlugin.log({
      extraEntries: [entry],
    });
    return sut.onwrite()
    .then(() => {
      // Then
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(entry.filepath);
      expect(fs.lstatSync).toHaveBeenCalledTimes(1);
      expect(fs.lstatSync).toHaveBeenCalledWith(entry.filepath);
      expect(prettysize).toHaveBeenCalledTimes(1);
      expect(prettysize).toHaveBeenCalledWith(size);
      expect(colors.white).toHaveBeenCalledTimes(4);
      expect(colors.green).toHaveBeenCalledTimes(1);
      expect(colors.gray).toHaveBeenCalledTimes(1);
      expect(colors.white).toHaveBeenCalledWith('   Asset');
      expect(colors.white).toHaveBeenCalledWith('Size');
      expect(colors.white).toHaveBeenCalledWith('Plugin   ');
      expect(colors.green).toHaveBeenCalledWith(entry.filepath);
      expect(colors.white).toHaveBeenCalledWith(`${size} `);
      expect(colors.gray).toHaveBeenCalledWith(entry.plugin);
      expect(console.log).toHaveBeenCalledTimes(1);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should highlight a file generated by Rollup', () => {
    // Given
    console.log = jest.fn();
    colors.white = jest.fn((str) => str);
    colors.cyan = jest.fn((str) => str);
    prettysize.mockImplementationOnce((size) => size);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const size = '1kb';
    fs.lstatSync.mockImplementationOnce(() => ({ size }));
    const entry = {
      plugin: 'rollup',
      filepath: 'index.js',
    };
    let mainPlugin = null;
    let sut = null;
    // When
    mainPlugin = new ProjextRollupStatsPlugin();
    sut = mainPlugin.log({
      extraEntries: [entry],
    });
    return sut.onwrite()
    .then(() => {
      // Then
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(entry.filepath);
      expect(fs.lstatSync).toHaveBeenCalledTimes(1);
      expect(fs.lstatSync).toHaveBeenCalledWith(entry.filepath);
      expect(prettysize).toHaveBeenCalledTimes(1);
      expect(prettysize).toHaveBeenCalledWith(size);
      expect(colors.white).toHaveBeenCalledTimes(3);
      expect(colors.cyan).toHaveBeenCalledTimes(3);
      expect(colors.white).toHaveBeenCalledWith('   Asset');
      expect(colors.white).toHaveBeenCalledWith('Size');
      expect(colors.white).toHaveBeenCalledWith('Plugin');
      expect(colors.cyan).toHaveBeenCalledWith(entry.filepath);
      expect(colors.cyan).toHaveBeenCalledWith(`${size} `);
      expect(colors.cyan).toHaveBeenCalledWith(entry.plugin);
      expect(console.log).toHaveBeenCalledTimes(1);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should wait for an entry promise to be resolved and the log it', () => {
    // Given
    console.log = jest.fn();
    colors.white = jest.fn((str) => str);
    colors.green = jest.fn((str) => str);
    colors.gray = jest.fn((str) => str);
    prettysize.mockImplementationOnce((size) => size);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const size = '1kb';
    fs.lstatSync.mockImplementationOnce(() => ({ size }));
    const entry = {
      plugin: 'my-plugin',
      filepath: 'index.js',
    };
    let mainPlugin = null;
    let sut = null;
    // When
    mainPlugin = new ProjextRollupStatsPlugin();
    mainPlugin.add(Promise.resolve(entry));
    sut = mainPlugin.log();
    return sut.onwrite()
    .then(() => {
      // Then
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(entry.filepath);
      expect(fs.lstatSync).toHaveBeenCalledTimes(1);
      expect(fs.lstatSync).toHaveBeenCalledWith(entry.filepath);
      expect(prettysize).toHaveBeenCalledTimes(1);
      expect(prettysize).toHaveBeenCalledWith(size);
      expect(colors.white).toHaveBeenCalledTimes(4);
      expect(colors.green).toHaveBeenCalledTimes(1);
      expect(colors.gray).toHaveBeenCalledTimes(1);
      expect(colors.white).toHaveBeenCalledWith('   Asset');
      expect(colors.white).toHaveBeenCalledWith('Size');
      expect(colors.white).toHaveBeenCalledWith('Plugin   ');
      expect(colors.green).toHaveBeenCalledWith(entry.filepath);
      expect(colors.white).toHaveBeenCalledWith(`${size} `);
      expect(colors.gray).toHaveBeenCalledWith(entry.plugin);
      expect(console.log).toHaveBeenCalledTimes(1);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should provide a shorthand method to instantiate the plugin', () => {
    // Given
    let sut = null;
    // When
    sut = stats();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupStatsPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-stats');
    expect(sut.log).toBeFunction();
    expect(sut.add).toBeFunction();
  });
});
