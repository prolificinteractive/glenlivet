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

When plugins are loaded if their namespace exists as a key within the bottle configuration.

### Barrels

### Writing Plugins

```javascript
var htmlToJson = require('htmlToJson');
var glenlivet = reuqire('glenlivet');

module.exports = glenlivet.createPlugin('htmlToJson', function (filter) {
  this.middleware('filter:htmlToJson', function (data, next, error) {
    htmlToJson
      .parse(data.html, filter)
      .done(function (json) {
        data.json = json;
        next();
      }, error);
  });
});
```

#### Attaching Middleware

#### Adding Hooks

## Examples

[A scraped API with htmlToJson, request, and Express](examples/prolific.js)
