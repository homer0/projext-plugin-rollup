/* eslint-disable no-underscore-dangle */
/* eslint-env browser */
/**
 * Injects a style block on the document `<head />`.
 * @param {string} css The style block to inject.
 * @return {?string} If css is _"thruty"_, it will return the code, otherwise it will return
 *                   `Null`.
 * @ignore
 */
function __insertStyleFunctionName__(css) {
  // Define the variable to return.
  let result = null;
  // Validate that the code is _"thruty"_.
  if (css) {
    // Append the style tag.
    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.innerHTML = css;
    document.head.appendChild(style);
    // Set the code to be returned.
    result = css;
  }

  return result;
}

module.exports = __insertStyleFunctionName__;
