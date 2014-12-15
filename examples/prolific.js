var express = require('express');
var glenlivet = require('../index');
var app = express();

var prolific = glenlivet.createBarrel({
  plugins: [
    require('glenlivet-request'),
    require('glenlivet-htmltojson')
  ],
  pluginDefaults: {
    request: {
      protocol: 'http',
      host: 'www.prolificinteractive.com'
    }
  }
});

prolific.bottle('getLinks', {
  request: {
    pathname: function (data) {
      return '/' + (data.page || '');
    }
  },
  htmlToJson: ['a[href]', {
    'text': function ($a) {
      return $a.text();
    },
    'href': function ($a) {
      return $a.attr('href');
    }
  }]
});

app.use(function addResponseMethods (req, resp, next) {
  resp.success = function (data) {
    resp.send(data.json);
  };

  resp.error = function (err) {
    resp
      .status(err.status)
      .send({
        error: {
          type: err.type,
          message: err.message
        }
      });
  };

  next();
});

app.listen(process.env.PORT || 8888);

app.get('/:page/links', function (req, resp) {
  var page = req.param('page');

  prolific
    .getLinks({ page: page })
    .done(resp.success, resp.failure);
});
