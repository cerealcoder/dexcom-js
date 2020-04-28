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
const DexcomJS      = require('../index.js');


//*************
//* Constants *
//*************

const options = yaml.safeLoad(fs.readFileSync('./test/secrets.yml', 'utf8'));
//console.log(options);
DexcomJS.setOptions(options);


//**************
//* Unit Tests *
//**************

test('Verify we can obtain authentication tokens for authcode1, the legacy user identifier for Dexcom sandboxes', async function (t) {
  const oauthTokens = await DexcomJS.getSandboxAuthenticationToken('authcode1');
  // console.log(result);
  //

  t.ok(oauthTokens.timestamp,                      'result contains timestamp');
  t.ok(oauthTokens.dexcomOAuthToken,               'result contains dexcomOAuthToken');
  t.ok(oauthTokens.dexcomOAuthToken.access_token,  'result contains dexcomOAuthToken.access_token');
  t.ok(oauthTokens.dexcomOAuthToken.expires_in,    'result contains dexcomOAuthToken.expires_in');
  t.ok(oauthTokens.dexcomOAuthToken.token_type,    'result contains dexcomOAuthToken.token_type');
  t.ok(oauthTokens.dexcomOAuthToken.refresh_token, 'result contains dexcomOAuthToken.refresh_token');
});

test('Verify we can obtain authentication tokens for SandboxUser2', async function (t) {
  const oauthTokens = await DexcomJS.getSandboxAuthenticationToken('SandboxUser2');
  // console.log(result);

  t.ok(oauthTokens.timestamp,                      'result contains timestamp');
  t.ok(oauthTokens.dexcomOAuthToken,               'result contains dexcomOAuthToken');
  t.ok(oauthTokens.dexcomOAuthToken.access_token,  'result contains dexcomOAuthToken.access_token');
  t.ok(oauthTokens.dexcomOAuthToken.expires_in,    'result contains dexcomOAuthToken.expires_in');
  t.ok(oauthTokens.dexcomOAuthToken.token_type,    'result contains dexcomOAuthToken.token_type');
  t.ok(oauthTokens.dexcomOAuthToken.refresh_token, 'result contains dexcomOAuthToken.refresh_token');
});

