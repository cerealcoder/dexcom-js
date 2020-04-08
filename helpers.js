/**
 * This file contains helper functions utilized by this package.
 */

'use strict';


//***********
//* Modules *
//***********

const assert    = require('assert');
const Validator = require('jsonschema').Validator;
const schema    = require('./schema.js');


//*************
//* Constants *
//*************

/**
 * The number of milliseconds in one second.
 *
 * @type {number}
 */
const millisecondsPerSecond = 1000;

/**
 * The time, in seconds, prior to the actual expiration time of an access token, at which an access token will be
 * considered to be expired.
 *
 * @type {number}
 */
const aboutToExpireThresholdSeconds = 60;


//*************
//* Functions *
//*************

/**
 * Validates the contents of an options Object.
 *
 * @param options
 * An object of the following format:
 * {
 *   clientId: string,
 *   clientSecret: string,
 *   redirectUri: string,
 *   apiUri: string
 * }
 * In order for the options object to be valid, the object must exist, and all its properties must be non-empty string
 * values.
 */
function validateOptions(options) {
  assert(options, 'options must be provided');

  const validator = new Validator();
  const validatorResult = validator.validate(options, schema.packageOptions);
  assert(validatorResult.valid, 'options must be valid');
}

/**
 * Validates a sandbox authentication code.
 */
function validateSandboxAuthcode(authcode) {
  assert(authcode, 'authcode must be provided');

  const validator = new Validator();
  const validatorResult = validator.validate(authcode, schema.sandboxAuthCodes);
  assert(validatorResult.valid, 'authcode must be valid');
}

/**
 * Validates the contents of a oauthTokens object.
 *
 * @param oauthTokens
 * An object of the following format:
 * {
 *   "timestamp": epochMilliseconds,
 *   "dexcomOAuthToken": {
 *     "access_token": "your access token",
 *     "expires_in": timeToLiveInSeconds,
 *     "token_type": "Bearer",
 *     "refresh_token": "your refresh token"
 *   }
 * }
 *
 */
function validateOAuthTokens(oauthTokens) {
  assert(oauthTokens, 'oauthTokens must be provided');

  const validator = new Validator();

  validator.addSchema(schema.dexcomOAuthToken, '/DexcomOAuthToken');
  validator.addSchema(schema.epochTime,        '/EpochTime');

  const validatorResult = validator.validate(oauthTokens, schema.oauthTokens);
  assert(validatorResult.valid, 'oauthTokens must be valid');
}

/**
 * Validates the components of a time window.
 *
 * @param startTime
 * A number that represents an epoch time, in milliseconds. This value must be less than endTime.
 *
 * @param endTime
 * A number that represents an epoch time, in milliseconds. This value must be greater than startTime.
 */
function validateTimeWindow(startTime, endTime) {
  assert(startTime, 'startTime must be provided');
  assert(endTime,   'endTime must be provided');

  const validator = new Validator();

  const startTimeValidatorResult = validator.validate(startTime, schema.epochTime);
  assert(startTimeValidatorResult.valid, 'startTime must be valid');

  const endTimeValidatorResult = validator.validate(endTime, schema.epochTime);
  assert(endTimeValidatorResult.valid, 'endTime must be valid');

  assert(startTime < endTime, 'startTime must be < endTime');
}

/**
 * Gets the "Dexcomified" representation of an epoch timestamp. Dexcom uses the first 19 characters of the
 * ISO 8601 time representation as its "date/time" representation.
 *
 * @see https://en.wikipedia.org/wiki/ISO_8601
 *
 * @param epochTime
 * A number that represents the UTC epoch time, in milliseconds.
 *
 * @returns A string that matches the following format: "YYYY-MM-DDThh:mm:ss".
 */
function dexcomifyEpochTime(epochTime) {
  const date       = new Date(epochTime);
  const dateString = date.toISOString().slice(0, 19);
  return dateString;
}

/**
 * Uses the Dexcom OAuth API to obtain a new access token if the access token passed to this function has expired,
 * or is about to expire.
 *
 * @param oauthTokens
 * An object of the following format:
 * {
 *   "timestamp": epochMilliseconds,
 *   "dexcomOAuthToken": {
 *     "access_token": "your access token",
 *     "expires_in": timeToLiveInSeconds,
 *     "token_type": "Bearer",
 *     "refresh_token": "your refresh token"
 *   }
 * }
 *
 * @param force
 * A boolean value that indicates if a new access token is to be acquired, regardless of the state of the access
 * token passed to this function.
 *
 * @returns a Promise that wraps an Object of the following format:
 * {
 *   "timestamp": epochMilliseconds,
 *   "dexcomOAuthToken": {
 *     "access_token": "your access token",
 *     "expires_in": timeToLiveInSeconds,
 *     "token_type": "Bearer",
 *     "refresh_token": "your refresh token"
 *   }
 * }
 *
 * Notes:
 *
 * 1. Dexcom access tokens are not guaranteed to be JSON Web Tokens (JWTs).
 * 2. The timestamp property represents the time, in epoch milliseconds, when the Dexcom access token was obtained.
 *    Downstream users may use the timestamp and the dexcomOAuthToken.expires_in values to determine if the Dexcom
 *    access token has expired and must be refreshed.
 */
async function refreshAccessToken(oauthTokens, force) {
  if (!force &&
    (Date.now() + (aboutToExpireThresholdSeconds * millisecondsPerSecond) <
      oauthTokens.timestamp + (oauthTokens.dexcomOAuthToken.expires_in * millisecondsPerSecond)))
  {
    return oauthTokens;
  }

  // @see https://developer.dexcom.com/authentication
  // Step Six: Refresh Tokens
  const urlEncodedForm = querystring.stringify({
    client_id:     this.options.clientId,
    client_secret: this.options.clientSecret,
    refresh_token: oauthTokens.dexcomOAuthToken.refresh_token,
    grant_type:    'refresh_token',
    redirect_uri:  this.options.redirectUri,
  });
  const httpConfig = {
    headers: {
      "cache-control": "no-cache",
      "Content-Type":  "application/x-www-form-urlencoded"
    }
  };

  const result = await httpClient.post(this.options.apiUri + '/v2/oauth2/token', urlEncodedForm, httpConfig);
  //console.log(result.status);
  //console.log(result.data);

  return {
    timestamp:        new Date().getTime(),
    dexcomOAuthToken: result.data,
  };
}


//**************
//* Public API *
//**************

exports.validateOptions         = validateOptions;
exports.validateSandboxAuthcode = validateSandboxAuthcode;
exports.dexcomifyEpochTime      = dexcomifyEpochTime;
exports.validateTimeWindow      = validateTimeWindow;
exports.validateOAuthTokens     = validateOAuthTokens;
exports.refreshAccessToken      = refreshAccessToken;
