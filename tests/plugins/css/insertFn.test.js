/**
 * @jest-environment jsdom
 */

jest.unmock('/src/plugins/css/insertFn');

const insert = require('/src/plugins/css/insertFn');

describe('plugins:css/insert', () => {
  beforeEach(() => {
    global.document.head.innerHTML = '';
  });

  it('should insert styles on the head tag', () => {
    // Given
    const code = 'a { background: red; }';
    let result = null;
    let inserted = null;
    // When
    result = insert(code);
    [inserted] = global.document.head.children;
    // Then
    expect(result).toBe(code);
    expect(global.document.head.children.length).toBe(1);
    expect(inserted.innerHTML).toBe(code);
  });

  it('shouldn\'t insert an empty style', () => {
    // Given
    const code = '';
    let result = null;
    // When
    result = insert(code);
    // Then
    expect(result).toBeNull();
    expect(global.document.head.children.length).toBe(0);
  });
});
