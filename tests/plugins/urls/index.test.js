jest.mock('fs-extra');
jest.mock('rollup-pluginutils');
jest.unmock('/src/plugins/urls');

require('jasmine-expect');
const path = require('path');
const fs = require('fs-extra');
const rollupUtils = require('rollup-pluginutils');
const ProjextRollupUtils = require('/src/plugins/utils');
const {
  ProjextRollupURLsPlugin,
  urls,
} = require('/src/plugins/urls');

describe('plugins:urls', () => {
  beforeEach(() => {
    rollupUtils.createFilter.mockReset();
    fs.ensureDirSync.mockClear();
    fs.copySync.mockClear();
    ProjextRollupUtils.formatPlaceholder.mockReset();
  });

  it('should be instantiated with default options', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const url = {
      include: ['include-some-files'],
      exclude: ['exclude-some-files'],
      output: 'output',
      url: 'url',
    };
    const options = {
      urls: [url],
    };
    let sut = null;
    let result = null;
    let statsFnResult = null;
    // When
    sut = new ProjextRollupURLsPlugin(options);
    result = sut.getOptions();
    statsFnResult = result.stats();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupURLsPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-urls');
    expect(sut.load).toBeFunction();
    expect(sut.writeBundle).toBeFunction();
    expect(result).toEqual({
      urls: [Object.assign({}, url, { filter })],
      stats: expect.any(Function),
    });
    expect(statsFnResult).toBeUndefined();
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith(url.include, url.exclude);
  });

  it('should throw an error when instantiated without URLs', () => {
    // Given/When/Then
    expect(() => new ProjextRollupURLsPlugin())
    .toThrow(/You need to define the URLs/i);
  });

  it('should replace the exports of a file that it\'s going to be copied', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    const url = {
      include: ['include-some-files'],
      exclude: ['exclude-some-files'],
      output: 'output',
      url: 'url',
    };
    const options = {
      urls: [url],
    };
    const filename = 'file.png';
    const filepath = `/some/${filename}`;
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupURLsPlugin(options);
    result = sut.load(filepath);
    // Then
    expect(ProjextRollupUtils.formatPlaceholder).toHaveBeenCalledTimes(2);
    expect(ProjextRollupUtils.formatPlaceholder).toHaveBeenCalledWith(url.output, {
      root: expect.any(String),
      dir: expect.any(String),
      base: filename,
      name: expect.any(String),
      ext: expect.any(String),
    });
    expect(result).toBe(`export default '${url.url}';`);
    expect(ProjextRollupUtils.formatPlaceholder).toHaveBeenCalledWith(url.url, {
      root: expect.any(String),
      dir: expect.any(String),
      base: filename,
      name: expect.any(String),
      ext: expect.any(String),
    });
  });

  it('shouldn\'t replace the exports of a file that doesn\'t match a filter', () => {
    // Given
    const filter = jest.fn(() => false);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    const url = {
      include: ['include-some-files'],
      exclude: ['exclude-some-files'],
      output: 'output',
      url: 'url',
    };
    const options = {
      urls: [url],
    };
    const filename = 'file.png';
    const filepath = `/some/${filename}`;
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupURLsPlugin(options);
    result = sut.load(filepath);
    // Then
    expect(result).toBeNull();
  });

  it('should copy a file', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    const url = {
      include: ['include-some-files'],
      exclude: ['exclude-some-files'],
      output: 'output',
      url: 'url',
    };
    const options = {
      urls: [url],
      stats: jest.fn(),
    };
    const filename = 'file.png';
    const directory = '/some/';
    const filepath = `${directory}${filename}`;
    let sut = null;
    // When
    sut = new ProjextRollupURLsPlugin(options);
    sut.load(filepath);
    sut.writeBundle();
    // Then
    expect(fs.ensureDirSync).toHaveBeenCalledTimes(1);
    expect(fs.ensureDirSync).toHaveBeenCalledWith(path.dirname(url.output));
    expect(fs.copySync).toHaveBeenCalledTimes(1);
    expect(fs.copySync).toHaveBeenCalledWith(filepath, url.output);
    expect(options.stats).toHaveBeenCalledTimes(1);
    expect(options.stats).toHaveBeenCalledWith(sut.name, url.output);
  });

  it('should provide a shorthand method to instantiate the plugin', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const url = {
      include: ['include-some-files'],
      exclude: ['exclude-some-files'],
      output: 'output',
      url: 'url',
    };
    const options = {
      urls: [url],
    };
    let sut = null;
    // When
    sut = urls(options);
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupURLsPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-urls');
    expect(sut.load).toBeFunction();
    expect(sut.writeBundle).toBeFunction();
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith(url.include, url.exclude);
  });
});
