# Glenlivet

A library for less miserable website-driven API development.

# `glenlivet.htmlToJson`

### `glenlivet.htmlToJson.parse(html, structure, callback)`

Example:

```
var html = ‘<div id=“name”>Eric</div>’;

glenlivet.htmlToJson.parse(html, {
  “name”: function ($container, $) {
    return $(‘#name’).text();
  }
}, function (err, json) {
    console.log(json.name); //“Eric”.
});
```

### `glenlivet.htmlToJson.request(options, structure, callback)`

Example:

```
glenlivet.htmlToJson.request({
  uri: ‘http://www.prolificinteractive.com'
}, [‘a’, {
  ‘href’: function ($a) {
    return $a.attr(‘href’);
  },
  ‘text’: function ($a) {
    return $a.text();
  }
}], function (err, json) {
  console.log(json);
});
```

### `glenlivet.ParseContext`

## Bottles

Bottles are configured workflows that provide a flexible, hierarchical middleware system.

### `glenlivet.Bottle(config)`

Example:

```
var getHomeHeaders = new glenlivet.Bottle({
  request: ‘http://prolificinteractive.com',
  htmlToJson: [‘h1,h2,h3,h4,h5,h6’, function ($a) {
    return $a.text();
  }]
});

getHomeHeaders
  .plugins([
    glenlivet.htmlToJson.plugin,
    glenlivet.request.plugin
  ])
  .middleware({
    ‘after filter:htmlToJson’: function (data) {
      data.json = _.map(data.json, function (text) {
        return text.toUpperCase();
      });
    }
  });
```

## Barrels

Barrels manage groups of bottles to provide higher-level features.

### `new glenlivet.Barrel(config)`
