jest.mock('rollup-pluginutils');
jest.unmock('/src/plugins/stylesheetAssets/helper');
jest.unmock('/src/plugins/stylesheetAssets/helperFn');

require('jasmine-expect');
const rollupUtils = require('rollup-pluginutils');
const helperFn = require('/src/plugins/stylesheetAssets/helperFn');
const {
  ProjextRollupStylesheetAssetsHelperPlugin,
  stylesheetAssetsHelper,
} = require('/src/plugins/stylesheetAssets/helper');

describe('plugins:stylesheetAssets/helper', () => {
  beforeEach(() => {
    rollupUtils.createFilter.mockReset();
  });

  it('should be instantiated with default options', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupStylesheetAssetsHelperPlugin();
    result = sut.getOptions();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupStylesheetAssetsHelperPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-stylesheet-assets-helper');
    expect(sut.filter).toBe(filter);
    expect(sut.intro).toBeFunction();
    expect(sut.transform).toBeFunction();
    expect(result).toEqual({
      include: [expect.any(RegExp)],
      exclude: [],
      fnName: '___$styleHelper',
    });
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith([expect.any(RegExp)], []);
  });

  it('should be instantiated with custom options', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const options = {
      include: ['include-some-files'],
      exclude: ['exclude-some-files'],
      fnName: 'normalizeStyles',
    };
    const name = 'my-stylesheetAssetsHelper-plugin';
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupStylesheetAssetsHelperPlugin(options, name);
    result = sut.getOptions();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupStylesheetAssetsHelperPlugin);
    expect(sut.name).toBe(name);
    expect(sut.filter).toBe(filter);
    expect(result).toEqual(options);
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith(
      options.include,
      options.exclude
    );
  });

  it('should return the insert function on the `intro` method', () => {
    // Given
    const options = {
      fnName: 'myInsertFn',
    };
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupStylesheetAssetsHelperPlugin(options);
    result = sut.intro();
    // Then
    expect(result).toMatch(helperFn.toString().replace(helperFn.name, options.fnName));
  });

  it('shouldn\'t `transform` a file that doesn\'t match the filter', () => {
    // Given
    const filter = jest.fn(() => false);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const code = 'a { background: red; }';
    const filepath = 'some/file';
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupStylesheetAssetsHelperPlugin();
    result = sut.transform(code, filepath);
    // Then
    expect(result).toBeNull();
    expect(filter).toHaveBeenCalledTimes(1);
    expect(filter).toHaveBeenCalledWith(filepath);
  });

  it('should wrap a file code with the helper function', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const css = JSON.stringify('a { background: red; }');
    const code = `export default ${css};`;
    const filepath = 'some/file';
    const options = {
      fnName: 'myInsertFn',
    };
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupStylesheetAssetsHelperPlugin(options);
    result = sut.transform(code, filepath);
    // Then
    expect(result).toEqual({
      code: `export default ${options.fnName}(${css});`,
      map: {
        mappings: '',
      },
    });
    expect(filter).toHaveBeenCalledTimes(1);
    expect(filter).toHaveBeenCalledWith(filepath);
  });

  it('should provide a shorthand method to instantiate the plugin', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    let sut = null;
    // When
    sut = stylesheetAssetsHelper();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupStylesheetAssetsHelperPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-stylesheet-assets-helper');
    expect(sut.filter).toBe(filter);
    expect(sut.intro).toBeFunction();
    expect(sut.transform).toBeFunction();
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith([expect.any(RegExp)], []);
  });
});
