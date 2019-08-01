const MagicString = require('magic-string');
const ProjextRollupUtils = require('../utils');

class ProjextRollupModuleReplacePlugin {
  constructor(options, name = 'projext-rollup-plugin-module-replace') {
    if (!options || typeof options !== 'object') {
      throw new Error('You need to provide a valid options object');
    } else if (!Array.isArray(options.instructions) || !options.instructions.length) {
      throw new Error('You need to provide a valid instructions list');
    }

    this._validateInstructions(options.instructions);

    this.name = name;
    this._options = Object.assign(
      {
        sourceMap: true,
      },
      options
    );

    this.transform = this.transform.bind(this);
  }

  getOptions() {
    return this._options;
  }

  transform(code, filepath) {
    const instructions = this._options.instructions
    .filter((instruction) => filepath.match(instruction.module));
    return instructions.length ?
      this._applyInstructions(instructions, code) :
      null;
  }

  _validateInstructions(instructions) {
    const requiredProperties = ['module', 'search', 'replace'];
    instructions.forEach((instruction) => {
      if (typeof instruction !== 'object') {
        throw new Error('Instructions must be objects');
      }

      const missing = requiredProperties.find((property) => (
        typeof instruction[property] === 'undefined'
      ));

      if (missing) {
        throw new Error(`The property '${missing}' is required in all instructions`);
      }
    });
  }

  _applyInstructions(instructions, code) {
    const magicString = new MagicString(code);
    instructions.forEach((instruction) => {
      const expression = ProjextRollupUtils.cloneRegex(instruction.search, 'g');
      const replaceExpression = ProjextRollupUtils.cloneRegex(instruction.search);
      let match = expression.exec(code);
      while (match) {
        const [fullMatch] = match;
        const start = match.index;
        const end = start + fullMatch.length;
        const replacement = fullMatch.replace(replaceExpression, instruction.replace);
        magicString.overwrite(start, end, replacement);
        match = expression.exec(code);
      }
    });

    const result = {
      code: magicString.toString(),
    };

    if (this._options.sourceMap) {
      result.map = magicString.generateMap({ hires: true });
    }

    return result;
  }
}

const moduleReplace = (options, name) => new ProjextRollupModuleReplacePlugin(options, name);

module.exports = {
  ProjextRollupModuleReplacePlugin,
  moduleReplace,
};
