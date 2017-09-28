'use strict';

/**
 * @namespace Pathivu
 */

/**
 * Customised records
 *
 * Factory that returns an uninitialised instance
 * (not a constructor)
 *
 * @returns {Pathivu}
 * @memberof Pathivu
 * @static
 */
function PathivuFactory({
  path,
  errorStackParser,
}) {
  /* istanbul ignore next */ {
    const missingDependencies = [];
    if (!path) { missingDependencies.push('path'); }
    if (!errorStackParser) { missingDependencies.push('errorStackParser'); }
    if (missingDependencies.length > 0) {
      throw new Error(`missing dependencies\n${JSON.stringify({
        missingDependencies,
      })}`);
    }
  }

  const props = {};

  function init({
    outputStream,
  }) {
    props.outputStream = outputStream || process.stdout;
  }

  function seq(fn) {
    const {
      fromEntity,
      toEntity,
      message,
      isResponse,
      data,
    } = (typeof fn === 'function' ? fn() : fn);
    let out;
    if (isResponse) {
      out = `"${toEntity}" --> "${fromEntity}" : "(${message})"`;
    } else {
      out = `"${fromEntity}" -> "${toEntity}" : "${message}"`;
    }
    props.outputStream.write(`${out}\n`);
  }

  function log(fn) {
    let {
      entity,
      method,
      callerEntity,
      callerMethod,
      data,
      message,
    } = (typeof fn === 'function' ? fn() : fn);

    const err = new Error();
    const parsedStack = errorStackParser.parse(err);
    let logLine = parsedStack && parsedStack[1];
    entity = entity || path.basename(logLine.fileName, '.js');
    let splitMethodName = logLine.functionName.split('.');
    method = method || splitMethodName[splitMethodName.length - 1];

    logLine = parsedStack && parsedStack[2];
    callerEntity = callerEntity || path.basename(logLine.fileName, '.js');
    splitMethodName = logLine.functionName.split('.');
    callerMethod = callerMethod || splitMethodName[splitMethodName.length - 1];

    props.outputStream.write({
      entity,
      method,
      callerEntity,
      callerMethod,
      data,
      message,
      // parsedStack,
    });
  }

  return {
    init,
    seq,
    log,
  };
}


function PathivuImplementation(dependencies) {
  return (options = {}) => {
    /* eslint-disable global-require, no-param-reassign */
    dependencies.path = dependencies.path ||
      require('path');
    dependencies.errorStackParser = dependencies.errorStackParser ||
      require('error-stack-parser');
    /* eslint-enable global-require, no-param-reassign */

    const instance = PathivuFactory(dependencies);
    instance.init(options);
    return instance;
  };
}

module.exports = PathivuFactory;
module.exports.factory = PathivuFactory;
module.exports.default = PathivuFactory;
module.exports.implementation = PathivuImplementation;
module.exports.impl = PathivuImplementation;
