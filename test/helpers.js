/**
 * The tests in this file are unit tests for the functions provided by ../helpers.js.
 */

'use strict';


//***********
//* Modules *
//***********

const tape    = require('tape');
const _test   = require('tape-promise').default; // <---- notice 'default'
const test    = _test(tape); // decorate tape
const helpers = require('../helpers.js');


//**************
//* Unit Tests *
//**************

test('Verify validateOptions()', function (t) {
  const nullOptions = null;
  const emptyOptions = {};
  const emptyProperties = {
    clientId:     '',
    clientSecret: '',
    redirectUri:  '',
    apiUri:       ''
  };
  const invalidRedirectUri = {
    clientId:     'jitzdjgkgzocbygphnzgpgeibqrybaxj',
    clientSecret: 'dnnukiodacexkmum',
    redirectUri:  'not a URI',
    apiUri:       'https://api.dexcom.com'
  };
  const invalidApiUri = {
    clientId:     'jitzdjgkgzocbygphnzgpgeibqrybaxj',
    clientSecret: 'dnnukiodacexkmum',
    redirectUri:  'https://foo.bar.com',
    apiUri:       'not a URI'
  };
  const clientIdIsTooLong = {
    clientId:     'This client ID is too long and should be rejected.',
    clientSecret: 'dnnukiodacexkmum',
    redirectUri:  'https://foo.bar.com',
    apiUri:       'https://api.dexcom.com'
  };
  const clientSecretIsTooLong = {
    clientId:     'jitzdjgkgzocbygphnzgpgeibqrybaxj',
    clientSecret: 'This client secret is too long and should be rejected',
    redirectUri:  'https://foo.bar.com',
    apiUri:       'https://api.dexcom.com'
  };
  const validProperties = {
    clientId:     'jitzdjgkgzocbygphnzgpgeibqrybaxj',
    clientSecret: 'dnnukiodacexkmum',
    redirectUri:  'https://foo.bar.com',
    apiUri:       'https://api.dexcom.com'
  };

  t.throws(() => {helpers.validateOptions(nullOptions);},           'null options are rejected.');
  t.throws(() => {helpers.validateOptions(emptyOptions);},          'empty options are rejected.');
  t.throws(() => {helpers.validateOptions(emptyProperties);},       'empty properties are rejected.');
  t.throws(() => {helpers.validateOptions(invalidRedirectUri);},    'invalid redirect URI is rejected.');
  t.throws(() => {helpers.validateOptions(invalidApiUri);},         'invalid API URI is rejected.');
  t.throws(() => {helpers.validateOptions(clientIdIsTooLong);},     'too-long client ID is rejected.');
  t.throws(() => {helpers.validateOptions(clientSecretIsTooLong);}, 'too-long client secret is rejected.');

  t.doesNotThrow(() => {helpers.validateOptions(validProperties);}, 'valid properties are accepted');

  t.end();
});

test('Verify dexcomifyEpochTime()', function (t) {
  const epochMilliseconds = 1586101155000;
  const actual            = helpers.dexcomifyEpochTime(epochMilliseconds);
  const expected          = '2020-04-05T15:39:15';

  t.equal(actual, expected, 'Dexcom time representation is valid.');

  t.end();
});

test('Verify validateTimeWindow()', function (t) {
  const t0 = -1;
  const t1 = 1;
  const t2 = 2;

  t.throws(() => {helpers.validateTimeWindow(null, null);}, 'null arguments are rejected.');
  t.throws(() => {helpers.validateTimeWindow(t2, t1);},     'startTime > endTime is rejected.');
  t.throws(() => {helpers.validateTimeWindow(t0, t1);},     'negative startTime is rejected.');
  t.throws(() => {helpers.validateTimeWindow(t1, t0);},     'negative endTime is rejected.');

  t.doesNotThrow(() => {helpers.validateTimeWindow(t1, t2);}, 'startTime > endTime is accepted.');

  t.end();
});

test('Verify validateOAuthTokens()', function (t) {
  const noTimestamp = {
    dexcomOAuthToken: {
      access_token:  'some opaque access token',
      expires_in:    7200,
      token_type:    'Bearer',
      refresh_token: 'some opaque refresh token',
    }
  };
  const negativeTimestamp = {
    timestamp: -1,
    dexcomOAuthToken: {
      access_token:  'some opaque access token',
      expires_in:    7200,
      token_type:    'Bearer',
      refresh_token: 'some opaque refresh token',
    }
  };
  const emptyDexcomTokenProperties = {
    timestamp: 10000,
    dexcomOAuthToken: {
      access_token:  '',
      expires_in:    7200,
      token_type:    '',
      refresh_token: '',
    }
  };
  const missingDexcomTokenProperties = {
    timestamp: 10000,
    dexcomOAuthToken: {
    }
  };
  const validOAuthTokens = {
    timestamp: 10000,
    dexcomOAuthToken: {
      access_token:  'some opaque access token',
      expires_in:    7200,
      token_type:    'Bearer',
      refresh_token: 'some opaque refresh token',
    }
  };

  t.throws(() => {helpers.validateOAuthTokens(null);},                         'null argument is rejected.');
  t.throws(() => {helpers.validateOAuthTokens(noTimestamp);},                  'missing timestamp property is rejected.');
  t.throws(() => {helpers.validateOAuthTokens(negativeTimestamp);},            'negative timestamp property is rejected.');
  t.throws(() => {helpers.validateOAuthTokens(emptyDexcomTokenProperties);},   'empty Dexcom token properties are rejected.');
  t.throws(() => {helpers.validateOAuthTokens(missingDexcomTokenProperties);}, 'missing Dexcom token properties are rejected.');

  t.doesNotThrow(() => {helpers.validateOAuthTokens(validOAuthTokens);}, 'valid OAuth tokens are accepted.');

  t.end();
});
