module.exports = (baseConfig, env, defaultConfig) => {
  defaultConfig.node = Object.assign({}, defaultConfig.node, {fs: 'empty'})
  return defaultConfig;
};
