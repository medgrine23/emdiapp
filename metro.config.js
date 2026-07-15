// Configuration Metro (Expo) — étend la configuration par défaut.
//
// @supabase/supabase-js importe dynamiquement `@opentelemetry/api` (télémétrie
// optionnelle, absente et inutile côté application). Metro tente malgré tout de
// le résoudre au moment du bundling et échoue. On l'aiguille donc vers un module
// vide ; Supabase intercepte déjà l'absence de ce module (`.catch(() => null)`).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const moduleVide = path.resolve(__dirname, 'src/shims/empty.js');
const resolveOriginal = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@opentelemetry/api') {
    return { type: 'sourceFile', filePath: moduleVide };
  }
  return (resolveOriginal ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
