'use strict';

const httpClient  = require('axios');
const querystring = require('querystring');
const assert = require('assert');
const jwt = require('jsonwebtoken');
const fs = require('fs');


const DexcomData = Object.create({});
exports = module.exports = DexcomData;


// 
// set options
//
DexcomData.options = {
  clientId: '',
  clientSecret: '',
  redirectUri: '',
  apiUri: 'https://sandbox-api.dexcom.com',
};
DexcomData.setOptions = function(options) {
  this.verifyOptions(options);
  this.options = options;
}
DexcomData.verifyOptions = function(options) {
  assert(options, 'options must be provided');
  assert(options.clientId, 'client ID must be provided');
  assert(options.clientSecret, 'client secret must be provided');
  assert(options.redirectUri, 'redirect URI must be provided.  Why we have no idea.  it is redundant with clientId.  Ask Dexcom');
}


// 
// log in a user (user authorization)
// This is for sandbox testing only, note no password.
// In a real application this library expects an OAUTH2 token set
// @see https://developer.dexcom.com/sandbox-data
//
// Note the authcode is 'authcode' + user number, e.g. SandboxUser2 is user number 2.
//
DexcomData.login = async function(username, authcode) {
  this.verifyOptions(this.options);
  if (!username) {
    username = 'SandboxUser1';
    authcode = 'authcode1';
  }

	// Step Four: Obtain Access Token
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
  }

	let result = await httpClient.post(this.options.apiUri + '/v2/oauth2/token', urlEncodedForm, httpConfig);
  //console.log(result.status);
  //console.log(result.data);
  let tokenSet = result.data;
  if (tokenSet.access_token) {
    tokenSet.decodedAccessToken = jwt.decode(tokenSet.access_token);
  }
  return tokenSet;
}

//
// Given current token set, fetch a new token set 
// if the current token is about to expire or a
// a forced token update is requested
//
// Return a valid token when done
//
DexcomData.getTokenSet = async function(currTokenSet, force) {
  assert(currTokenSet, 'requires a current token');
  this.verifyOptions(this.options);

  if (!force && (currTokenSet.decodedAccessToken.exp - Date.now() / 1000 > 60)) {
    return currTokenSet;
  }

  this.verifyOptions(this.options);

	// @see https://developer.dexcom.com/authentication
	// Step Six: Refresh Tokens
	const urlEncodedForm = querystring.stringify({
		client_id:     this.options.clientId,
		client_secret: this.options.clientSecret,
		refresh_token: currTokenSet.refresh_token,
		grant_type:   'refresh_token',
		redirect_uri:  this.options.redirectUri,
	});
  const httpConfig = {
    headers: {
      "cache-control": "no-cache",
      "Content-Type":  "application/x-www-form-urlencoded"
    }
  }

	let result = await httpClient.post(this.options.apiUri + '/v2/oauth2/token', urlEncodedForm, httpConfig)
  //console.log(result.status);
  //console.log(result.data);
  let tokenSet = result.data;
  if (tokenSet.access_token) {
    tokenSet.decodedAccessToken = jwt.decode(tokenSet.access_token);
  }
  return tokenSet;
};

// dexcom does not use a standard date format.  Why, we have no idea.
// @see https://developer.dexcom.com/get-egvs
function dexcomifyEpochTime(epochTime) {
  const date = new Date(epochTime);
  const dateString = date.toISOString().slice(0, 19); // YYYY-MM-DDThh:mm:ss is 19 characters
  return dateString;
}

DexcomData.getData = async function (tokenSet, startTime, endTime) {
  assert(tokenSet, 'requires access token set'); 
  assert(tokenSet.access_token, 'requires access token'); 
  assert(startTime, 'requires start time');
  assert(endTime, 'requires end time');

  const startDateString = dexcomifyEpochTime(startTime);
  const endDateString   = dexcomifyEpochTime(endTime);

  const parameters      = { startDate: startDateString, endDate: endDateString };
  const httpConfig      = { headers: {Authorization:  `Bearer ${tokenSet.access_token}`}, params: parameters };

  const result = await httpClient.get(this.options.apiUri + '/v2/users/self/egvs', httpConfig);
  let data = result.data;
  if (data && Array.isArray(data.egvs)) {
    // denormalized the prematurely optimized normalized units
    // add fields for milliseconds since epoch, type
    data = data.egvs.map(el => {
      if (!el.unit && data.unit) {
        el.unit = data.unit
      }
      if (!el.rateUnit && data.rateUnit) {
        el.rateUnit = data.rateUnit
      }
      el.systemEpochTime = Date.parse(el.systemTime);
      el.displayEpochTime = Date.parse(el.displayTime);
      el.type = 'egvs';
      return el;
    });
  }
 
  return data;

};

DexcomData.getEvents = async function (tokenSet, startTime, endTime) {
  assert(tokenSet, 'requires access token set'); 
  assert(tokenSet.access_token, 'requires access token'); 
  assert(startTime, 'requires start time');
  assert(endTime, 'requires end time');

  const startDateString = dexcomifyEpochTime(startTime);
  const endDateString   = dexcomifyEpochTime(endTime);

  const parameters      = { startDate: startDateString, endDate: endDateString };
  const httpConfig      = { headers: {Authorization:  `Bearer ${tokenSet.access_token}`}, params: parameters };

  const result = await httpClient.get(this.options.apiUri + '/v2/users/self/events', httpConfig);
  let data = result.data;
  if (data && Array.isArray(data.events)) {
    // add fields for milliseconds since epoch, type
    data = data.events.map(el => {
      el.systemEpochTime = Date.parse(el.systemTime);
      el.displayEpochTime = Date.parse(el.displayTime);
      el.type = 'events';
      return el;
    });
  }
 
  return data;
};

DexcomData.getDataRange = async function (tokenSet) {
  assert(tokenSet, 'requires access token set'); 
  assert(tokenSet.access_token, 'requires access token'); 

  const httpConfig      = { headers: {Authorization:  `Bearer ${tokenSet.access_token}`}};
  const result = await httpClient.get(this.options.apiUri + '/v2/users/self/dataRange', httpConfig);
  let data = result.data;
  return data;
};

DexcomData.getCalibrations = async function (tokenSet, startTime, endTime) {
  assert(tokenSet, 'requires access token set'); 
  assert(tokenSet.access_token, 'requires access token'); 
  assert(startTime, 'requires start time');
  assert(endTime, 'requires end time');

  const startDateString = dexcomifyEpochTime(startTime);
  const endDateString   = dexcomifyEpochTime(endTime);

  const parameters      = { startDate: startDateString, endDate: endDateString };
  const httpConfig      = { headers: {Authorization:  `Bearer ${tokenSet.access_token}`}, params: parameters };

  const result = await httpClient.get(this.options.apiUri + '/v2/users/self/calibrations', httpConfig);
  let data = result.data;
  if (data && Array.isArray(data.calibrations)) {
    // add fields for milliseconds since epoch, type
    data = data.calibrations.map(el => {
      el.systemEpochTime = Date.parse(el.systemTime);
      el.displayEpochTime = Date.parse(el.displayTime);
      el.type = 'calibrations';
      return el;
    });
  }
 
  return data;
};


