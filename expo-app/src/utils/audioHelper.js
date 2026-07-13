let _isExpoGo = null;

export function isExpoGo() {
  if (_isExpoGo !== null) return _isExpoGo;
  try {
    const Constants = require("expo-constants");
    const env = (Constants?.default || Constants)?.executionEnvironment;
    _isExpoGo = env === "storeClient";
  } catch (_) {
    _isExpoGo = false;
  }
  return _isExpoGo;
}
