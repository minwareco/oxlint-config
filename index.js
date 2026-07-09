/**
 * Returns the absolute path to the shared .oxlintrc.json.
 * Most consumers will not need this — instead, reference the config directly via the
 * `extends` field in their own .oxlintrc.json:
 *
 *   { "extends": ["./node_modules/@minware/oxlint-config/.oxlintrc.json"] }
 *
 * @returns {string}
 */
function getPath() {
  return require('path').join(__dirname, '.oxlintrc.json');
}

module.exports = {
  getPath,
};
