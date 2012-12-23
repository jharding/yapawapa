// dependencies
// ------------

var _ = require('./utils')
  , promiseFactory = require('yapa').factory;

// promise decorator
// -----------------

module.exports = function define(methods) {
  var Promise = promiseFactory()
    , methods = _.clone(methods || {});

  Object.keys(methods).forEach(function(key) {
    var getter = methods.__lookupGetter__(key)
      , setter = methods.__lookupSetter__(key)
      , cbifiedFn;

    // read/write through for getters/setters
    if (getter || setter) {
      getter && methods.__defineGetter__(key, function() {
        return this.$.context[key];
      });

      setter && methods.__defineSetter__(key, function(val) {
        return this.$.context[key] = val;
      });
    }

    // wrap methods to work in promise framewrok
    else {
      cbifiedFn = _.cbify(methods[key]);

      methods[key] = function() {
        var args = [].slice.call(arguments, 0)
          , context = this.$.context
          , promise = new Promise({ context: context });

        args.push(function(err, result) {
          if (err) { return promise.reject(err); }

          promise.resolve(result);
        });

        return this.then(function() {
          cbifiedFn.apply(context, args);
          return promise;
        });
      };
    }
  });

  _.extend(Promise.prototype, methods);

  return Promise;
};
