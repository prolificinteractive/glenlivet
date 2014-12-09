var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Q = require('Q');
var _ = require('lodash');

function Hook(options) {
  EventEmitter.call(this);

  options = options || {};

  this.name = options.name || null;
  this.parent = options.parent || null;
  this.children = [];
  this.uid = Hook.uid();
}

util.inherits(Hook, EventEmitter);

Hook.uid = (function () {
  var counter = 1;
  return function () {
    return counter++;
  };
}());

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

Hook.prototype.remove = function () {
  if (this.parent) {
    this.parent.children.splice(this.getIndex(), 1);
    this.parent = null;
  }

  return this;
};

Hook.prototype.getRoot = function () {
  var hook = this;

  while (hook.parent) {
    hook = hook.parent;
  }

  return hook;
};

// Traces the edges of the hook's hierarchical graph,
// running synchronous middleware against each node and edge.
Hook.prototype.traverse = function (callbacks, done) {
  var hook = this;
  var child = this.getFirstChild();
  var sibling = this.getNextSibling();
  var promise;

  function runCallback (name) {
    var callback = callbacks[name];

    if (hook.name && callback) {
      return Q(callback.call(hook, hook));
    } else {
      return Q();
    }
  }

  promise = runCallback('before')
    .then(function () {
      return runCallback('each');
    })
    .then(function () {
      if (child) {
        return child.traverse(callbacks);
      }
    })
    .then(function () {
      return runCallback('after');
    })
    .then(function () {
      if (sibling) {
        return sibling.traverse(callbacks);
      }
    });

  if (done) {
    promise.done(function () {
      done(null);
    }, done);
  }

  return promise;
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
      hook.emit(eventName + ':' + subpath, data);
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

  var hooks = [];

  _.each(names, function (name) {
    if (this.getChildByName(name)) {
      return;
    }

    var hook = new Hook({
      name: name,
      parent: this
    });

    hooks.push(hook);
  }, this);

  if (typeof index === 'number') {
    [].splice.apply(this.children, [index, 0].concat(hooks));
  } else {
    this.children = this.children.concat(hooks);
  }

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
    var targetParent;

    if (parts.length > 0) {
      targetParent = this.find(targetParentPath);
    } else {
      targetParent = this;
    }

    if (!targetParent) {
      this.once('subhook:' + targetParentPath, function () {
        this.find(targetParentPath).insertWithin(name);
      });
    } else {
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
