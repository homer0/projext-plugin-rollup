/* eslint-disable no-underscore-dangle */
/* eslint-env browser */

function __insertStyleFunctionName__(css) {
  let result;
  if (css && window) {
    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.innerHTML = css;
    document.head.appendChild(style);
    result = css;
  }

  return result;
}

module.exports = __insertStyleFunctionName__;
