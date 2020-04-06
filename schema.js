/**
 * @brief The JSON schema for the objects in this package that will be validated using JSON schema validators.
 */

/**
 * Epoch time in milliseconds (64-bit value).
 */
const epochTime = {
  "id":      "/EpochTime",
  "type":    "integer",
  "minimum": 0,
  "maximum": 9223372036854775807,
};

/**
 * @brief Defines the structure of the options object that is accepted by this package.
 */
const packageOptions = {
  "id":   "/PackageOptions",
  "type": "object",
  "properties": {
    "clientId":     {"type": "string", "minLength": 1, "maxLength": 32},
    "clientSecret": {"type": "string", "minLength": 1, "maxLength": 16},
    "redirectUri":  {"type": "string", "format": "uri"},
    "apiUri":       {"type": "string", "format": "uri"},
  },
  "required": [
    "clientId",
    "clientSecret",
    "redirectUri",
    "apiUri"
  ]
};

/**
 * @brief Defines an OAuth object that is returned by the Dexcom OAuth system.
 */
const dexcomOAuthToken = {
  "id":   "/DexcomOAuthToken",
  "type": "object",
  "properties": {
    "access_token":  {"type": "string",  "minLength": 1, "maxLength": 1024},
    "expires_in":    {"type": "integer", "minimum":   0, "maximum":   7200},
    "token_type":    {"type": "string",  "minLength": 1, "maxLength": 6},
    "refresh_token": {"type": "string",  "minLength": 1, "maxLength": 1024},
  },
  "required": [
    "access_token",
    "expires_in",
    "token_type",
    "refresh_token"
  ]
};

/**
 * @brief Defines the OAuth token object that clients pass to this package in order to access the Dexcom platform.
 */
const oauthTokens = {
  "id":   "/OAuthTokens",
  "type": "object",
  "properties": {
    "timestamp":        {"$ref": "/EpochTime"},
    "dexcomOAuthToken": {"$ref": "/DexcomOAuthToken"},
  },
  "required": [
    "timestamp",
    "dexcomOAuthToken"
  ]
};

/**
 * @brief Defines the list of valid sandbox authentication codes.
 */
const sandboxAuthCodes = {
  "id":   "/SandboxAuthCode",
  "type": "string",
  "enum": [
    "authcode1",
    "authcode2",
    "authcode3",
    "authcode4",
    "authcode5",
    "authcode6"
  ]
};


//**************
//* Public API *
//**************

exports.epochTime        = epochTime;
exports.packageOptions   = packageOptions;
exports.dexcomOAuthToken = dexcomOAuthToken;
exports.oauthTokens      = oauthTokens;
exports.sandboxAuthCodes = sandboxAuthCodes;
