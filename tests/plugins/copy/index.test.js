jest.mock('fs-extra');
jest.unmock('/src/plugins/copy');

require('jasmine-expect');
const fs = require('fs-extra');
const {
  ProjextRollupCopyPlugin,
  copy,
} = require('/src/plugins/copy');

describe('plugins:copy', () => {
  beforeEach(() => {
    fs.pathExistsSync.mockReset();
    fs.ensureDirSync.mockReset();
    fs.writeFile.mockReset();
    fs.readFile.mockReset();
    fs.writeFile.mockReset();
    fs.copy.mockReset();
  });

  it('should be instantiated', () => {
    // Given
    const files = [{
      from: 'from',
      to: 'to',
    }];
    let sut = null;
    let result = null;
    let statsFnResult = null;
    // When
    sut = new ProjextRollupCopyPlugin({ files });
    result = sut.getOptions();
    statsFnResult = result.stats();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupCopyPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-copy');
    expect(sut.generateBundle).toBeFunction();
    expect(result).toEqual({
      files,
      stats: expect.any(Function),
    });
    expect(statsFnResult).toBeUndefined();
  });

  it('should throw an error when instantiated with a file with invalid properties', () => {
    // Given
    const files = [{
      from: 'from',
    }];
    // When/Then
    expect(() => new ProjextRollupCopyPlugin({ files }))
    .toThrow(/All files must have 'from' and 'to' properties/i);
  });

  it('should copy a list of files', () => {
    // Given
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.copy.mockImplementationOnce(() => Promise.resolve());
    fs.copy.mockImplementationOnce(() => Promise.resolve());
    const outputDirectory = 'some/public/path/';
    const fileOne = {
      from: 'manifest.json',
      to: `${outputDirectory}/manifest.json`,
    };
    const fileTwo = {
      from: '404.html',
      to: `${outputDirectory}/404.html`,
    };
    const files = [fileOne, fileTwo];
    const stats = jest.fn();
    let sut = null;
    let statsFileOne = null;
    let statsFileTwo = null;
    // When
    sut = new ProjextRollupCopyPlugin({ files, stats });
    return sut.generateBundle()
    .then((result) => {
      expect(result).toEqual([fileOne.to, fileTwo.to]);
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(2);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(fileOne.from);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(fileTwo.from);
      expect(fs.ensureDirSync).toHaveBeenCalledTimes(1);
      expect(fs.ensureDirSync).toHaveBeenCalledWith(outputDirectory);
      expect(fs.copy).toHaveBeenCalledTimes(2);
      expect(fs.copy).toHaveBeenCalledWith(fileOne.from, fileOne.to);
      expect(fs.copy).toHaveBeenCalledWith(fileTwo.from, fileTwo.to);
      expect(stats).toHaveBeenCalledTimes(2);
      expect(stats).toHaveBeenCalledWith(expect.any(Promise));
      expect(stats).toHaveBeenCalledWith(expect.any(Promise));
      [[statsFileOne], [statsFileTwo]] = stats.mock.calls;
      return Promise.all([statsFileOne, statsFileTwo]);
    })
    .then((results) => {
      [statsFileOne, statsFileTwo] = results;
      expect(statsFileOne).toEqual({
        plugin: sut.name,
        filepath: fileOne.to,
      });
      expect(statsFileTwo).toEqual({
        plugin: sut.name,
        filepath: fileTwo.to,
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should copy and transform a file', () => {
    // Given
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const contents = 'original content';
    fs.readFile.mockImplementationOnce(() => Promise.resolve(contents));
    fs.writeFile.mockImplementationOnce(() => Promise.resolve());
    const toAdd = '...updated!';
    const outputDirectory = 'some/public/path/';
    const file = {
      from: 'manifest.json',
      to: `${outputDirectory}/manifest.json`,
      transform: jest.fn((fileContents) => `${fileContents}${toAdd}`),
    };
    const files = [file];
    const stats = jest.fn();
    let sut = null;
    let statsFile = null;
    const expectedContents = `${contents}${toAdd}`;
    // When
    sut = new ProjextRollupCopyPlugin({ files, stats });
    return sut.generateBundle()
    .then((result) => {
      expect(result).toEqual([file.to]);
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(file.from);
      expect(fs.ensureDirSync).toHaveBeenCalledTimes(1);
      expect(fs.ensureDirSync).toHaveBeenCalledWith(outputDirectory);
      expect(fs.copy).toHaveBeenCalledTimes(0);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(file.from);
      expect(file.transform).toHaveBeenCalledTimes(1);
      expect(file.transform).toHaveBeenCalledWith(contents);
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      expect(fs.writeFile).toHaveBeenCalledWith(file.to, expectedContents);
      expect(stats).toHaveBeenCalledTimes(1);
      expect(stats).toHaveBeenCalledWith(expect.any(Promise));
      [[statsFile]] = stats.mock.calls;
      return statsFile;
    })
    .then((result) => {
      expect(result).toEqual({
        plugin: sut.name,
        filepath: file.to,
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should provide a shorthand method to instantiate the plugin', () => {
    // Given
    const files = [{
      from: 'from',
      to: 'to',
    }];
    let sut = null;
    // When
    sut = copy({ files });
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupCopyPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-copy');
    expect(sut.generateBundle).toBeFunction();
  });
});
