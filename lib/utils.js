var _ = module.exports = require('underscore');

// modified methods
_.clone = clone;
_.extend = extend;

// added methods
_.cbify = cbify;

// roll custom extend since underscore's doesn't play nice
// with getters and setters
function extend(obj) {
  var slice = Array.prototype.slice;

  slice.call(arguments, 1).forEach(function(source) {
    var getter
      , setter;

    for (var key in source) {
      getter = source.__lookupGetter__(key);
      setter = source.__lookupSetter__(key);

      if (getter || setter) {
        getter && obj.__defineGetter__(key, getter);
        setter && obj.__defineSetter__(key, setter);
      }

      else {
        obj[key] = source[key];
      }
    }
  });

  return obj;
}

function clone(obj) {
  if (!_.isObject(obj)) { return obj; }

  return _.isArray(obj) ? obj.slice() : extend({}, obj);
}

// https://gist.github.com/2385351
function cbify(fn) {
  return function callbackable() {
    var length = arguments.length
      , done = arguments[length - 1];

    if (length > fn.length && _.isFunction(done)) {
      try { done(null, fn.apply(this, arguments)); } catch(e) { done(e); }
    }

    else { fn.apply(this, arguments); }
  };
}
