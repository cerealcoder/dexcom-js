/**
 * @brief The JSON schema for the objects in this package that will be validated using JSON schema validators.
 */

const epochTime = {
  "id":      "/EpochTime",
  "type":    "integer",
  "minimum": 0,
  "maximum": 2147483647
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
    "access_token":  {"type": "string",  "minLength": 1, "maxLength": 128},
    "expires_in":    {"type": "integer", "minimum":   0, "maximum": 7200},
    "token_type":    {"type": "string",  "minLength": 1, "maxLength": 6},
    "refresh_token": {"type": "string",  "minLength": 1, "maxLength": 256},
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


//**************
//* Public API *
//**************

exports.epochTime        = epochTime;
exports.packageOptions   = packageOptions;
exports.dexcomOAuthToken = dexcomOAuthToken;
exports.oauthTokens      = oauthTokens;
