function controller(getPromise) {
  return function (req, resp, next) {
    getPromise(req).done(function (data) {
      resp.send(data);
    }, next);
  };
}

module.exports = controller;
