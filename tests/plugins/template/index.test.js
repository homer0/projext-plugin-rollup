jest.mock('rollup-pluginutils');
jest.mock('fs-extra');
jest.unmock('/src/plugins/template');

require('jasmine-expect');
const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const ProjextRollupUtils = require('/src/plugins/utils');
const fs = require('fs-extra');
const {
  ProjextRollupTemplatePlugin,
  template,
} = require('/src/plugins/template');

describe('plugins:template', () => {
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
      template: 'some-file.tpl',
      output: 'some-other-file.html',
      urls: [url],
    };
    let sut = null;
    let result = null;
    let statsFnResult = null;
    // When
    sut = new ProjextRollupTemplatePlugin(options);
    result = sut.getOptions();
    statsFnResult = result.stats();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupTemplatePlugin);
    expect(sut.name).toBe('projext-rollup-plugin-template');
    expect(sut.generateBundle).toBeFunction();
    expect(result).toEqual({
      template: options.template,
      output: options.output,
      scripts: [],
      scriptsAsync: true,
      scriptsOnBody: true,
      stylesheets: [],
      urls: [
        Object.assign({}, url, { filter }),
      ],
      stats: expect.any(Function),
    });
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith(url.include, url.exclude);
    expect(statsFnResult).toBeUndefined();
  });

  it('should throw an error when instantiated without a valid template file', () => {
    // Give/When/Then
    expect(() => new ProjextRollupTemplatePlugin())
    .toThrow(/You need to define the template file/i);
  });

  it('should throw an error when instantiated without URLs', () => {
    // Given
    const options = {
      template: 'some-file.tpl',
    };
    // When/Then
    expect(() => new ProjextRollupTemplatePlugin(options))
    .toThrow(/You need to define an output file/i);
  });

  it('should generate a template', () => {
    // Given
    const templateCode = 'template-code';
    fs.readFileSync.mockImplementationOnce(() => templateCode);
    const stats = jest.fn();
    const options = {
      template: 'some-file.tpl',
      output: 'dist/index.html',
      stats,
    };
    let sut = null;
    // When
    sut = new ProjextRollupTemplatePlugin(options);
    sut.generateBundle();
    // Then
    expect(fs.ensureDirSync).toHaveBeenCalledTimes(1);
    expect(fs.ensureDirSync).toHaveBeenCalledWith(path.dirname(options.output));
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(options.output, templateCode);
    expect(stats).toHaveBeenCalledTimes(1);
    expect(stats).toHaveBeenCalledWith(sut.name, options.output);
  });

  it('should generate a template with a JS file and a stylesheet', () => {
    // Given
    const templateCode = '</head></body>';
    fs.readFileSync.mockImplementationOnce(() => templateCode);
    const script = 'build.js';
    const stylesheet = 'vendor.css';
    const options = {
      template: 'some-file.tpl',
      output: 'dist/index.html',
      scripts: [script],
      stylesheets: [stylesheet],
    };
    let sut = null;
    const expectedCode = [
      `<link href="${stylesheet}" rel="stylesheet" />\n`,
      '</head>',
      `<script type="text/javascript" src="${script}" async="async"></script>\n`,
      '</body>',
    ]
    .join('');
    // When
    sut = new ProjextRollupTemplatePlugin(options);
    sut.generateBundle();
    // Then
    expect(fs.ensureDirSync).toHaveBeenCalledTimes(1);
    expect(fs.ensureDirSync).toHaveBeenCalledWith(path.dirname(options.output));
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(options.output, expectedCode);
  });

  it('should generate a template with a JS file on the head', () => {
    // Given
    const templateCode = '</head>';
    fs.readFileSync.mockImplementationOnce(() => templateCode);
    const script = 'build.js';
    const options = {
      template: 'some-file.tpl',
      output: 'dist/index.html',
      scripts: [script],
      scriptsOnBody: false,
    };
    let sut = null;
    const expectedCode = [
      `<script type="text/javascript" src="${script}" async="async"></script>\n`,
      '</head>',
    ]
    .join('');
    // When
    sut = new ProjextRollupTemplatePlugin(options);
    sut.generateBundle();
    // Then
    expect(fs.ensureDirSync).toHaveBeenCalledTimes(1);
    expect(fs.ensureDirSync).toHaveBeenCalledWith(path.dirname(options.output));
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(options.output, expectedCode);
  });

  it('should generate a template with a JS file that won\'t be loaded async', () => {
    // Given
    const templateCode = '</body>';
    fs.readFileSync.mockImplementationOnce(() => templateCode);
    const script = 'build.js';
    const options = {
      template: 'some-file.tpl',
      output: 'dist/index.html',
      scripts: [script],
      scriptsAsync: false,
    };
    let sut = null;
    const expectedCode = [
      `<script type="text/javascript" src="${script}"></script>\n`,
      '</body>',
    ]
    .join('');
    // When
    sut = new ProjextRollupTemplatePlugin(options);
    sut.generateBundle();
    // Then
    expect(fs.ensureDirSync).toHaveBeenCalledTimes(1);
    expect(fs.ensureDirSync).toHaveBeenCalledWith(path.dirname(options.output));
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(options.output, expectedCode);
  });

  it('should provide a shorthand method to instantiate the plugin', () => {
    // Given
    const extension = '.png';
    const filter = jest.fn((filepath) => (
      filepath.endsWith(extension) && !filepath.startsWith('invalid')
    ));
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const fileA = `fileA${extension}`;
    const fileB = `fileB${extension}`;
    const fileC = 'file.css';
    const fileD = `fileD${extension}`;
    const fileE = `invalid${extension}`;
    const templateCode = [
      `<%=require('${fileA}')%>`,
      `<%=require('${fileA}')%>`,
      `<%=require('${fileB}')%>`,
      `<%=require('${fileC}')%>`,
      `<%=require('${fileD}')%>`,
      `<%=require('${fileE}')%>`,
    ]
    .join('\n');
    fs.readFileSync.mockImplementationOnce(() => templateCode);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.pathExistsSync.mockImplementationOnce(() => false);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url, info) => info.base);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url, info) => info.base);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url, info) => info.base);
    ProjextRollupUtils.formatPlaceholder.mockImplementationOnce((url, info) => info.base);
    ProjextRollupUtils.escapeRegex
    .mockImplementation((exp) => exp.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
    const stats = jest.fn();
    const url = {
      include: ['include-some-files'],
      exclude: ['exclude-some-files'],
      output: 'output',
      url: 'url',
    };
    const options = {
      template: 'some-file.tpl',
      output: 'some-other-file.html',
      urls: [url],
      stats,
    };
    let sut = null;
    const expectedCode = [
      fileA,
      fileA,
      fileB,
      `<%=require('${fileC}')%>`,
      `<%=require('${fileD}')%>`,
      `<%=require('${fileE}')%>`,
    ]
    .join('\n');
    // When
    sut = template(options);
    sut.generateBundle();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupTemplatePlugin);
    expect(sut.name).toBe('projext-rollup-plugin-template');
    expect(sut.generateBundle).toBeFunction();
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith(url.include, url.exclude);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(options.output, expectedCode);
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
      template: 'some-file.tpl',
      output: 'some-other-file.html',
      urls: [url],
    };
    let sut = null;
    // When
    sut = template(options);
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupTemplatePlugin);
    expect(sut.name).toBe('projext-rollup-plugin-template');
    expect(sut.generateBundle).toBeFunction();
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith(url.include, url.exclude);
  });
});
