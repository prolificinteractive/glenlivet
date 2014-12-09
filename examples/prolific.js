var express = require('express');
var glenlivet = require('glenlivet');
var app = express();

var prolific = glenlivet.createBarrel({
  plugins: [
    require('glenlivet-request'),
    require('glenlivet-htmltojson'),
    require('glenlivet-controller')
  ],
  pluginDefaults: {
    request: {
      protocol: 'http',
      host: 'www.prolificinteractive.com'
    }
  },
  bottleMethod: {
    returnDataPath: 'json'
  }
});

prolific.bottle('getLinks', function () {
  request: {
    pathname: function (data) {
      return '/' + (data.page || '');
    },
    header: {
      'Weird-Ass-Header': getWeirdAssHeader
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
    resp.send(data);
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
