/**
 * This package provides an API that is a subset of the Dexcom public API. It handles the HTTP layer, as well as the
 * refreshing of expired OAuth 2.0 access tokens. The public API for this package is described in the top-level
 * README file.
 */

'use strict';


//***********
//* Modules *
//***********

const httpClient  = require('axios');
const querystring = require('querystring');
const helpers     = require('./helpers.js');


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


//**************
//* Public API *
//**************

const DexcomJS = Object.create({});
module.exports = DexcomJS;


//**************
//* Properties *
//**************

/**
 * The user of this package is responsible for defining the Dexcom access options. You can obtain the client ID,
 * client secret, and redirect URI from the Dexcom developer's web site at the following URL:
 * https://developer.dexcom.com/user/me/apps
 *
 * The API URI will either be for Sandbox data (see https://developer.dexcom.com/sandbox-data), or production
 * data (see https://developer.dexcom.com/endpoint-overview).
 */
DexcomJS.options = {
  clientId:     '',
  clientSecret: '',
  redirectUri:  '',
  apiUri:       'https://sandbox-api.dexcom.com',
};


//********************
//* Public Functions *
//********************

/**
 * Sets this package's options for accessing the Dexcom platform API.
 *
 * @param options
 * An object that conforms to the following format:
 * {
 *   clientId: string,
 *   clientSecret: string,
 *   redirectUri: string,
 *   apiUri: string
 * }
 */
DexcomJS.setOptions = function(options) {
  helpers.validateOptions(options);
  this.options = options;
};

/**
 * Obtains a Dexcom OAuth 2.0 access token for the Dexcom "sandbox" data.
 *
 * @see https://developer.dexcom.com/sandbox-data
 *
 * @param authcode
 * The Sandbox authorization code ('authcode1', 'authcode2', ..., 'authcode6').
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
 * 1. Dexcom access tokens are not JSON Web Tokens (JWTs).
 * 2. The timestamp property represents the time, in epoch milliseconds, when the Dexcom access token was obtained.
 *    Downstream users may use the timestamp and the expires_in values to determine if the Dexcom access token has
 *    expired and must be refreshed.
 */
DexcomJS.getSandboxAuthenticationToken = async function(authcode) {
  helpers.validateOptions(this.options);
  helpers.validateSandboxAuthcode(authcode);

  // Issue an HTTP POST to the Dexcom system to obtain the sandbox access token.
  const urlEncodedForm = querystring.stringify({
    client_id:     this.options.clientId,
    client_secret: this.options.clientSecret,
    code:          authcode,
    grant_type:    'authorization_code',
    redirect_uri:  this.options.redirectUri,
  });
  const httpConfig = {
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded"
    }
  };
  const result = await httpClient.post('https://sandbox-api.dexcom.com/v2/oauth2/token', urlEncodedForm, httpConfig);
  //console.log(result.status);
  //console.log(result.data);

  return {
    timestamp:        new Date().getTime(),
    dexcomOAuthToken: result.data,
  };
};

/**
 * @brief Gets the Dexcom estimated glucose values for a particular date range.
 *
 * @param oauthTokens
 * An object that conforms to the following format:
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
 * @param startTime
 * A number that represents the UTC epoch time, in milliseconds, of the beginning of the time window for which to
 * acquire estimated glucose values.
 *
 * @param endTime
 * A number that represents the UTC epoch time, in milliseconds, of the end of the time window for which to
 * acquire estimated glucose values.
 *
 * @returns a Promise that wraps an object of the following format:
 * {
 *   estimatedGlucoseValues: {<object returned by Dexcom API>},
 *   oauthTokens: {
 *     "timestamp": epochMilliseconds,
 *     "dexcomOAuthToken": {
 *       "access_token": "your access token",
 *       "expires_in": timeToLiveInSeconds,
 *       "token_type": "Bearer",
 *       "refresh_token": "your refresh token"
 *     }
 *   }
 * }
 *
 * Note that the oauthTokens property will exist only if the access token was refreshed.
 *
 * @see https://developer.dexcom.com/get-egvs
 */
DexcomJS.getEstimatedGlucoseValues = async function(oauthTokens, startTime, endTime) {
  helpers.validateOptions(this.options);
  helpers.validateOAuthTokens(oauthTokens);
  helpers.validateTimeWindow(startTime, endTime);

  const possiblyRefreshedOauthTokens = await refreshAccessToken(oauthTokens, false);
  const startDateString              = helpers.dexcomifyEpochTime(startTime);
  const endDateString                = helpers.dexcomifyEpochTime(endTime);
  const parameters                   = { startDate: startDateString, endDate: endDateString };
  const httpConfig                   = { headers: {Authorization:  `Bearer ${possiblyRefreshedOauthTokens.dexcomOAuthToken.access_token}`}, params: parameters };

  const result = await httpClient.get(`${this.options.apiUri}/v2/users/self/egvs`, httpConfig);

  const returnValue = {estimatedGlucoseValues: result.data};
  if (possiblyRefreshedOauthTokens !== oauthTokens) {
    returnValue['oauthTokens'] = possiblyRefreshedOauthTokens;
  }
  return returnValue;
};

