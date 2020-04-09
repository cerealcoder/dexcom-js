- [Dexcom API](#dexcom-api)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
  * [Configuration](#configuration)
  * [Determine if estimated glucose values exist for the previous 24 hours](#determine-if-estimated-glucose-values-exist-for-the-previous-24-hours)
  * [Get estimated glucose values for the previous 24 hours](#get-estimated-glucose-values-for-the-previous-24-hours)
- [API](#api)
  * [setOptions](#setOptions)
  * [getSandboxAuthenticationToken](#getSandboxAuthenticationToken)
  * [getEstimatedGlucoseValues](getEstimatedGlucoseValues)
- [Testing](#testing)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>


# Dexcom API
An API that provides access to the [developer.dexcom](https://developer.dexcom.com/overview) platform for acquiring 
Continuous Glucose Monitoring (CGM) data. The primary responsibility of this API is to provide a mechanism for a client
to access Dexcom user data without having to use an HTTP interface. This API provides the following services:

* Access to all the developer.dexcom endpoints
* Automatic refreshing of Dexcom OAuth tokens

Since the Dexcom infrastructure does not support CORS, this package is suitable only for server-side systems. If you
try to use this module from within a web application, the user's web browser will generate a CORS violation exception.

# Installation
`npm install @umlss/dexcom-js --save`

# Basic Usage
Users of this package are responsible for [acquiring Dexcom OAuth tokens](https://developer.dexcom.com/authentication) 
and packing those tokens within an object that is passed to most of this package's functions:

```
{
  timestamp: epochMilliseconds,
  dexcomOAuthToken: {
    access_token:  'your access token',
    expires_in:    timeToLiveInSeconds,
    token_type:    'Bearer',
    refresh_token: 'your refresh token'
  }
}

```

where

* `timestamp` is time, in epoch milliseconds (UTC), at which the Dexcom OAuth token was acquired
* `dexcomOAuthToken` is the Dexcom OAuth object issued by Dexcom

After the user has obtained the initial value of the Dexcom OAuth tokens, this package will be responsible for
refreshing the OAuth tokens when the API functions are invoked.

If the object returned by a function in this package contains a property named `oauthTokens`, then the function
automatically refreshed the OAuth tokens. In that case, the user is responsible for saving the value of `oauthTokens`
and using the new value of that object as an argument to subsequent function calls.

## Configuration
Prior to using any of this package's functions (other than function `setOptions()`), the user must specify the
properties that provide access to the Dexcom platform:

```
const DexcomJS = require('@umlss/dexcom-js');

DexcomJS.setOptions({
  clientId:     'your application client identifier',
  clientSecret: 'your application client secret',
  redirectUri:  'your application redirect uniform resource identifier',
  apiUri:       'https://api.dexcom.com',
});
```

## Determine if estimated glucose values exist for the previous 24 hours
The following example code illustrates how to use the `getStatistics()` function to determine if there are any
estimated glucose values over the previous 24-hour period of time:
```
const secondsPerDay         = 86400;
const millisecondsPerSecond = 1000;

const oauthTokens = {
  timestamp: epochMilliseconds,
  dexcomOAuthToken: {
    access_token:  'your access token',
    expires_in:    timeToLiveInSeconds,
    token_type:    'Bearer',
    refresh_token: 'your refresh token'
  }
}

const endDate   = new Date().getTime();
const startDate = endDate - (secondsPerDay * millisecondsPerSecond); 

const results = await DexcomJS.getStatistics(oauthTokens, startDate, endDate);

if (('statistics' in results) && results.statistics.nValues) {
  // Do whatever is appropriate...
}

if ('oauthTokens' in results) {
  // Store the new OAuth tokens...
}
```

## Get estimated glucose values for the previous 24 hours
The following example code illustrates how to use the `getEstimatedGlucoseValues()` function to obtain data samples
that were collected over the previous 24-hour period of time:
```
const secondsPerDay = 86400;
const millisecondsPerSecond = 1000;

const oauthTokens = {
  timestamp: epochMilliseconds,
  dexcomOAuthToken: {
    access_token:  'your access token',
    expires_in:    timeToLiveInSeconds,
    token_type:    'Bearer',
    refresh_token: 'your refresh token'
  }
}

const endDate   = new Date().getTime();
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

`setOptions(options)`

Sets the options that will be used when refreshing an expired OAuth 2.0 access token. 

Argument `options` is an object that contains the following properties:

| Property Name   | Property Type | Description                                                                                      |
| --------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `clientId`      | String        | The client ID that was issued by Dexcom for your application.                                    |
| `clientSecret`  | String        | The client secret that was issued by Dexcom for your application.                                |
| `redirectUri`   | String        | The redirect URI that Dexcom will use after the user completes the OAuth authentication process. |
| `apiUri`        | String        | The URI that will be used for accessing the Dexcom platform (typically `https://api.dexcom.com`) |

Note that the `redirectUri` property will not be accessed by Dexcom's systems as part of using this package. It is used
by the Dexcom API during the process of refreshing an expired access token.


## getSandboxAuthenticationToken

`getSandboxAuthenticationToken(authcode)`

Obtains a Dexcom OAuth 2.0 access token for the Dexcom "sandbox" data.

Argument `authcode` is a String that may be any of the following values:

* `authcode1`
* `authcode2`
* `authcode3`
* `authcode4`
* `authcode5`
* `authcode6`

The return value is a Promise that wraps an Object with the following properties:

```
{
  "timestamp": epochMilliseconds,
  "dexcomOAuthToken": {
    "access_token": "your access token",
    "expires_in": timeToLiveInSeconds,
    "token_type": "Bearer",
    "refresh_token": "your refresh token"
  }
}
```


## getEstimatedGlucoseValues

`getEstimatedGlucoseValues(oauthTokens, startTime, endTime)`

Obtains the estimated glucose values for the time range specified by arguments `startDate` and `endDate`. 

Argument `oauthTokens` is an Object that contains the following properties:

```
{
  "timestamp": epochMilliseconds,
  "dexcomOAuthToken": {
    "access_token": "your access token",
    "expires_in": timeToLiveInSeconds,
    "token_type": "Bearer",
    "refresh_token": "your refresh token"
  }
}
```

Arguments `startDate` and `endDate` are integer Numbers in the epoch milliseconds (UTC) format.

The return value is a Promise that wraps an Object with the following properties:

```
{
  estimatedGlucoseValues: {<object returned by Dexcom API>},
  oauthTokens: {
    "timestamp": epochMilliseconds,
    "dexcomOAuthToken": {
      "access_token": "your access token",
      "expires_in": timeToLiveInSeconds,
      "token_type": "Bearer",
      "refresh_token": "your refresh token"
    }
  }
}
```

See also [https://developer.dexcom.com/get-egvs](https://developer.dexcom.com/get-egvs)

If argument `oauthTokens.dexcomOAuthToken.access_token` has expired, then property `oauthTokens`
in the return value will exist. Otherwise, property `oauthTokens` will not exist in the return value.


# Testing
All unit tests for this package are contained within the `test` directory. They are run within a Docker container,
either interactively (via the Docker container's bash shell), or non-interactively. Furthermore, the unit tests
interact with the Dexcom [sandbox](https://developer.dexcom.com/sandbox-data), thus requiring a network connection in 
order to function properly.

1. Create file `test/secrets.yml`.<br>
   Do not commit that file to this, or any other repository, since it contains confidential information.<br>
   The contents of the file should look similar to the following:
   
        clientId:     'your client ID'
        clientSecret: 'your client secret'
        redirectUri:  'your redirect URI'
        apiUri:       'https://sandbox-api.dexcom.com'
   
   The values in this file will be provided by your Dexcom [My Apps](https://developer.dexcom.com/user/me/apps) page.

1. Run the test suite.<br>
   Interactively:
   1. Invoke the Docker container's bash shell:
   
            cd test
            docker-compose run datatest /bin/bash
         
   1. Run the unit tests:
   
            cd /home/test
            npm install
            cd test
            npm install
            npm test helpers.js
            npm test index.js

   Non-interactively:

        docker-compose run datatest
