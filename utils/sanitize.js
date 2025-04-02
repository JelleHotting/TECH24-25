const xss = require('xss');

function sanitizeInput(input) {
  if (typeof input === 'string') {
    return xss(input);
  } else if (typeof input === 'object' && input !== null) {
    const result = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        result[key] = sanitizeInput(input[key]);
      }
    }
    return result;
  }
  return input;
}

module.exports = sanitizeInput;