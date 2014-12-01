var EventEmitter2 = require('eventemitter2').EventEmitter2;
var util = require('util');
var _ = require('lodash');

function Hook(options) {
  EventEmitter2.call(this);

  options = options || {};

  this.name = options.name || null;
  this.parent = options.parent || null;
  this.children = [];
  this.uid = Hook.uid();
}

util.inherits(Hook, EventEmitter2);

Hook.uid = function () {
  return Date.now() + Math.random().toString().replace('.', '');
};

Hook.PATH_SEPARATOR = ':';

Hook.prototype.getPath = function () {
  var parts = [];
  var hook = this;

  while (hook) {
    if (hook.name) {
      parts.unshift(hook.name);
    }

    hook = hook.parent;
  }

  return parts.join(Hook.PATH_SEPARATOR);
};

Hook.prototype.hasChildren = function () {
  return this.children.length > 0;
};

Hook.prototype.isGeneric = function () {
  return !this.name && !this.parent;
};

Hook.prototype.getRoot = function () {
  var hook = this;

  while (hook.parent) {
    hook = hook.parent;
  }

  return hook;
};

Hook.prototype.runMiddlewareStack = function (stack, data, done, abort) {
  if (!stack) {
    setImmediate(done);
    return this;
  }

  var hook = this;
  var root = hook.getRoot();
  var path = hook.getPath();

  //If there's no abort callback, just treat it as a completed middleware stack
  abort = abort || done;

  // Ignore hooks that don't have names or a parent
  if (hook.isGeneric()) {
    setImmediate(done);
    return this;
  }

  // Normalize stack as an array
  if (typeof stack === 'function') {
    stack = [stack];
  } else {
    stack = stack.slice();
  }

  // Handles each middleware recursively
  function next() {
    var middleware = stack.shift();

    if (middleware) {
      root.emit('middleware:run', data, middleware);

      if (middleware.length > 1) {
        middleware.call(hook, data, next, abort);
      } else {
        setImmediate(middleware.call(hook, data) === false ? abort : next);
      }
    } else {
      setImmediate(done);
    }
  }

  next();

  return this;
};

// Traces the edges of the hook's hierarchical graph,
// running synchronous middleware against each node and edge.
Hook.prototype.traverse = function (middleware, data, done, abort) {
  var root = this;
  var before = middleware.before || _.noop;
  var each = middleware.each || _.noop;
  var after = middleware.after || _.noop;
  var firstChild = this.getFirstChild();
  var nextSibling = this.getNextSibling();

  data = data || {};

  // Run graph hooks against the node, child edge, then sibling edge
  run(root, [before, each], function () {
    recurse(firstChild, function () {
      run(root, after, function () {
        recurse(nextSibling, done);
      });
    });
  });

  // Traverses into another hook
  function recurse(hook, callback) {
    if (hook) {
      hook.traverse(middleware, data, callback, abort);
    } else {
      callback();
    }
  }

  // Convenience method for running a hook stack
  function run(hook, stack, callback) {
    if (hook) {
      hook.runMiddlewareStack(stack, data, callback, abort);
    } else {
      callback();
    }
  }

  return this;
};

Hook.prototype.getFirstChild = function () {
  return this.children[0];
};

Hook.prototype.is = function (hook) {
  return hook.uid === this.uid;
};

Hook.prototype.getNextSibling = function () {
  return this.parent ? this.parent.children[this.getIndex() + 1] : undefined;
};

Hook.prototype.find = function (path) {
  var parts = path.split(Hook.PATH_SEPARATOR);
  var hook = this;

  _.every(parts, function (part) {
    hook = hook.getChildByName(part);
    return !!hook;
  });

  return hook;
};

Hook.prototype.getChildByName = function (name) {
  return _.find(this.children, {
    name: name
  });
};

Hook.prototype.propagateEvent = function (eventName, data, doSkipOrigin) {
  var hook = this;
  var parts = [];
  var subpath;

  data = data || {};

  while (hook) {
    if (!hook.is(this) || !doSkipOrigin) {
      subpath = parts.join(Hook.PATH_SEPARATOR);
      hook.emit(eventName, data, subpath);
    }

    parts.unshift(hook.name);
    hook = hook.parent;
  }

  return this;
};

Hook.prototype.insertWithin = function (names, index) {
  if (typeof names === 'string') {
    names = [names];
  }

  var hooks = _.map(names, function (name) {
    return new Hook({
      name: name,
      parent: this
    });
  }, this);

  [].splice.apply(this.children, [index || 0, 0].concat(hooks));

  _.each(hooks, function (hook) {
    hook.propagateEvent('subhook', {}, true);
  });

  return this;
};

Hook.prototype.add = function (paths) {
  if (typeof paths === 'string') {
    paths = [paths];
  }

  _.each(paths, function (path) {
    var parts = path.split(Hook.PATH_SEPARATOR);
    var name = parts.pop();
    var targetParentPath = parts.join(Hook.PATH_SEPARATOR);
    var targetParent = this.find(targetParentPath);

    if (targetParent) {
      targetParent.insertWithin(name);
    }
  }, this);

  return this;
};

Hook.prototype.insertBefore = function (names) {
  var index = this.getIndex();

  if (index > -1) {
    this.parent.insertWithin(index, names);
  }

  return this;
};

Hook.prototype.insertBefore = function (names) {
  var index = this.getIndex();

  if (index > -1) {
    this.parent.insertWithin(index + 1, names);
  }

  return this;
};

Hook.prototype.getSiblings = function () {
  return this.parent ? this.parent.children : null;
};

Hook.prototype.getIndex = function () {
  var index = -1;
  var siblings = this.getSiblings();

  if (siblings) {
    return _.findIndex(siblings, {
      uid: this.uid
    });
  }

  return index;
};

module.exports = Hook;
