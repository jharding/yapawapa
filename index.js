// dependencies
// ------------

var _ = require('underscore')
  , promiseFactory = require('yapa').factory;

// promise decorator
// -----------------

module.exports = function define(methods) {
  var Promise = promiseFactory();

  // wrap methods to work in promise framewrok
  methods = _(methods || {}).reduce(function(memo, val, key) {
    var cbifiedFn = cbify(val);

    memo[key] = function() {
      var that = this
        , args = [].slice.call(arguments, 0)
        , promise = new Promise({ context: this.$.context });

      args.push(function(err, result) {
        if (err) { promise.reject(err); return; }

        promise.resolve(result);
      });

      return this.then(function() {
        cbifiedFn.apply(that.$.context, args);
        return promise;
      });
    };

    return memo;
  }, {});

  _.extend(Promise.prototype, methods);

  return Promise;
};

// helper functions
// ----------------

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
