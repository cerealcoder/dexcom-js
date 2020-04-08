'use strict';


//***********
//* Modules *
//***********

const assert    = require('assert');
const Validator = require('jsonschema').Validator;
const schema    = require('./schema.js');


//*********************
//* Private Variables *
//*********************

/**
 * The user of this package is responsible for defining the Dexcom access options. You can obtain the client ID,
 * client secret, and redirect URI from the Dexcom developer's web site at the following URL:
 * https://developer.dexcom.com/user/me/apps
 *
 * The API URI will either be for Sandbox data (see https://developer.dexcom.com/sandbox-data), or production
 * data (see https://developer.dexcom.com/endpoint-overview).
 */
let options = {
  clientId:     '',
  clientSecret: '',
  redirectUri:  '',
  apiUri:       'https://sandbox-api.dexcom.com',
};


//*************
//* Functions *
//*************

function set(newOptions) {
  validate(newOptions);
  options = newOptions;
}

function get() {
  return options;
}

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
function validate(options) {
  assert(options, 'options must be provided');

  const validator       = new Validator();
  const validatorResult = validator.validate(options, schema.packageOptions);
  assert(validatorResult.valid, 'options must be valid');
}


//**************
//* Public API *
//**************

exports.set = set;
exports.get = get;
