# Glenlivet

Create flexible, reusable processing pipelines powered by plugins.

## Installation

`npm install glenlivet`

## Usage

### Bottles

Bottles encapsulate a hierarchical system of named hooks. When a bottle is "served", it traverses the hooks and runs any middleware attached to each.

#### Plugins

Plugins modify bottles by extending the hook hierarchy, attaching middleware, or adding methods. You add them to bottles with the .plugins() method:

```javascript
var htmlToJsonPlugin = require('glenlivet-htmltojson');
var requestPlugin = require('glenlivet-request');

var getStructure = glenlivet.createBottle({
  request: {
    uri: function (data) {
      return data.uri;
    }
  },
  htmlToJson: ['> *', {
    'id': function ($el) {
      return $el.attr('id') || null;
    },
    'tagName': function ($el) {
      return $el[0].tagName;
    },
    'className': function ($el) {
      return $el.attr('class') || null;
    },
    'children': function () {
      return this.recurse();
    }
  }]
}).plugins([
  htmlToJsonPlugin,
  requestPlugin
]);
```

Plugins are loaded if their namespace exists as a key within the bottle configuration.

### Barrels

Barrels group together bottles, and provide functionality like configuration defaults, plugin autoloading, and global middleware for member bottles.

```javascript
var glenlivet = require('glenlivet');

var prolific = glenlivet.createBarrel({
  plugins: [
    require('glenlivet-request'),
    require('glenlivet-htmltojson')
  ],
  pluginDefaults: {
    request: {
      host: 'www.prolificinteractive.com'
    }
  }
});

var getLinks = prolific.bottle('getLinks', {
  request: {
    pathname: function (data) {
      return data.page || '/';
    }
  },
  htmlToJson: ['a[href]', {
    'href': function ($a) {
      return $a.attr('href');
    },
    'text': function ($a) {
      return $a.text();
    }
  }]
}).method('json');
```

Any `plugins` will be loaded with each bottle, as long as they have the config key corresponding to the plugin's namespace. Any `pluginDefaults` will be mixed into the bottle configuration for the corresponding plugins.

### Writing Plugins

#### Middleware

Bottles come with a set of default middleware hooks:
- `preempt`: Things that might make the rest of the middleware unnecessary, for example caching.
- `setup`: Getting options prepared for `process` middleware. The main purpose is to allow other plugins to modify those options.
- `process`: For data-generating procedures, for example making an HTTP request.
- `filter`: Transforms data created by `process` middleware.
- `persist`: Meant for things like caching to save the results at the end of the pipeline.

#### glenlivet.createPlugin()

Plugins are created using the glenlivet.createPlugin() method. This method takes two arguments, the first being the configuration namespace it will use, and a callback that is called every time the plugin is used by a bottle. The first argument of that function is the configuration for that plugin, while `this` corresponds to the bottle.

You'll mostly be using the bottle's middleware() method to read and write new values on the data object, like so:

```javascript
var htmlToJson = require('htmlToJson');
var glenlivet = reuqire('glenlivet');

module.exports = glenlivet.createPlugin('htmlToJson', function (filter) {
  this.middleware('filter:htmlToJson', function (data, next, done) {
    htmlToJson
      .parse(data.html, filter)
      .done(function (json) {
        data.json = json;
        next();
      }, done);
  });
});
```

Notice the name of the middleware `filter:htmlToJson`. It will automatically create that hook within the existing `filter`. However, the hook will not be added if the immediate parent does not exist. For example, `filter:a:b:c` will not work until all ancestors are added to the hook hierarchy. This way we can create sub-plugins that depend on the existence of another plugin to work.

## Examples

[A scraped API with htmlToJson, request, and Express](examples/prolific.js)
