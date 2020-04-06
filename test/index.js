/**
 * Unit tests for the functions provided by module ../helpers.js.
 */

'use strict';


//***********
//* Modules *
//***********

const tape          = require('tape');
const _test         = require('tape-promise').default; // <---- notice 'default'
const test          = _test(tape); // decorate tape
const yaml          = require('js-yaml');
const fs            = require('fs');
const unitUnderTest = require('../index.js');


//*************
//* Constants *
//*************

const options = yaml.safeLoad(fs.readFileSync('secrets.yml', 'utf8'));
//console.log(options);
unitUnderTest.setOptions(options);


//**************
//* Unit Tests *
//**************

test('Verify we can obtain authentication tokens for SandboxUser1', async function (t) {
  const oauthTokens = await unitUnderTest.getSandboxAuthenticationToken('authcode1');
  // console.log(result);

  t.ok(oauthTokens.timestamp,                      'result contains timestamp');
  t.ok(oauthTokens.dexcomOAuthToken,               'result contains dexcomOAuthToken');
  t.ok(oauthTokens.dexcomOAuthToken.access_token,  'result contains dexcomOAuthToken.access_token');
  t.ok(oauthTokens.dexcomOAuthToken.expires_in,    'result contains dexcomOAuthToken.expires_in');
  t.ok(oauthTokens.dexcomOAuthToken.token_type,    'result contains dexcomOAuthToken.token_type');
  t.ok(oauthTokens.dexcomOAuthToken.refresh_token, 'result contains dexcomOAuthToken.refresh_token');
});

test('Verify we can obtain estimated glucose values for SandboxUser2', async function (t) {
  // @see https://developer.dexcom.com/sandbox-data
  // @see https://www.epochconverter.com/
  const startTime = 1447858800000; // 2015-11-18T15:00:00
  const endTime   = 1447862400000; // 2015-11-18T16:00:00

  const oauthTokens = await unitUnderTest.getSandboxAuthenticationToken('authcode2');
  const egvs        = await unitUnderTest.getEstimatedGlucoseValues(oauthTokens, startTime, endTime);

  t.ok('estimatedGlucoseValues' in egvs,                        'egvs contains estimatedGlucoseValues');
  t.ok('unit'                   in egvs.estimatedGlucoseValues, 'egvs.estimatedGlucoseValues contains unit');
  t.ok('rateUnit'               in egvs.estimatedGlucoseValues, 'egvs.estimatedGlucoseValues contains rateUnit');
  t.ok('egvs'                   in egvs.estimatedGlucoseValues, 'egvs.estimatedGlucoseValues contains egvs');
  t.ok(Array.isArray(egvs.estimatedGlucoseValues.egvs),         'egvs.estimatedGlucoseValues.egvs is an array');

  // Since the authorization tokens have not expired, we do not expect any new tokens to be returned.
  t.ok(!('oauthTokens' in egvs), 'result does not contain oauthTokens');
});

// test('refresh dexcom token', async function (t) {
//   let tokenSetStart = await unitUnderTest.login();
//   let tokenSetFinal = await unitUnderTest.getTokenSet(tokenSetStart);
//   //console.log(tokenSetFinal);
//   t.ok(tokenSetFinal.access_token, 'tokenSetFinal contains an access token');
//   t.ok(tokenSetFinal.refresh_token, 'tokenSetFinal contains a refresh token');
//   t.ok(tokenSetFinal.decodedAccessToken, 'tokenSetFinal contains a decoded access token');
//
//   tokenSetFinal = await unitUnderTest.getTokenSet(tokenSetStart, true);
//   t.ok(tokenSetFinal.access_token, 'tokenSetFinal contains an access token');
//   t.ok(tokenSetFinal.refresh_token, 'tokenSetFinal contains a refresh token');
//   t.ok(tokenSetFinal.decodedAccessToken, 'tokenSetFinal contains a decoded access token');
// });
//
// test('get dexcom data', async function (t) {
//   const tokenSet = await unitUnderTest.login();
//
//   // for valid dates of sandbox data,
//   // @see https://developer.dexcom.com/sandbox-data
//   const startTime = Date.parse('10 Jul 2015 00:00:00 GMT');
//   const endTime = Date.parse('11 Jul 2015 00:00:00 GMT');
//
//   const data = await unitUnderTest.getData(tokenSet, startTime, endTime);
//   //console.log(data);
//   t.equal(Array.isArray(data), true, 'the returned data is an array');
//   t.ok(data[0].systemEpochTime, 'recent system epoch time');
//   t.ok(data[0].displayEpochTime, 'recent display epoch time');
//   t.equal(data[0].type, 'egvs', 'type is egvs');
// });
//
// test('get dexcom events', async function (t) {
//   const tokenSet = await unitUnderTest.login();
//
//   // for valid dates of sandbox data,
//   // @see https://developer.dexcom.com/sandbox-data
//   const startTime = Date.parse('10 Jul 2015 00:00:00 GMT');
//   const endTime = Date.parse('11 Jul 2015 00:00:00 GMT');
//
//   const data = await unitUnderTest.getEvents(tokenSet, startTime, endTime);
//   //console.log(data);
//   t.equal(Array.isArray(data), true, 'the returned data is an array');
//   t.ok(data[0].systemEpochTime, 'recent system epoch time');
//   t.ok(data[0].displayEpochTime, 'recent display epoch time');
//   t.equal(data[0].type, 'events', 'type is events');
// });
//
// test('get dexcom data range', async function (t) {
//   const tokenSet = await unitUnderTest.login();
//
//   const dataRange = await unitUnderTest.getDataRange(tokenSet);
//   //console.log(dataRange);
//   t.ok(dataRange.calibrations, 'calibration data range exists');
//   t.ok(dataRange.egvs, 'evgs data range exists');
//   t.ok(dataRange.events, 'event data range exists');
//
// });
//
// test('get dexcom calibrations', async function (t) {
//   const tokenSet = await unitUnderTest.login();
//
//   // for valid dates of sandbox data,
//   // @see https://developer.dexcom.com/sandbox-data
//   const startTime = Date.parse('10 Jul 2015 00:00:00 GMT');
//   const endTime = Date.parse('11 Jul 2015 00:00:00 GMT');
//
//   const data = await unitUnderTest.getCalibrations(tokenSet, startTime, endTime);
//   //console.log(data);
//   t.equal(Array.isArray(data), true, 'the returned data is an array');
//   t.ok(data[0].systemEpochTime, 'recent system epoch time');
//   t.ok(data[0].displayEpochTime, 'recent display epoch time');
//   t.equal(data[0].type, 'calibrations', 'type is calibrations');
// });
