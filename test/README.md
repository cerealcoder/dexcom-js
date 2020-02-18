# Running Tests

## Create an API secrets file:
do NOT check this file in.  It's in the `.gitignore` so that should be a hard
mistake to make.

Create `test/secrets.yml` file with your API secrets created when you created
or updated your Dexcom developer account:

    clientId: ''
    clientSecret: ''
    redirectUri: ''
    apiUri: 'https://sandbox-api.dexcom.com'


## Running interactively
Run the following command

    docker-compose run datatest /bin/bash

Then inside the interactive docker bash shell:

    cd /home/test/test
    npm install
    npm test <name of test file>

## Running complete test suite once
Run the following command

    docker-compose run datatest
