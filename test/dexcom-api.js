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

test('Verify we can obtain estimated glucose values for SandboxUser2', async function (t) {
  // @see https://developer.dexcom.com/sandbox-data
  // @see https://www.epochconverter.com/
  const startTime = 1447858800000; // 2015-11-18T15:00:00
  const endTime   = 1447862400000; // 2015-11-18T16:00:00

  const oauthTokens = await DexcomJS.getSandboxAuthenticationToken('authcode2');
  const result      = await DexcomJS.getEstimatedGlucoseValues(oauthTokens, startTime, endTime);

  t.ok('estimatedGlucoseValues' in result,                        'result contains estimatedGlucoseValues');
  t.ok('unit'                   in result.estimatedGlucoseValues, 'result.estimatedGlucoseValues contains unit');
  t.ok('rateUnit'               in result.estimatedGlucoseValues, 'result.estimatedGlucoseValues contains rateUnit');
  t.ok('egvs'                   in result.estimatedGlucoseValues, 'result.estimatedGlucoseValues contains egvs');
  t.ok(Array.isArray(result.estimatedGlucoseValues.egvs),         'result.estimatedGlucoseValues.egvs is an array');

  // Since the authorization tokens have not expired, we do not expect any new tokens to be returned.
  t.ok(!('oauthTokens' in result), 'result does not contain oauthTokens');
});

test('Verify we can obtain events for SandboxUser2', async function (t) {
  // @see https://developer.dexcom.com/sandbox-data
  // @see https://www.epochconverter.com/
  const startTime = 1447858800000; // 2015-11-18T15:00:00
  const endTime   = 1447862400000; // 2015-11-18T16:00:00

  const oauthTokens = await DexcomJS.getSandboxAuthenticationToken('authcode2');
  const results     = await DexcomJS.getEvents(oauthTokens, startTime, endTime);

  t.ok('events' in results,        'results contains events');
  t.ok('events' in results.events, 'results.events contains events');

  t.ok(Array.isArray(results.events.events), 'results.events.events is an array');

  // Since the authorization tokens have not expired, we do not expect any new tokens to be returned.
  t.ok(!('oauthTokens' in results), 'results does not contain oauthTokens');
});

test('Verify we can obtain data range statistics for SandboxUser2', async function (t) {
  const oauthTokens = await DexcomJS.getSandboxAuthenticationToken('authcode2');
  const results     = await DexcomJS.getDataRange(oauthTokens);

  t.ok('dataRange'    in results,           'results contains dataRange');
  t.ok('calibrations' in results.dataRange, 'results.dataRange contains calibrations');
  t.ok('egvs'         in results.dataRange, 'results.dataRange contains egvs');
  t.ok('events'       in results.dataRange, 'results.dataRange contains events');

  // Since the authorization tokens have not expired, we do not expect any new tokens to be returned.
  t.ok(!('oauthTokens' in results), 'results does not contain oauthTokens');
});

test('Verify we can obtain calibration events for SandboxUser2', async function (t) {
  // @see https://developer.dexcom.com/sandbox-data
  // @see https://www.epochconverter.com/
  const startTime = 1447804800000; // 2015-11-18T00:00:00
  const endTime   = 1447891199000; // 2015-11-18T23:59:59

  const oauthTokens = await DexcomJS.getSandboxAuthenticationToken('authcode2');
  const results     = await DexcomJS.getCalibrations(oauthTokens, startTime, endTime);

  t.ok('calibrations' in results,              'results contains calibrations');
  t.ok('calibrations' in results.calibrations, 'results.calibrations contains calibrations');

  t.ok(Array.isArray(results.calibrations.calibrations), 'results.calibrations.calibrations is an array');

  // Since the authorization tokens have not expired, we do not expect any new tokens to be returned.
  t.ok(!('oauthTokens' in results), 'results does not contain oauthTokens');
});

