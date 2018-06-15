jest.mock('rollup-pluginutils');
jest.mock('fs-extra');
jest.unmock('/src/plugins/stylesheetAssets');

require('jasmine-expect');
const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const ProjextRollupUtils = require('/src/plugins/utils');
const fs = require('fs-extra');
const {
  ProjextRollupStylesheetAssetsPlugin,
  stylesheetAssets,
} = require('/src/plugins/stylesheetAssets');

describe('plugins:stylesheetAssets', () => {
  const createSourceMap = (settings) => {
    const code = Buffer.from(JSON.stringify(settings)).toString('base64');
    return `/*# sourceMappingURL=data:application/json;base64,${code} */`;
  };

  beforeEach(() => {
    ProjextRollupUtils.formatPlaceholder.mockReset();
    ProjextRollupUtils.escapeRegex.mockReset();
    rollupUtils.createFilter.mockReset();
    fs.pathExistsSync.mockReset();
    fs.readFileSync.mockReset();
    fs.writeFileSync.mockReset();
    fs.ensureDirSync.mockReset();
    fs.copySync.mockReset();
  });

  it('should have a static method to access the helper plugin', () => {
    // Given/When/Then
    expect(ProjextRollupStylesheetAssetsPlugin.helper).toBeFunction();
  });

  it('should be instantiated', () => {
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
      stylesheet: 'some-file.css',
      urls: [url],
    };
    let sut = null;
    let result = null;
    let statsFnResult = null;
    // When
    sut = new ProjextRollupStylesheetAssetsPlugin(options);
    result = sut.getOptions();
    statsFnResult = result.stats();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupStylesheetAssetsPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-stylesheet-assets');
    expect(sut.onwrite).toBeFunction();
    expect(result).toEqual({
      stylesheet: options.stylesheet,
      insertFnNames: [
        '___$insertCSSBlocks',
        '___$insertStyle',
        '___$styleHelper',
      ],
      urls: [
        Object.assign({}, url, { filter }),
      ],
      stats: expect.any(Function),
    });
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith(url.include, url.exclude);
    expect(statsFnResult).toBeUndefined();
  });

  it('should throw an error when instantiated without a valid filepath', () => {
    // Given
    const options = {
      urls: [{
        include: ['include-some-files'],
        exclude: ['exclude-some-files'],
        output: 'output',
        url: 'url',
      }],
    };
    // When/Then
    expect(() => new ProjextRollupStylesheetAssetsPlugin(options))
    .toThrow(/You need to define the stylesheet path/i);
  });

  it('should throw an error when instantiated without URLs', () => {
    // Given
    const options = {
      stylesheet: 'some-file.css',
    };
    // When/Then
    expect(() => new ProjextRollupStylesheetAssetsPlugin(options))
    .toThrow(/You need to define the URLs/i);
  });

  it('shouldn\'t do anything if the stylesheet file doesn\'t exist', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    fs.pathExistsSync.mockImplementationOnce(() => false);
    const url = {
      include: ['include-some-files'],
      exclude: ['exclude-some-files'],
      output: 'output',
      url: 'url',
    };
    const options = {
      stylesheet: 'some-file.css',
      urls: [url],
    };
    let sut = null;
    // When
    sut = new ProjextRollupStylesheetAssetsPlugin(options);
    sut.onwrite();
    // Then
    expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
    expect(fs.pathExistsSync).toHaveBeenCalledWith(options.stylesheet);
    expect(fs.readFileSync).toHaveBeenCalledTimes(0);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(0);
  });

  it('should process a stylesheet', () => {
    // Given
    const extension = '.png';
    const assetOne = `file${extension}`;
    const assetTwo = `fileB${extension}`;
    const assetThree = 'fileC.html';
    const assetFour = `fileD${extension}`;
    const directory = './some/directory';
    const sharedSCSSFile = 'shared.scss';
    const firstSCSSFile = `${directory}/first-file.scss`;
    const firstCodePart = [
      `a { background: url('./${assetOne}'); }`,
      `a.blue { background: url('./${assetTwo}?v=1.0'); }`,
      `a.light-blue { background: url('./${assetTwo}?v=1.0'); }`,
      `a.green { background: url('./${assetThree}'); }`,
    ]
    .join('\n');
    const firstCodeMap = {
      sources: [firstSCSSFile, sharedSCSSFile],
    };
    const firstCodeSourceMap = createSourceMap(firstCodeMap);
    const secondSCSSFile = `${directory}/first-file.scss`;
    const secondCodePart = 'a { background-color: blue; }';
    const secondCodeMap = {
      sources: [secondSCSSFile, sharedSCSSFile],
    };
    const secondCodeSourceMap = createSourceMap(secondCodeMap);
    const fileContents = [
      `${firstCodePart}`,
      `a.red { background: url('./${assetFour}'); }\n`,
      firstCodeSourceMap,
      '',
      `${secondCodePart}\n`,
      secondCodeSourceMap,
    ]
    .join('\n');
    const filter = jest.fn((filepath) => filepath.endsWith(extension));
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    ProjextRollupUtils.escapeRegex
    .mockImplementation((exp) => exp.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => false);
    fs.readFileSync.mockImplementationOnce(() => fileContents);
    fs.readFileSync.mockImplementationOnce(() => firstCodePart);
    fs.readFileSync.mockImplementationOnce(() => secondCodePart);
    const url = {
      include: ['include-some-files'],
      exclude: ['exclude-some-files'],
      output: 'output',
      url: 'url',
    };
    const options = {
      stylesheet: 'some-file.css',
      urls: [url],
      stats: jest.fn(),
    };
    let sut = null;
    const expectedCode = [
      'a { background: url(\'url\'); }',
      'a.blue { background: url(\'url?v=1.0\'); }',
      'a.light-blue { background: url(\'url?v=1.0\'); }',
      `a.green { background: url('./${assetThree}'); }`,
      `a.red { background: url('./${assetFour}'); }\n`,
      secondCodePart,
    ]
    .join('\n');
    // When
    sut = new ProjextRollupStylesheetAssetsPlugin(options);
    sut.onwrite();
    // Then
    expect(fs.pathExistsSync).toHaveBeenCalledTimes(4);
    expect(fs.pathExistsSync).toHaveBeenCalledWith(options.stylesheet);
    expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(directory, assetOne));
    expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(directory, assetTwo));
    expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(directory, assetThree));
    expect(fs.readFileSync).toHaveBeenCalledTimes(3);
    expect(fs.readFileSync).toHaveBeenCalledWith(options.stylesheet, 'utf-8');
    expect(fs.readFileSync).toHaveBeenCalledWith(firstSCSSFile, 'utf-8');
    expect(fs.readFileSync).toHaveBeenCalledWith(secondSCSSFile, 'utf-8');
    expect(fs.readFileSync).toHaveBeenCalledWith(sharedSCSSFile, 'utf-8');
    expect(ProjextRollupUtils.formatPlaceholder).toHaveBeenCalledTimes(4);
    expect(ProjextRollupUtils.formatPlaceholder).toHaveBeenCalledWith(
      url.output,
      {
        root: expect.any(String),
        dir: expect.any(String),
        base: assetOne,
        name: expect.any(String),
        ext: expect.any(String),
      }
    );
    expect(ProjextRollupUtils.formatPlaceholder).toHaveBeenCalledWith(
      url.url,
      {
        root: expect.any(String),
        dir: expect.any(String),
        base: assetOne,
        name: expect.any(String),
        ext: expect.any(String),
      }
    );
    expect(ProjextRollupUtils.formatPlaceholder).toHaveBeenCalledWith(
      url.output,
      {
        root: expect.any(String),
        dir: expect.any(String),
        base: assetTwo,
        name: expect.any(String),
        ext: expect.any(String),
      }
    );
    expect(ProjextRollupUtils.formatPlaceholder).toHaveBeenCalledWith(
      url.url,
      {
        root: expect.any(String),
        dir: expect.any(String),
        base: assetTwo,
        name: expect.any(String),
        ext: expect.any(String),
      }
    );
    expect(fs.ensureDirSync).toHaveBeenCalledTimes(1);
    expect(fs.ensureDirSync).toHaveBeenCalledWith(path.dirname(url.output));
    expect(fs.copySync).toHaveBeenCalledTimes(2);
    expect(fs.copySync).toHaveBeenCalledWith(
      path.resolve(path.join(directory, assetOne)),
      url.output
    );
    expect(fs.copySync).toHaveBeenCalledWith(
      path.resolve(path.join(directory, assetTwo)),
      url.output
    );
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      options.stylesheet,
      expectedCode
    );
  });

  it('should process a JS file', () => {
    // Given
    const insertFn = '__$insertStyle';
    const extension = '.png';
    const assetOne = `file${extension}`;
    const assetTwo = `fileB${extension}`;
    const assetThree = 'fileC.html';
    const assetFour = `fileD${extension}`;
    const directory = './some/directory';
    const sharedSCSSFile = 'shared.scss';
    const firstSCSSFile = `${directory}/first-file.scss`;
    const firstCodePart = [
      `a { background: url('./${assetOne}'); }`,
      `a.blue { background: url('./${assetTwo}?v=1.0'); }`,
      `a.light-blue { background: url('./${assetTwo}?v=1.0'); }`,
      `a.green { background: url('./${assetThree}'); }`,
    ]
    .join('\n');
    const firstCodeMap = {
      sources: [firstSCSSFile, sharedSCSSFile],
    };
    const firstCodeSourceMap = createSourceMap(firstCodeMap);
    const secondSCSSFile = `${directory}/first-file.scss`;
    const secondCodePart = 'a { background-color: blue; }';
    const secondCodeMap = {
      sources: [secondSCSSFile, sharedSCSSFile],
    };
    const secondCodeSourceMap = createSourceMap(secondCodeMap);
    const firstBlockCode = JSON.stringify([
      `${firstCodePart}`,
      `a.red { background: url('./${assetFour}'); }\n`,
      firstCodeSourceMap,
    ].join('\n'));
    const secondBlockCode = JSON.stringify([
      `${secondCodePart}\n`,
      secondCodeSourceMap,
    ].join('\n'));
    const fileContents = [
      `${insertFn}(${firstBlockCode});\n`,
      `${insertFn}(${secondBlockCode});`,
    ]
    .join('\n');
    const filter = jest.fn((filepath) => filepath.endsWith(extension));
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url) => url);
    ProjextRollupUtils.escapeRegex
    .mockImplementation((exp) => exp.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => false);
    fs.readFileSync.mockImplementationOnce(() => fileContents);
    fs.readFileSync.mockImplementationOnce(() => firstCodePart);
    fs.readFileSync.mockImplementationOnce(() => secondCodePart);
    const url = {
      include: ['include-some-files'],
      exclude: ['exclude-some-files'],
      output: 'output',
      url: 'url',
    };
    const options = {
      stylesheet: 'some-file.js',
      insertFnNames: [insertFn],
      urls: [url],
      stats: jest.fn(),
    };
    let sut = null;
    const expectedFirstBlockCode = JSON.stringify([
      'a { background: url(\'url\'); }',
      'a.blue { background: url(\'url?v=1.0\'); }',
      'a.light-blue { background: url(\'url?v=1.0\'); }',
      `a.green { background: url('./${assetThree}'); }`,
      `a.red { background: url('./${assetFour}'); }`,
    ].join('\n'));
    const expectedSecondBlockCode = JSON.stringify(secondCodePart);
    const expectedCode = [
      `${insertFn}(${expectedFirstBlockCode});`,
      `${insertFn}(${expectedSecondBlockCode});`,
    ].join('\n\n');
    // When
    sut = new ProjextRollupStylesheetAssetsPlugin(options);
    sut.onwrite();
    // Then
    expect(fs.pathExistsSync).toHaveBeenCalledTimes(4);
    expect(fs.pathExistsSync).toHaveBeenCalledWith(options.stylesheet);
    expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(directory, assetOne));
    expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(directory, assetTwo));
    expect(fs.pathExistsSync).toHaveBeenCalledWith(path.join(directory, assetThree));
    expect(fs.readFileSync).toHaveBeenCalledTimes(3);
    expect(fs.readFileSync).toHaveBeenCalledWith(options.stylesheet, 'utf-8');
    expect(fs.readFileSync).toHaveBeenCalledWith(firstSCSSFile, 'utf-8');
    expect(fs.readFileSync).toHaveBeenCalledWith(secondSCSSFile, 'utf-8');
    expect(fs.readFileSync).toHaveBeenCalledWith(sharedSCSSFile, 'utf-8');
    expect(ProjextRollupUtils.formatPlaceholder).toHaveBeenCalledTimes(4);
    expect(ProjextRollupUtils.formatPlaceholder).toHaveBeenCalledWith(
      url.output,
      {
        root: expect.any(String),
        dir: expect.any(String),
        base: assetOne,
        name: expect.any(String),
        ext: expect.any(String),
      }
    );
    expect(ProjextRollupUtils.formatPlaceholder).toHaveBeenCalledWith(
      url.url,
      {
        root: expect.any(String),
        dir: expect.any(String),
        base: assetOne,
        name: expect.any(String),
        ext: expect.any(String),
      }
    );
    expect(ProjextRollupUtils.formatPlaceholder).toHaveBeenCalledWith(
      url.output,
      {
        root: expect.any(String),
        dir: expect.any(String),
        base: assetTwo,
        name: expect.any(String),
        ext: expect.any(String),
      }
    );
    expect(ProjextRollupUtils.formatPlaceholder).toHaveBeenCalledWith(
      url.url,
      {
        root: expect.any(String),
        dir: expect.any(String),
        base: assetTwo,
        name: expect.any(String),
        ext: expect.any(String),
      }
    );
    expect(fs.ensureDirSync).toHaveBeenCalledTimes(1);
    expect(fs.ensureDirSync).toHaveBeenCalledWith(path.dirname(url.output));
    expect(fs.copySync).toHaveBeenCalledTimes(2);
    expect(fs.copySync).toHaveBeenCalledWith(
      path.resolve(path.join(directory, assetOne)),
      url.output
    );
    expect(fs.copySync).toHaveBeenCalledWith(
      path.resolve(path.join(directory, assetTwo)),
      url.output
    );
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      options.stylesheet,
      expectedCode
    );
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
      stylesheet: 'some-file.css',
      urls: [url],
    };
    let sut = null;
    // When
    sut = stylesheetAssets(options);
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupStylesheetAssetsPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-stylesheet-assets');
    expect(sut.onwrite).toBeFunction();
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith(url.include, url.exclude);
  });
});