/**
 * @brief Gets the Dexcom user-specified events for a particular date range.
 *
 * @param oauthTokens
 * An object that conforms to the following format:
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
 * @param startTime
 * A number that represents the UTC epoch time, in milliseconds, of the beginning of the time window for which to
 * acquire user-specified events.
 *
 * @param endTime
 * A number that represents the UTC epoch time, in milliseconds, of the end of the time window for which to
 * acquire user-specified events.
 *
 * @returns a Promise that wraps an object of the following format:
 * {
 *   events: {<object returned by Dexcom API>},
 *   oauthTokens: {
 *     "timestamp": epochMilliseconds,
 *     "dexcomOAuthToken": {
 *       "access_token": "your access token",
 *       "expires_in": timeToLiveInSeconds,
 *       "token_type": "Bearer",
 *       "refresh_token": "your refresh token"
 *     }
 *   }
 * }
 *
 * Note that the oauthTokens property will exist only if the access token was refreshed.
 *
 * @see https://developer.dexcom.com/get-events
 */
DexcomJS.getEvents = async function(oauthTokens, startTime, endTime) {
  helpers.validateOptions(this.options);
  helpers.validateOAuthTokens(oauthTokens);
  helpers.validateTimeWindow(startTime, endTime);

  const possiblyRefreshedOauthTokens = await refreshAccessToken(oauthTokens, false);
  const startDateString              = helpers.dexcomifyEpochTime(startTime);
  const endDateString                = helpers.dexcomifyEpochTime(endTime);
  const parameters                   = { startDate: startDateString, endDate: endDateString };
  const httpConfig                   = { headers: {Authorization:  `Bearer ${possiblyRefreshedOauthTokens.dexcomOAuthToken.access_token}`}, params: parameters };

  const result = await httpClient.get(`${this.options.apiUri}/v2/users/self/events`, httpConfig);

  const returnValue = {events: result.data};
  if (possiblyRefreshedOauthTokens !== oauthTokens) {
    returnValue['oauthTokens'] = possiblyRefreshedOauthTokens;
  }
  return returnValue;
};

/**
 * @brief Gets a Dexcom user's earliest and latest times for calibration, EGV, and event records.
 *
 * @param oauthTokens
 * An object that conforms to the following format:
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
 * @returns a Promise that wraps an object of the following format:
 * {
 *   dataRange: {<object returned by Dexcom API>},
 *   oauthTokens: {
 *     "timestamp": epochMilliseconds,
 *     "dexcomOAuthToken": {
 *       "access_token": "your access token",
 *       "expires_in": timeToLiveInSeconds,
 *       "token_type": "Bearer",
 *       "refresh_token": "your refresh token"
 *     }
 *   }
 * }
 *
 * Note that the oauthTokens property will exist only if the access token was refreshed.
 *
 * @see https://developer.dexcom.com/get-datarange
 */
DexcomJS.getDataRange = async function(oauthTokens) {
  helpers.validateOptions(this.options);
  helpers.validateOAuthTokens(oauthTokens);

  const possiblyRefreshedOauthTokens = await refreshAccessToken(oauthTokens, false);
  const httpConfig                   = { headers: {Authorization:  `Bearer ${possiblyRefreshedOauthTokens.dexcomOAuthToken.access_token}`}};

  const result = await httpClient.get(`${this.options.apiUri}/v2/users/self/dataRange`, httpConfig);

  const returnValue = {dataRange: result.data};
  if (possiblyRefreshedOauthTokens !== oauthTokens) {
    returnValue['oauthTokens'] = possiblyRefreshedOauthTokens;
  }
  return returnValue;
};

/**
 * @brief Gets a Dexcom user's of a user's calibration events.
 *
 * @param oauthTokens
 * An object that conforms to the following format:
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
 * @param startTime
 * A number that represents the UTC epoch time, in milliseconds, of the beginning of the time window for which to
 * acquire calibration events.
 *
 * @param endTime
 * A number that represents the UTC epoch time, in milliseconds, of the end of the time window for which to
 * acquire calibration events.
 *
 * @returns a Promise that wraps an object of the following format:
 * {
 *   calibrations: {<object returned by Dexcom API>},
 *   oauthTokens: {
 *     "timestamp": epochMilliseconds,
 *     "dexcomOAuthToken": {
 *       "access_token": "your access token",
 *       "expires_in": timeToLiveInSeconds,
 *       "token_type": "Bearer",
 *       "refresh_token": "your refresh token"
 *     }
 *   }
 * }
 *
 * Note that the oauthTokens property will exist only if the access token was refreshed.
 *
 * @see https://developer.dexcom.com/get-calibrations
 */
