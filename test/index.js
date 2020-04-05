'use strict'
const tape = require('tape')
const _test = require('tape-promise').default // <---- notice 'default'
const test = _test(tape) // decorate tape
const yaml = require('js-yaml');
const fs = require('fs');

const dexcom = require('../index.js');

const options = yaml.safeLoad(fs.readFileSync('secrets.yml', 'utf8'));
//console.log(options);
dexcom.setOptions(options);

test('ensure dexcom sandbox login', async function (t) {
  // XXX grab these from a decrypted file, do not check in!
  let result = await dexcom.login();
  // console.log(result);
  t.ok(result.access_token, 'result contains an access token');
  t.ok(result.refresh_token, 'result contains a refresh token');
  t.ok(result.decodedAccessToken, 'result contains a decoded access token');
});

test('refresh dexcom token', async function (t) {
  let tokenSetStart = await dexcom.login();
  let tokenSetFinal = await dexcom.getTokenSet(tokenSetStart);
  //console.log(tokenSetFinal);
  t.ok(tokenSetFinal.access_token, 'tokenSetFinal contains an access token');
  t.ok(tokenSetFinal.refresh_token, 'tokenSetFinal contains a refresh token');
  t.ok(tokenSetFinal.decodedAccessToken, 'tokenSetFinal contains a decoded access token');

  tokenSetFinal = await dexcom.getTokenSet(tokenSetStart, true);
  t.ok(tokenSetFinal.access_token, 'tokenSetFinal contains an access token');
  t.ok(tokenSetFinal.refresh_token, 'tokenSetFinal contains a refresh token');
  t.ok(tokenSetFinal.decodedAccessToken, 'tokenSetFinal contains a decoded access token');
});

test('get dexcom data', async function (t) {
  const tokenSet = await dexcom.login();

  // for valid dates of sandbox data, 
  // @see https://developer.dexcom.com/sandbox-data
  const startTime = Date.parse('10 Jul 2015 00:00:00 GMT');
  const endTime = Date.parse('11 Jul 2015 00:00:00 GMT');

  const data = await dexcom.getData(tokenSet, startTime, endTime);
  //console.log(data);
  t.equal(Array.isArray(data), true, 'the returned data is an array');
  t.ok(data[0].systemEpochTime, 'recent system epoch time');
  t.ok(data[0].displayEpochTime, 'recent display epoch time');
  t.equal(data[0].type, 'egvs', 'type is egvs');
});

test('get dexcom events', async function (t) {
  const tokenSet = await dexcom.login();

  // for valid dates of sandbox data, 
  // @see https://developer.dexcom.com/sandbox-data
  const startTime = Date.parse('10 Jul 2015 00:00:00 GMT');
  const endTime = Date.parse('11 Jul 2015 00:00:00 GMT');

  const data = await dexcom.getEvents(tokenSet, startTime, endTime);
  //console.log(data);
  t.equal(Array.isArray(data), true, 'the returned data is an array');
  t.ok(data[0].systemEpochTime, 'recent system epoch time');
  t.ok(data[0].displayEpochTime, 'recent display epoch time');
  t.equal(data[0].type, 'events', 'type is events');
});

test('get dexcom data range', async function (t) {
  const tokenSet = await dexcom.login();

  const dataRange = await dexcom.getDataRange(tokenSet);
  //console.log(dataRange);
  t.ok(dataRange.calibrations, 'calibration data range exists');
  t.ok(dataRange.egvs, 'evgs data range exists');
  t.ok(dataRange.events, 'event data range exists');

});

test('get dexcom calibrations', async function (t) {
  const tokenSet = await dexcom.login();

  // for valid dates of sandbox data, 
  // @see https://developer.dexcom.com/sandbox-data
  const startTime = Date.parse('10 Jul 2015 00:00:00 GMT');
  const endTime = Date.parse('11 Jul 2015 00:00:00 GMT');

  const data = await dexcom.getCalibrations(tokenSet, startTime, endTime);
  //console.log(data);
  t.equal(Array.isArray(data), true, 'the returned data is an array');
  t.ok(data[0].systemEpochTime, 'recent system epoch time');
  t.ok(data[0].displayEpochTime, 'recent display epoch time');
  t.equal(data[0].type, 'calibrations', 'type is calibrations');
});


