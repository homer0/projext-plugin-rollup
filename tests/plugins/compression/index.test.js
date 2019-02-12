jest.mock('zlib');
jest.mock('fs-extra');
jest.mock('rollup-pluginutils');
jest.unmock('/src/plugins/compression');

require('jasmine-expect');
const fs = require('fs-extra');
const rollupUtils = require('rollup-pluginutils');
const zlib = require('zlib');
const {
  ProjextRollupCompressionPlugin,
  compression,
} = require('/src/plugins/compression');

describe('plugins:compression', () => {
  beforeEach(() => {
    fs.pathExistsSync.mockReset();
    fs.readdirSync.mockReset();
    fs.lstatSync.mockReset();
    fs.createReadStream.mockReset();
    fs.createWriteStream.mockReset();
    zlib.createGzip.mockReset();
    rollupUtils.createFilter.mockReset();
  });

  it('should be instantiated with default options', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    let sut = null;
    let result = null;
    let statsFnResult = null;
    // When
    sut = new ProjextRollupCompressionPlugin();
    result = sut.getOptions();
    statsFnResult = result.stats();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupCompressionPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-compression');
    expect(sut.filter).toBe(filter);
    expect(sut.writeBundle).toBeFunction();
    expect(result).toEqual({
      folder: './dist',
      include: [],
      exclude: [],
      stats: expect.any(Function),
    });
    expect(statsFnResult).toBeUndefined();
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith([], []);
  });

  it('should be instantiated with custom options', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const stats = 'stats';
    const options = {
      folder: 'some-folder',
      include: ['include-some-files'],
      exclude: ['exclude-some-files'],
      stats: jest.fn(() => stats),
    };
    const name = 'my-compression-plugin';
    let sut = null;
    let result = null;
    let statsFnResult = null;
    // When
    sut = new ProjextRollupCompressionPlugin(options, name);
    result = sut.getOptions();
    statsFnResult = result.stats();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupCompressionPlugin);
    expect(sut.name).toBe(name);
    expect(sut.filter).toBe(filter);
    expect(result).toEqual(options);
    expect(statsFnResult).toBe(stats);
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith(
      options.include,
      options.exclude
    );
  });

  it('should find all the files on the selected folder and compress them', () => {
    // Given
    const filter = jest.fn((name) => !name.includes('exclude'));
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const stats = jest.fn();
    const options = {
      folder: 'my-dist',
      stats,
    };
    const items = {
      mainJS: 'index.js',
      subJS: 'module-index.js',
      invalid: '.something',
      exclude: 'exclude-this-file',
      alreadyCompressed: 'something.html.gz',
    };
    const subFolder = 'modules';
    const filesOnMainFolder = [
      items.mainJS,
      items.invalid,
      items.exclude,
      items.alreadyCompressed,
      subFolder,
    ];
    const filesOnSubFolder = [
      items.subJS,
    ];
    fs.readdirSync.mockImplementationOnce(() => filesOnMainFolder);
    fs.readdirSync.mockImplementationOnce(() => filesOnSubFolder);
    const isDirectory = jest.fn((filepath) => filepath === `${options.folder}/${subFolder}`);
    fs.lstatSync.mockImplementation((filepath) => ({
      isDirectory: () => isDirectory(filepath),
    }));
    const gzip = 'create-gzip';
    zlib.createGzip.mockImplementation(() => gzip);
    const readStream = {
      on: jest.fn(() => readStream),
      pipe: jest.fn(() => readStream),
    };
    fs.createReadStream.mockImplementation(() => readStream);
    const writeStream = 'write-stream';
    fs.createWriteStream.mockImplementation(() => writeStream);
    let sut = null;
    let resultPromise = null;
    // When
    sut = new ProjextRollupCompressionPlugin(options);
    resultPromise = sut.writeBundle();
    const [,, [, closeMainJS],,, [, closeSubJS]] = readStream.on.mock.calls;
    closeMainJS();
    closeSubJS();
    return resultPromise
    .then((result) => {
      // Then
      expect(result).toEqual([
        {
          original: `${options.folder}/${items.mainJS}`,
          compressed: `${options.folder}/${items.mainJS}.gz`,
        },
        {
          original: `${options.folder}/${subFolder}/${items.subJS}`,
          compressed: `${options.folder}/${subFolder}/${items.subJS}.gz`,
        },
      ]);
      expect(fs.readdirSync).toHaveBeenCalledTimes(2);
      expect(fs.readdirSync).toHaveBeenCalledWith(options.folder);
      expect(fs.readdirSync).toHaveBeenCalledWith(`${options.folder}/${subFolder}`);
      expect(fs.lstatSync).toHaveBeenCalledTimes([
        items.mainJS,
        items.exclude,
        subFolder,
        items.subJS,
      ].length);
      expect(fs.lstatSync).toHaveBeenCalledWith(`${options.folder}/${items.mainJS}`);
      expect(fs.lstatSync).toHaveBeenCalledWith(`${options.folder}/${items.exclude}`);
      expect(fs.lstatSync).toHaveBeenCalledWith(`${options.folder}/${subFolder}`);
      expect(fs.lstatSync).toHaveBeenCalledWith(`${options.folder}/${subFolder}/${items.subJS}`);
      expect(filter).toHaveBeenCalledTimes([
        items.mainJS,
        items.exclude,
        items.subJS,
      ].length);
      expect(filter).toHaveBeenCalledWith(`${options.folder}/${items.mainJS}`);
      expect(filter).toHaveBeenCalledWith(`${options.folder}/${items.exclude}`);
      expect(filter).toHaveBeenCalledWith(`${options.folder}/${subFolder}/${items.subJS}`);
      expect(fs.createReadStream).toHaveBeenCalledTimes(2);
      expect(fs.createReadStream).toHaveBeenCalledWith(`${options.folder}/${items.mainJS}`);
      expect(fs.createReadStream)
      .toHaveBeenCalledWith(`${options.folder}/${subFolder}/${items.subJS}`);
      expect(readStream.on).toHaveBeenCalledTimes([
        `${items.mainJS}: stream error`,
        `${items.mainJS}: zip error`,
        `${items.mainJS}: close`,
        `${items.subJS}: stream error`,
        `${items.subJS}: zip error`,
        `${items.subJS}: close`,
      ].length);
      expect(readStream.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(readStream.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(readStream.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(readStream.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(readStream.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(readStream.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(readStream.pipe).toHaveBeenCalledTimes([
        `${items.mainJS}: gzip`,
        `${items.mainJS}: write stream`,
        `${items.subJS}: gzip`,
        `${items.subJS}: write stream`,
      ].length);
      expect(readStream.pipe).toHaveBeenCalledWith(gzip);
      expect(readStream.pipe).toHaveBeenCalledWith(writeStream);
      expect(readStream.pipe).toHaveBeenCalledWith(gzip);
      expect(readStream.pipe).toHaveBeenCalledWith(writeStream);
      expect(stats).toHaveBeenCalledTimes(2);
      expect(stats).toHaveBeenCalledWith(expect.any(Promise));
      expect(stats).toHaveBeenCalledWith(expect.any(Promise));
      const [[statsMainJS], [statsSubJS]] = stats.mock.calls;
      return Promise.all([statsMainJS, statsSubJS]);
    })
    .then((results) => {
      const [statsMainJS, statsSubJS] = results;
      expect(statsMainJS).toEqual({
        plugin: sut.name,
        filepath: `${options.folder}/${items.mainJS}.gz`,
      });
      expect(statsSubJS).toEqual({
        plugin: sut.name,
        filepath: `${options.folder}/${subFolder}/${items.subJS}.gz`,
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should fail while trying to read a file to compress', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const options = {
      folder: 'my-dist',
    };
    const file = 'index.js';
    fs.readdirSync.mockImplementationOnce(() => [file]);
    fs.lstatSync.mockImplementation(() => ({
      isDirectory: () => false,
    }));
    const gzip = 'create-gzip';
    zlib.createGzip.mockImplementation(() => gzip);
    const readStream = {
      on: jest.fn(() => readStream),
      pipe: jest.fn(() => readStream),
    };
    fs.createReadStream.mockImplementation(() => readStream);
    const writeStream = 'write-stream';
    fs.createWriteStream.mockImplementation(() => writeStream);
    const error = new Error('unknown');
    let sut = null;
    let resultPromise = null;
    // When
    sut = new ProjextRollupCompressionPlugin(options);
    resultPromise = sut.writeBundle();
    const [[, fail]] = readStream.on.mock.calls;
    fail(error);
    return resultPromise
    .then(() => {
      expect(true).toBe(false);
    })
    .catch((result) => {
      expect(result).toBe(error);
    });
  });

  it('should fail while trying to compress a file', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const stats = jest.fn();
    const options = {
      folder: 'my-dist',
      stats,
    };
    const file = 'index.js';
    fs.readdirSync.mockImplementationOnce(() => [file]);
    fs.lstatSync.mockImplementation(() => ({
      isDirectory: () => false,
    }));
    const gzip = 'create-gzip';
    zlib.createGzip.mockImplementation(() => gzip);
    const readStream = {
      on: jest.fn(() => readStream),
      pipe: jest.fn(() => readStream),
    };
    fs.createReadStream.mockImplementation(() => readStream);
    const writeStream = 'write-stream';
    fs.createWriteStream.mockImplementation(() => writeStream);
    const error = new Error('unknown');
    let sut = null;
    let resultPromise = null;
    // When
    sut = new ProjextRollupCompressionPlugin(options);
    resultPromise = sut.writeBundle();
    const [, [, fail]] = readStream.on.mock.calls;
    fail(error);
    return resultPromise
    .then(() => {
      expect(true).toBe(false);
    })
    .catch((result) => {
      expect(result).toBe(error);
      const [[statsPromise]] = stats.mock.calls;
      return statsPromise;
    })
    .catch((result) => {
      expect(result).toBe(error);
    });
  });

  it('should provide a shorthand method to instantiate the plugin', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    let sut = null;
    // When
    sut = compression();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupCompressionPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-compression');
    expect(sut.filter).toBe(filter);
    expect(sut.writeBundle).toBeFunction();
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith([], []);
  });
});
