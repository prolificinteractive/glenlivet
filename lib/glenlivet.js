module.exports = {
  Barrel: require('./Barrel'),
  Bottle: require('./Bottle'),
  Plugin: require('./Plugin'),
  createBarrel: function (config) {
    return new this.Barrel(config);
  },
  createBottle: function (config) {
    return new this.Bottle(config);
  },
  createPlugin: function (name, defaults, _plugin) {
    return new this.Plugin(name, defaults, _plugin);
  }
};
