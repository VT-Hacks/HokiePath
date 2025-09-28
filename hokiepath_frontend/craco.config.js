// craco.config.js (at the same level as package.json)
module.exports = {
  devServer: (devServerConfig) => {
    // Fixes: "options.allowedHosts[0] should be a non-empty string"
    devServerConfig.allowedHosts = 'all'; // or ['all'] or ['.your-domain.com']
    return devServerConfig;
  },
  // Add other CRACO webpack overrides here later if you need them.
};
