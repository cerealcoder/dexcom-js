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
const util          = require('util');
const fs            = require('fs');
const DexcomJS      = require('../index.js');


//*************
//* Constants *
//*************

const options = yaml.safeLoad(fs.readFileSync('./test/secrets.yml', 'utf8'));
//console.log(options);
DexcomJS.setOptions(options);


test('Verify we can obtain data range statistics for SandboxUser2 followd by last weeks of data', async function (t) {
  const oauthTokens = await DexcomJS.getSandboxAuthenticationToken('authcode2');
  const results     = await DexcomJS.getDataRange(oauthTokens);

  t.ok('dataRange'    in results,           'results contains dataRange');
  t.ok('calibrations' in results.dataRange, 'results.dataRange contains calibrations');
  t.ok('egvs'         in results.dataRange, 'results.dataRange contains egvs');
  t.ok('events'       in results.dataRange, 'results.dataRange contains events');

  console.log(util.inspect(results,false,4));

  // Since the authorization tokens have not expired, we do not expect any new tokens to be returned.
  t.ok(!('oauthTokens' in results), 'results does not contain oauthTokens');


  const endDate = new Date(results.dataRange.egvs.end.systemTime);
  const startDate = new Date(results.dataRange.egvs.start.systemTime);
  //const endDate = new Date();
  const dayRangedFetchTimes = DexcomJS.rangeInDayIntervals(results.dataRange.egvs, endDate.getTime(), 7);
  t.ok(dayRangedFetchTimes.valid, 'should have goten a valid interval going back a week from the end');

  const result = await DexcomJS.getEstimatedGlucoseValues(oauthTokens, dayRangedFetchTimes.startTime, dayRangedFetchTimes.endTime);
  const egvs = result.estimatedGlucoseValues.egvs;
  //console.log(egvs[0]);
  //console.log(egvs[egvs.length -1]);

  const groupedByDay = DexcomJS.shardEgvsByDay(egvs);
  //console.log(groupedByDay);
  console.log(Object.keys(groupedByDay));
  t.equal(Object.keys(groupedByDay).length, 8, 'going back a week to midnight prior to last day should give us 8 days of data');
  const daysInEpochMillisec = Object.keys(groupedByDay).map(el => { 
    //console.log(el);
    //console.log(new Date(parseInt(el)));
    return new Date(parseInt(el)).getTime();
  });
  console.log(daysInEpochMillisec);
  daysInEpochMillisec.forEach((el, idx) => {
    t.ok(Number.isInteger(el), `el ${idx} is a date integer`);
  });

  //
  // ensure we don't got past the beginning
  const earlyFetchTimes = DexcomJS.rangeInDayIntervals(results.dataRange.egvs, startDate.getTime() + 86400 * 6 * 1000, 7);
  t.ok(earlyFetchTimes.valid, 'should have goten a valid interval going back a week from beginning + 6 days');
  const beginData = await DexcomJS.getEstimatedGlucoseValues(oauthTokens, earlyFetchTimes.startTime, earlyFetchTimes.endTime);
  const beginEgvs = beginData.estimatedGlucoseValues.egvs;
  const beginGroupedByDay = DexcomJS.shardEgvsByDay(beginEgvs);
  console.log(beginGroupedByDay);
  t.equal(Object.keys(beginGroupedByDay).length, 7, 'going a week back to midnight before valid start date gets 7 days of data');

});
