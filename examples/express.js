var express = require('express');
var glenlivet = require('../lib/glenlivet');
var app = express();

var getCategories = glenlivet.controller(function (req) {
  return glenlivet.htmlToJson.request({
    method: 'get',
    uri: 'http://amazon.com'
  }, ['.nav .item', {
    'id': function ($item) {
      return $item.attr('data-id');
    },
    'name': function ($item) {
      return $item.attr('data-name');
    }
  }]);
});

glenlivet.controller = function (getPromise) {
  return function (req, resp, next) {
    getPromise(req).done(function (data) {
      resp.send(data);
    }, next);
  };
};

app.get('/categories', function (req, resp) {
  getCategories().done(resp.success, resp.error);
});

app.get('/categories/:id/products', function (req, resp) {
  getCategoryProducts(req.param('id')).done(resp.success, resp.error);
});
