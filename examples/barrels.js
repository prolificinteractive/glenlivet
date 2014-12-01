var prolific = new glenlivet.Barrel({
  plugins: [
    glenlivet.caching.plugin,
    glenlivet.sessions.plugin,
    glenlivet.pagination.plugin,
    glenlivet.htmlToJson.plugin,
    glenlivet.request.plugin,
    glenlivet.router.plugin,
    glenlivet.router.plugin.extractor('pagination', {
      offset: 'query.offset',
      limit: 'query.limit'
    })
  ],
  pluginDefaults: {
    caching: {
      cache: cache,
      ttl: '1d'
    },
    sessions: {
      cache: cache,
      ttl: '1d'
    },
    request: {
      protocol: 'http',
      host: 'www.prolificinteractive.com'
    }
  }
});

lilly.bottle('getProduct', {
  cache: false,
  request: {
    method: 'get',
    pathname: '/'
  },
  htmlToJson: {
    links: ['a', {
      label: function () {

      }
    }]
  }
});

app.get('/products/:id', glenlivet.controller(function (req, resp) {
  return lilly
    .getProduct({ id: req.param('id') })
    .get('json');
}));
