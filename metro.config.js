const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure .web.tsx/.web.ts are resolved before .tsx/.ts on web platform
// This prevents @maplibre (native-only) from being bundled for web
config.resolver = config.resolver || {};
config.resolver.platforms = ['web', 'ios', 'android', 'native'];

module.exports = config;
