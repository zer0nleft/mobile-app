module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Ya no necesitamos los plugins de WatermelonDB aquí.
  };
};