DexcomJS.getCalibrations = async function(oauthTokens, startTime, endTime) {
  helpers.validateOptions(this.options);
  helpers.validateOAuthTokens(oauthTokens);
  helpers.validateTimeWindow(startTime, endTime);

  const possiblyRefreshedOauthTokens = await refreshAccessToken(oauthTokens, false);
  const startDateString              = helpers.dexcomifyEpochTime(startTime);
  const endDateString                = helpers.dexcomifyEpochTime(endTime);
  const parameters                   = { startDate: startDateString, endDate: endDateString };
  const httpConfig                   = { headers: {Authorization:  `Bearer ${possiblyRefreshedOauthTokens.dexcomOAuthToken.access_token}`}, params: parameters };

  const result = await httpClient.get(`${this.options.apiUri}/v2/users/self/calibrations`, httpConfig);

  const returnValue = {calibrations: result.data};
  if (possiblyRefreshedOauthTokens !== oauthTokens) {
    returnValue['oauthTokens'] = possiblyRefreshedOauthTokens;
  }
  return returnValue;
};

/**
 * @brief Gets a Dexcom user's summary statistics, including averages, quartiles, and measures of variance.
 *
 * @param oauthTokens
 * An object that conforms to the following format:
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
 * @param startTime
 * A number that represents the UTC epoch time, in milliseconds, of the beginning of the time window for which to
 * acquire statistics.
 *
 * @param endTime
 * A number that represents the UTC epoch time, in milliseconds, of the end of the time window for which to
 * acquire statistics.
 *
 * @returns a Promise that wraps an object of the following format:
 * {
 *   statistics: {<object returned by Dexcom API>},
 *   oauthTokens: {
 *     "timestamp": epochMilliseconds,
 *     "dexcomOAuthToken": {
 *       "access_token": "your access token",
 *       "expires_in": timeToLiveInSeconds,
 *       "token_type": "Bearer",
 *       "refresh_token": "your refresh token"
 *     }
 *   }
 * }
 *
 * Note that the oauthTokens property will exist only if the access token was refreshed.
 *
 * @see https://developer.dexcom.com/post-statistics
 */
DexcomJS.getStatistics = async function(oauthTokens, startTime, endTime) {
  helpers.validateOptions(this.options);
  helpers.validateOAuthTokens(oauthTokens);
  helpers.validateTimeWindow(startTime, endTime);

  const possiblyRefreshedOauthTokens = await refreshAccessToken(oauthTokens, false);
  const startDateString              = helpers.dexcomifyEpochTime(startTime);
  const endDateString                = helpers.dexcomifyEpochTime(endTime);
  const parameters                   = { startDate: startDateString, endDate: endDateString };
  const httpConfig                   = { headers: {Authorization:  `Bearer ${possiblyRefreshedOauthTokens.dexcomOAuthToken.access_token}`}, params: parameters };

  const requestBody = {
    targetRanges: [
      {
        name:      'day',
        startTime: '07:00:00',
        endTime:   '20:00:00',
        egvRanges: [
          {
            name: 'urgentLow',
            bound: 55,
          },
          {
            name: 'low',
            bound: 70,
          },
          {
            name: 'high',
            bound: 180,
          },
        ]
      },
      {
        name:      'night',
        startTime: '20:00:00',
        endTime:   '07:00:00',
        egvRanges: [
          {
            name: 'urgentLow',
            bound: 55,
          },
          {
            name: 'low',
            bound: 80,
          },
          {
            name: 'high',
            bound: 200,
          },
        ]
      },
    ]
  };

  const result = await httpClient.post(`${this.options.apiUri}/v2/users/self/statistics`, requestBody, httpConfig);

  const returnValue = {statistics: result.data};
  if (possiblyRefreshedOauthTokens !== oauthTokens) {
    returnValue['oauthTokens'] = possiblyRefreshedOauthTokens;
  }
  return returnValue;
};


//*********************
//* Private Functions *
//*********************

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
 * 1. Dexcom access tokens are not JSON Web Tokens (JWTs).
 * 2. The timestamp property represents the time, in epoch milliseconds, when the Dexcom access token was obtained.
 *    Downstream users may use the timestamp and the expires_in values to determine if the Dexcom access token has
 *    expired and must be refreshed.
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
