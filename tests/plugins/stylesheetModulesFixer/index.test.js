jest.mock('rollup-pluginutils');
jest.unmock('/src/plugins/stylesheetModulesFixer');

require('jasmine-expect');
const rollupUtils = require('rollup-pluginutils');
const {
  ProjextRollupStylesheetModulesFixerPlugin,
  stylesheetModulesFixer,
} = require('/src/plugins/stylesheetModulesFixer');

describe('plugins:stylesheetModulesFixer', () => {
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
    sut = new ProjextRollupStylesheetModulesFixerPlugin();
    result = sut.getOptions();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupStylesheetModulesFixerPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-stylesheet-modules-fixer');
    expect(sut.filter).toBe(filter);
    expect(sut.transform).toBeFunction();
    expect(result).toEqual({
      include: [],
      exclude: [],
      modulesExportName: 'locals',
    });
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith([], []);
  });

  it('should be instantiated with custom options', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const options = {
      include: ['include-some-files'],
      exclude: ['exclude-some-files'],
      modulesExportName: 'names',
    };
    const name = 'my-stylesheet-modules-fixer-plugin';
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupStylesheetModulesFixerPlugin(options, name);
    result = sut.getOptions();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupStylesheetModulesFixerPlugin);
    expect(sut.name).toBe(name);
    expect(sut.filter).toBe(filter);
    expect(sut.transform).toBeFunction();
    expect(result).toEqual(options);
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith(
      options.include,
      options.exclude
    );
  });

  it('shouldn\'t transform a file that doesn\'t match the filter', () => {
    // Given
    const filter = jest.fn(() => false);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const code = '';
    const filepath = 'some-file.css';
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupStylesheetModulesFixerPlugin();
    result = sut.transform(code, filepath);
    // Then
    expect(result).toBeNull();
    expect(filter).toHaveBeenCalledTimes(1);
    expect(filter).toHaveBeenCalledWith(filepath);
  });

  it('should transform a file that injects styles and exports names', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const options = {
      modulesExportName: 'locals',
    };
    const fileCode = 'some-code-before-the-exports';
    const injectCode = 'injectSomeCode(\'some-code\')';
    const locals = JSON.stringify({
      moduleName: 'value',
    });
    const code = [
      fileCode,
      `export default ${injectCode};`,
      `export const ${options.modulesExportName} = ${locals};`,
    ]
    .join('\n');
    const filepath = 'some-file.css';
    let sut = null;
    let result = null;
    const expectedCode = [
      `${fileCode}\n`,
      'export default (() => {',
      `  ${injectCode};`,
      `  return ${locals};`,
      '})();',
    ]
    .join('\n');
    // When
    sut = new ProjextRollupStylesheetModulesFixerPlugin(options);
    result = sut.transform(code, filepath);
    // Then
    expect(result).toEqual({
      code: expectedCode,
      map: {
        mappings: '',
      },
    });
  });

  it('shouldn\'t transform a file that exports only code', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const fileCode = 'some-code-before-the-exports';
    const cssCode = '\'a { background: red; }\'';
    const code = [
      fileCode,
      `export default ${cssCode};;`,
    ]
    .join('\n');
    const filepath = 'some-file.css';
    let sut = null;
    let result = null;
    const expectedCode = [
      `${fileCode}\n`,
      `export default ${cssCode};`,
    ]
    .join('\n');
    // When
    sut = new ProjextRollupStylesheetModulesFixerPlugin();
    result = sut.transform(code, filepath);
    // Then
    expect(result).toEqual({
      code: expectedCode,
      map: {
        mappings: '',
      },
    });
  });

  it('shouldn\'t transform a file without a default export', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const fileCode = 'some-code-before-the-exports';
    const exportName = 'varName';
    const cssCode = '\'a { background: red; }\'';
    const code = [
      fileCode,
      `export const ${exportName} = ${cssCode};`,
    ]
    .join('\n');
    const filepath = 'some-file.css';
    let sut = null;
    let result = null;
    const expectedCode = [
      `${fileCode}\n`,
      `export const ${exportName} = ${cssCode};`,
    ]
    .join('\n');
    // When
    sut = new ProjextRollupStylesheetModulesFixerPlugin();
    result = sut.transform(code, filepath);
    // Then
    expect(result).toEqual({
      code: expectedCode,
      map: {
        mappings: '',
      },
    });
  });

  it('shouldn\'t transform a file which content was bundled', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const options = {
      modulesExportName: 'locals',
    };
    const fileCode = 'some-code-before-the-exports';
    const empty = '\'\'';
    const locals = JSON.stringify({
      moduleName: 'value',
    });
    const code = [
      fileCode,
      `export default ${empty};`,
      `export const ${options.modulesExportName} = ${locals};`,
    ]
    .join('\n');
    const filepath = 'some-file.css';
    let sut = null;
    let result = null;
    const expectedCode = [
      `${fileCode}\n`,
      `export default ${locals};`,
    ]
    .join('\n');
    // When
    sut = new ProjextRollupStylesheetModulesFixerPlugin(options);
    result = sut.transform(code, filepath);
    // Then
    expect(result).toEqual({
      code: expectedCode,
      map: {
        mappings: '',
      },
    });
  });

  it('should provide a shorthand method to instantiate the plugin', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    let sut = null;
    // When
    sut = stylesheetModulesFixer();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupStylesheetModulesFixerPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-stylesheet-modules-fixer');
    expect(sut.filter).toBe(filter);
    expect(sut.transform).toBeFunction();
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith([], []);
  });
});
