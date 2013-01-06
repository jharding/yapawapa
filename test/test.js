 var _ = require('underscore')
  , assert = require('assert')
  , sinon = require('sinon')
  , nextTick = process.nextTick
  , yapawapa = require('../lib/yapawapa');

describe('Yapawapa', function() {
  var errors = {
        sync: new Error('sync error')
      , async: new Error('async error')
      }
    , funcs = {
        fn1: function() {}
      , fn2: function() {}
      , sync: function() { return 'sync'; }
      , async: function(cb) { nextTick(function() { cb(null, 'async'); }); }
      , syncFail: function() { throw errors.sync; }
      , asyncFail: function(cb) { nextTick(function() { cb(errors.async); }); }
      , getContext: function() { return this; }
      , getArgs: function(arg1, arg2) { return [].slice.call(arguments, 0); }
      }
    , Promise = yapawapa.decorate(funcs);

  it('should add wrapped methods to Promise prototype', function() {
    assert.equal(typeof Promise.prototype.fn1, 'function');
    assert.equal(typeof Promise.prototype.fn2, 'function');
  });

  it('should return Promise instance when wrapped fn called', function() {
    assert((new Promise().fn1()) instanceof Promise);
  });

  it('should call fulfillment handler with correct args', function(done) {
    var promise = new Promise();

    promise
    .sync()
    .then(function(val) { assert.equal(val, 'sync'); })
    .async()
    .then(function(val) { assert.equal(val, 'async'); done(); });

    promise.fulfill();
  });

  it('should propogate error', function(done) {
    var promise = new Promise();

    promise
    .syncFail()
    .fn1()
    .then(function() { assert(false); })
    .error(function(err) { assert.equal(err.message, errors.sync.message); })
    .asyncFail()
    .fn1()
    .then(function() { assert(false); })
    .error(function(err) {
      assert.equal(err.message, errors.async.message);
      done();
    });

    promise.fulfill();
  });

  it('should call methods in correct context', function(done) {
    var mockContext = { _test_: true }
      , promise = new Promise(mockContext);

    promise
    .getContext()
    .then(function(context) {
      assert.strictEqual(context, mockContext);
    })
    .getContext()
    .then(function(context) {
      assert.strictEqual(context, mockContext);
      done();
    });

    promise.fulfill();
  });

  it('should call methods with correct arguments', function(done) {
    var promise = new Promise()
      , arg1 = 'i am arg1'
      , arg2 = 'i am arg2';

    promise
    .getArgs(arg1, arg2)
    .then(function(args) {
      assert.equal(args[0], arg1);
      assert.equal(args[1], arg2);
      done();
    });

    promise.fulfill();
  });
});
