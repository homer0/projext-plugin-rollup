const { Logger } = require('wootils/node/logger');

class ProjextRollupUtils {
  static formatPlaceholder(placeholder, info) {
    return placeholder
    .replace(/\[name\]/g, info.name)
    .replace(/\[ext\]/g, info.ext.substr(1));
  }

  static escapeRegex(expression) {
    return expression.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

  static createLogger(plugin, logger) {
    let result;
    if (!logger) {
      result = new Logger();
    } else if (logger instanceof Logger) {
      result = logger;
    } else {
      const unsupportedMethod = ['success', 'info', 'warning', 'error']
      .find((method) => typeof logger[method] !== 'function');

      if (unsupportedMethod) {
        throw new Error(`${plugin}: The logger must be an instance of wootils's Logger class`);
      } else {
        result = logger;
      }
    }

    return result;
  }
}

module.exports = ProjextRollupUtils;
