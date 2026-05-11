const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Work around package "exports" resolution incompatibilities in Metro/Web
// with socket.io-client and engine.io-client.
config.resolver.unstable_enablePackageExports = false;
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
