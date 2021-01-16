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
const _           = require('lodash');


//**************
//* Public API *
//**************

const DexcomJS = Object.create({});
module.exports = DexcomJS;


//**********************
//* Private Properties *
//**********************

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
 * @param newOptions
 * An object that conforms to the following format:
 * {
 *   clientId: string,
 *   clientSecret: string,
 *   redirectUri: string,
 *   apiUri: string
 * }
 */
DexcomJS.setOptions = function(newOptions) {
  helpers.validateOptions(newOptions);
  this.options = newOptions;
};

/**
 * Obtains a Dexcom OAuth 2.0 access token for the Dexcom "sandbox" data.
 *
 * @see https://developer.dexcom.com/sandbox-data
 *
 * @param user
 * the sandbox user name such as 'SandBoxUser1', 'SandBoxser2', ..., 'SandBoxUser6').
 * WAS: The Sandbox authorization code ('authcode1', 'authcode2', ..., 'authcode6').
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
 *    Downstream users may use the timestamp and the expires_in values to determine if the Dexcom access token has
 *    expired and must be refreshed.
 */
DexcomJS.getSandboxAuthenticationToken = async function(user) {
  helpers.validateOptions(this.options);
  helpers.validateSandboxAuthcode(user);

  // map over old method (authcode) to new method that uses username as of 4/27/19
  let userId = user;
  const origTestApiAuthcode = 'authcode';
  const lastLetter = user.substring(user.length - 1);
  if (user.includes(origTestApiAuthcode)) {
    userId = 'SandboxUser' + lastLetter;
  }

  // Issue an HTTP POST to the Dexcom system to obtain the sandbox access token.
  const form = {
    userId:       userId,
    clientId:     this.options.clientId,
    redirectURI:  this.options.redirectUri,
    state: '',
    scope: [
      'egv',
      'calibrations',
      'devices',
      'dataRange',
      'events',
      'statistics',
    ]
  };
  //console.log(form);
  const result = await httpClient.post('https://developer-portal-dot-g5-dexcom-prod-us-5.appspot.com/consent', form);
  //console.log(result);
  //console.log(result.status);
  //console.log(result.data);

	const authCode = result.data.authCode;
	const urlEncodedForm = querystring.stringify({
		client_id:     this.options.clientId,
		client_secret: this.options.clientSecret,
		code:          authCode,
		grant_type:    'authorization_code',
		redirect_uri:  this.options.redirectUri,
	});
	const httpConfig = {
		headers: {
			"Content-Type":  "application/x-www-form-urlencoded"
		}
  };

  const authResult = await httpClient.post('https://sandbox-api.dexcom.com/v2/oauth2/token', urlEncodedForm);

  //console.log(authResult);
  //console.log(authResult.data);
  
  return {
    timestamp:        new Date().getTime(),
    dexcomOAuthToken: authResult.data,
  };
}

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

  const possiblyRefreshedOauthTokens = await helpers.refreshAccessToken(this.options, oauthTokens, false);
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


DexcomJS.getEstimatedGlucoseValuesAnyDateRange  = async function(oauthTokens, startTime, endTime) {
  helpers.validateOptions(this.options);
  helpers.validateOAuthTokens(oauthTokens);
  helpers.validateTimeWindow(startTime, endTime);

  const possiblyRefreshedOauthTokens = await helpers.refreshAccessToken(this.options, oauthTokens, false);

  //
  // split the data range up into 89 day ranges (90 is the max, we're skirting around rounding issues by going one less than that)
  //
  const maxTimeRangeMilliSec = 89 * 86400 * 1000;
  let timeIndex = startTime;
  const times = [];
  while (timeIndex <= endTime) {
    let endTimeWindow = timeIndex + maxTimeRangeMilliSec;
    endTimeWindow = endTimeWindow <= endTime? endTimeWindow : endTime;
    times.push({
      startTime: timeIndex,
      endTime: endTimeWindow,
    });
    timeIndex = timeIndex + maxTimeRangeMilliSec;
  }
  const requests = times.map(el => {
    const startDateString              = helpers.dexcomifyEpochTime(el.startTime);
    const endDateString                = helpers.dexcomifyEpochTime(el.endTime);
    const parameters                   = { startDate: startDateString, endDate: endDateString };
    const httpConfig                   = { headers: {Authorization:  `Bearer ${possiblyRefreshedOauthTokens.dexcomOAuthToken.access_token}`}, params: parameters };
    return httpClient.get(`${this.options.apiUri}/v2/users/self/egvs`, httpConfig);
  });
  const results = await Promise.all(requests);
  const combinedEgvs = results.reduce((a, el)  => {
    // @see https://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays
    return a.concat(el.data.egvs);
  }, []);

  const returnValue = {
    estimatedGlucoseValues: {
      unit: results[0].unit,          // ugh, 0 may not exist, and each fetched time period in theory could have different units
      rateUnit: results[0].rateUnit,  // ugh, 0 may not exist, and each fetched time period in theory could have different units
      egvs: combinedEgvs,
    }
  };
  if (possiblyRefreshedOauthTokens !== oauthTokens) {
    returnValue['oauthTokens'] = possiblyRefreshedOauthTokens;
  }
  return returnValue;
};

/*
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

  const possiblyRefreshedOauthTokens = await helpers.refreshAccessToken(this.options, oauthTokens, false);
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

  const possiblyRefreshedOauthTokens = await helpers.refreshAccessToken(this.options, oauthTokens, false);
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

  const possiblyRefreshedOauthTokens = await helpers.refreshAccessToken(this.options, oauthTokens, false);
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

  const possiblyRefreshedOauthTokens = await helpers.refreshAccessToken(this.options, oauthTokens, false);
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


/*
 * @brief split data up into an array of daily arrays, sorted by time in forward order
 *
 * @param input
 * Data as received from Dexcom via a function in this modulee
 *
 * @see https://developer.dexcom.com/get-events
 */
DexcomJS.shardEgvsByDay = function(input) {
  helpers.validateOptions(this.options);

  const sortedInput = input.sort((e1, e2) => {
    const e1ms = new Date(e1.systemTime).getTime();
    const e2ms = new Date(e2.systemTime).getTime();
    return e1ms - e2ms;
  });
  const groupedByDay = _.groupBy(sortedInput, el => {
    // @see https://stackoverflow.com/questions/3894048/what-is-the-best-way-to-initialize-a-javascript-date-to-midnight
    const elDate = new Date(el.systemTime);
    return elDate.setHours(0,0,0,0);  // last midnight
  });
  return groupedByDay;
};

/**
 * @brief
 * calculate a legal fetch range that starts at the midnight prior
 * to the requested time, or the midnight following if the request3ed
 * time is less than the valid time ranges Dexcom has returned
 */
DexcomJS.rangeInDayIntervals = function(dataRange, endTime, daysPast) {
  const returnValue = {
    startTime: 0,
    endTime: 0,
    valid: false,
  }

  const startDateString = dataRange.start.systemTime;
  const endDateString = dataRange.end.systemTime;
  let startTime = endTime - daysPast *  86400 * 1000;
  // go back to midnight of start time if possible
  const midnightStartTime = new Date(startTime).setHours(0,0,0,0);
  const availableStartTime = new Date(startDateString);
  startTime = midnightStartTime;
  if (midnightStartTime < availableStartTime.getTime()) {
    startTime = availableStartTime.getTime();
  }
  returnValue.startTime = startTime;
  returnValue.endTime = endTime;
  returnValue.valid = true;
  return returnValue;
}
