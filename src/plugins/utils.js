class ProjextRollupUtils {
  static formatPlaceholder(placeholder, info) {
    return placeholder
    .replace(/\[name\]/g, info.name)
    .replace(/\[ext\]/g, info.ext.substr(1));
  }

  static escapeRegex(expression) {
    return expression.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }
}

module.exports = ProjextRollupUtils;
