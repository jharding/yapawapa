// dependencies
// ------------

var _ = require('./utils')
  , promiseFactory = require('yapa').factory;

// promise decorator
// -----------------

module.exports = function define(methods) {
  var PromiseProxy
    , Promise = promiseFactory()
    , methods = _.clone(methods || {});

  Object.keys(methods).forEach(function(key) {
    var getter = methods.__lookupGetter__(key)
      , setter = methods.__lookupSetter__(key)
      , cbifiedFn;

    // read/write through for getters/setters
    if (getter || setter) {
      getter && methods.__defineGetter__(key, function() {
        return this._context[key];
      });

      setter && methods.__defineSetter__(key, function(val) {
        return this._context[key] = val;
      });
    }

    // wrap methods to work in promise framewrok
    else {
      cbifiedFn = _.cbify(methods[key]);

      methods[key] = function() {
        var args = [].slice.call(arguments, 0)
          , context = this._context
          , promise = new PromiseProxy(context);

        args.push(function(err, result) {
          if (err) { return promise.reject(err); }

          promise.fulfill(result);
        });

        return this.then(function() {
          cbifiedFn.apply(context, args);
          return promise;
        });
      };
    }
  });

  // wrap methods that return a promise to ensure those promises
  // have _context set correctly
  ['then', 'values'].forEach(function(methodName) {
    var method = Promise.prototype[methodName];

    Promise.prototype[methodName] = function() {
      var promise = method.apply(this, arguments);
      promise._context = this._context;

      return promise;
    };
  });

  _.extend(Promise.prototype, methods);

  PromiseProxy = function(context) {
      var promise = new Promise();
      promise._context = context;

      return promise;
  };

  // helps with instanceof
  PromiseProxy.prototype = Promise.prototype;

  return PromiseProxy;
};