/*
 * XXX very long test, probably not needed
test('Verify we can obtain estimated glucose values for SandboxUser2 for an entire available date range', async function (t) {

  const oauthTokens = await DexcomJS.getSandboxAuthenticationToken('authcode2');
  const dataRange   = await DexcomJS.getDataRange(oauthTokens);

  const startTime = new Date(dataRange.dataRange.egvs.start.systemTime).getTime();
  const endTime   = new Date(dataRange.dataRange.egvs.end.systemTime).getTime();

  const result    = await DexcomJS.getEstimatedGlucoseValuesAnyDateRange(oauthTokens, startTime, endTime);


  t.ok('estimatedGlucoseValues' in result,                        'result contains estimatedGlucoseValues');
  t.ok('unit'                   in result.estimatedGlucoseValues, 'result.estimatedGlucoseValues contains unit');
  t.ok('rateUnit'               in result.estimatedGlucoseValues, 'result.estimatedGlucoseValues contains rateUnit');
  t.ok('egvs'                   in result.estimatedGlucoseValues, 'result.estimatedGlucoseValues contains egvs');
  t.ok(Array.isArray(result.estimatedGlucoseValues.egvs),         'result.estimatedGlucoseValues.egvs is an array');
  t.ok(result.estimatedGlucoseValues.egvs.length > 250000,       'result.estimatedGlucoseValues.egvs.length is > 250000');

  // Since the authorization tokens have not expired, we do not expect any new tokens to be returned.
  t.ok(!('oauthTokens' in result), 'result does not contain oauthTokens');
});
*/


test('Verify we can obtain summary statistics for SandboxUser2', async function (t) {
  // @see https://developer.dexcom.com/sandbox-data
  // @see https://www.epochconverter.com/
  const startTime = 1447804800000; // 2015-11-18T00:00:00
  const endTime   = 1447891199000; // 2015-11-18T23:59:59

  const oauthTokens = await DexcomJS.getSandboxAuthenticationToken('authcode2');
  const results     = await DexcomJS.getStatistics(oauthTokens, startTime, endTime);

  t.ok('statistics'            in results,            'results contains statistics');
  t.ok('hypoglycemiaRisk'      in results.statistics, 'results.statistics contains hypoglycemiaRisk');
  t.ok('min'                   in results.statistics, 'results.statistics contains min');
  t.ok('max'                   in results.statistics, 'results.statistics contains max');
  t.ok('mean'                  in results.statistics, 'results.statistics contains mean');
  t.ok('median'                in results.statistics, 'results.statistics contains median');
  t.ok('variance'              in results.statistics, 'results.statistics contains variance');
  t.ok('stdDev'                in results.statistics, 'results.statistics contains stdDev');
  t.ok('sum'                   in results.statistics, 'results.statistics contains sum');
  t.ok('q1'                    in results.statistics, 'results.statistics contains q1');
  t.ok('q2'                    in results.statistics, 'results.statistics contains q2');
  t.ok('q3'                    in results.statistics, 'results.statistics contains q3');
  t.ok('utilizationPercent'    in results.statistics, 'results.statistics contains utilizationPercent');
  t.ok('meanDailyCalibrations' in results.statistics, 'results.statistics contains meanDailyCalibrations');
  t.ok('nDays'                 in results.statistics, 'results.statistics contains nDays');
  t.ok('nValues'               in results.statistics, 'results.statistics contains nValues');
  t.ok('nUrgentLow'            in results.statistics, 'results.statistics contains nUrgentLow');
  t.ok('nBelowRange'           in results.statistics, 'results.statistics contains nBelowRange');
  t.ok('nWithinRange'          in results.statistics, 'results.statistics contains nWithinRange');
  t.ok('nAboveRange'           in results.statistics, 'results.statistics contains nAboveRange');
  t.ok('percentUrgentLow'      in results.statistics, 'results.statistics contains percentUrgentLow');
  t.ok('percentBelowRange'     in results.statistics, 'results.statistics contains percentBelowRange');
  t.ok('percentWithinRange'    in results.statistics, 'results.statistics contains percentWithinRange');
  t.ok('percentAboveRange'     in results.statistics, 'results.statistics contains percentAboveRange');

  // Since the authorization tokens have not expired, we do not expect any new tokens to be returned.
  t.ok(!('oauthTokens' in results), 'results does not contain oauthTokens');
});
