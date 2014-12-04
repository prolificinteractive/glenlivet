var _ = require('lodash');

function Plugin(namespace, defaults, _plugin) {
  if (!_plugin) {
    _plugin = defaults;
    defaults = {};
  }

  function plugin(pluginConfig) {
    if (!pluginConfig) {
      return;
    }

    if (_.isObject(pluginConfig) && !_.isArray(pluginConfig)) {
      pluginConfig = _.defaults({}, pluginConfig, defaults);
    } else if (pluginConfig === true) {
      pluginConfig = _.extend({}, defaults);
    }

    _plugin.call(this, pluginConfig);
  }

  plugin.namespace = namespace;
  plugin.defaults = defaults;

  return plugin;
}

module.exports = Plugin;
