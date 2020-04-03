- [Dexcom API](#dexcom-api)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
  * [Configuration](#configuration)
  * [Determine if estimated glucose values exist](#determine-if-estimated-glucose-values-exist)
  * [Get estimated glucose values](#get-estimated-glucose-values)
- [API](#api)
  * [setOptions](#setoptions)
  * [doEstimatedGlucoseValuesExist](#doestimatedglucosevaluesexist)
  * [getEstimatedGlucoseValues](#getestimatedglucosevalues)
- [Testing](#testing)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>


# Dexcom API
An API that provides access to the [developer.dexcom](https://developer.dexcom.com/overview) platform for acquiring 
Continuous Glucose Monitoring (CGM) data. The primary responsibility of this API is to provide a mechanism for a client
to access Dexcom user data without having to use an HTTP interface. This API provides the following services:

* An indication if estimated glucose values exist for a given date range
* The acquisition of estimated glucose values for a given date range

Since the Dexcom infrastructure does not support CORS, this package is suitable only for server-side systems. If you
try to use this module from within a web application, the user's web browser will generate a CORS violation exception.

# Installation
`npm install @umlss/dexcom-js --save`

# Basic Usage

## Configuration
```
const DexcomJS = require('@umlss/dexcom-js');

DexcomJS.setOptions({
  clientId: 'your application client identifier',
  clientSecret: 'your application client secret',
  redirectUri: 'your application redirect uniform resource identifier',
});
```

## Determine if estimated glucose values exist for the previous 24 hours
```
const secondsPerDay = 86400;
const millisecondsPerSecond = 1000;

const oauthTokens = {
  accessToken: 'your access token',
  refreshToken: 'your refresh token',
};

const endDate = new Date().getTime();
const startDate = endDate - (secondsPerDay * millisecondsPerSecond); 

const results = await DexcomJS.doEstimatedGlucoseValuesExist(oauthTokens, startDate, endDate);

if (results.estimatedGlucoseValuesExist) {
  // Do whatever is appropriate to do since estimated glucose values exist...
}

if (oauthTokens in results) {
  // Store the new OAuth access and refresh tokens...
}
```

## Get estimated glucose values for the previous 24 hours
```
const secondsPerDay = 86400;
const millisecondsPerSecond = 1000;

const oauthTokens = {
  accessToken: 'your access token',
  refreshToken: 'your refresh token',
};

const endDate = new Date().getTime();
const startDate = endDate - (secondsPerDay * millisecondsPerSecond); 

const results = await DexcomJS.getEstimatedGlucoseValues(oauthTokens, startDate, endDate);

if (estimatedGlucoseValues in results) {
  // Process the estimated glucose values
  results.estimatedGlucoseValues.egvs.forEach(item => {
    // See https://developer.dexcom.com/get-egvs
  });
}

if (oauthTokens in results) {
  // Store the new OAuth access and refresh tokens...
}
```

# API

## setOptions
Sets the options that will be used when refreshing an expired OAuth 2.0 access token. 

The input argument to this function is an object that contains the following properties:

| Property Name   | Property Type | Description                                                                                      |
| --------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `clientId`      | String        | The client ID that was issued by Dexcom for your application.                                    |
| `clientSecret`  | String        | The client secret that was issued by Dexcom for your application.                                |
| `redirectUri`   | String        | The redirect URI that Dexcom will use after the user completes the OAuth authentication process. |

Note that the redirect URI argument will not be access by Dexcom's systems as part of using this package. It is used
by the Dexcom API during the process of refreshing an expired access token.


## doEstimatedGlucoseValuesExist
An asynchronous function that indicates if the Dexcom system contains *any* estimated glucose values for the date range 
specified by arguments `startDate` and `endDate`. 

The input arguments to this function are described in the following table:

| Argument Name   | Argument Type | Description                                                                                                                                                                                                                      |
| --------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `oauthTokens`   | Object        | An object that contains the following String properties: <ul><li>`accessToken`<br>The OAuth 2.0 access token that was issued by Dexcom</li><li>`refreshToken`<br>The OAuth 2.0 refresh token that was issued by Dexcom</li></ul> |
| `startDate`     | Number        | The time, in epoch milliseconds, that represents the beginning of the date range.                                                                                                                                                |
| `endDate`       | Number        | The time, in epoch milliseconds, that represents the end of the date range.                                                                                                                                                      |

The value returned by this function is an Object that contains the following properties:

| Property Name                 | Property Type | Description                                                                                                                                                                                                                      |
| ----------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `estimatedGlucoseValuesExist` | Boolean       | True if the Dexcom system contains any estimated glucose values for the caller-specified date range, false otherwise.                                                                                                            |
| `oauthTokens`                 | Object        | An object that contains the following String properties: <ul><li>`accessToken`<br>The OAuth 2.0 access token that was issued by Dexcom</li><li>`refreshToken`<br>The OAuth 2.0 refresh token that was issued by Dexcom</li></ul> |

If the access token passed in via argument `oauthTokens` was expired and need to be refreshed, then property `oauthTokens`
in the return value will exist. Otherwise, property `oauthTokens` will not exist in the return value.

## getEstimatedGlucoseValues
An asynchronous function that obtains estimated glucose values for the date range specified by arguments `startDate`
and `endDate`. 

The input arguments to this function are described in the following table:

| Argument Name   | Argument Type | Description                                                                                                                                                                                                                      |
| --------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `oauthTokens`   | Object        | An object that contains the following String properties: <ul><li>`accessToken`<br>The OAuth 2.0 access token that was issued by Dexcom</li><li>`refreshToken`<br>The OAuth 2.0 refresh token that was issued by Dexcom</li></ul> |
| `startDate`     | Number        | The time, in epoch milliseconds, that represents the beginning of the date range.                                                                                                                                                |
| `endDate`       | Number        | The time, in epoch milliseconds, that represents the end of the date range.                                                                                                                                                      |

The value returned by this function is an Object that contains the following properties:

| Property Name            | Property Type | Description                                                                                                                                                                                                                      |
| ------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `estimatedGlucoseValues` | Object        | The object returned by the Dexcom [GET /egvs](https://developer.dexcom.com/get-egvs) endpoint.                                                                                                                                   |
| `oauthTokens`            | Object        | An object that contains the following String properties: <ul><li>`accessToken`<br>The OAuth 2.0 access token that was issued by Dexcom</li><li>`refreshToken`<br>The OAuth 2.0 refresh token that was issued by Dexcom</li></ul> |

If the access token passed in via argument `oauthTokens` was expired and need to be refreshed, then property `oauthTokens`
in the return value will exist. Otherwise, property `oauthTokens` will not exist in the return value.

# Testing
All unit tests for this package are contained within the `test` directory. They are run within a Docker container,
either interactively (via the Docker container's bash shell), or non-interactively. Furthermore, the unit tests
interact with the Dexcom [sandbox](https://developer.dexcom.com/sandbox-data), thus requiring a network connection in 
order to function properly.

1. Create file `test/secrets.yml`.<br>
   Do not commit that file to this, or any other repository, since it contains confidential information.<br>
   The contents of the file should look similar to the following:
   
        clientId: 'your client ID'
        clientSecret: 'your client secret'
        redirectUri: 'your redirect URI'
        apiUri: 'https://sandbox-api.dexcom.com'
   
   The values in this file will be provided by your Dexcom [My Apps](https://developer.dexcom.com/user/me/apps) page.

1. Run the test suite.<br>
   Interactively:
   1. Invoke the Docker container's bash shell:
   
            docker-compose run datatest /bin/bash
         
   1. Run the unit tests:
   
            cd /home/test/test
            npm install
            npm test dexcom.js

   Non-interactively:

        docker-compose run datatest
