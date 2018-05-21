/* eslint-disable no-underscore-dangle */
/* eslint-env browser */

function __insertStyleFunctionName__(css, names) {
  let result;
  if (css && window) {
    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.innerHTML = css;
    document.head.appendChild(style);
    result = css;
  }

  return names || result;
}

module.exports = __insertStyleFunctionName__;
