module.exports = function (api) {
  api.cache(true);
  // Les alias de chemins (`@/*`) sont résolus nativement par Expo via tsconfig.json.
  return {
    presets: ['babel-preset-expo'],
  };
};
