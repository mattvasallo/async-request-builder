# async-request-builder [![Build Status](https://travis-ci.com/mattvasallo/async-request-builder.svg?branch=master)](https://travis-ci.com/mattvasallo/async-request-builder) [![Coverage Status](https://coveralls.io/repos/github/mattvasallo/async-request-builder/badge.svg)](https://coveralls.io/github/mattvasallo/async-request-builder)

AsyncRequestBuilder is a small library that simplifies async requests made in JS. Define all asynchronous requests in JSON format and use async-request-builder to convert that JSON definition file into methods that return promises.  Built to support browser based XHR's and a number of NodeJS async requests like http, mysql, mongo and file reads. Improves code readability, promotes separation of concern and provides built in mocking for test purposes.

e.g. The following XHR JSON contract:

```json
{
  "getXHRData": {
    "asyncModule": "xhr",
    "operationDetails": {
      "url": "https://private-857c47-classicmtgradebookservices.apiary-mock.com/progressapp/service/courseInfo/:snapshotId",
      "method": "GET"
    }
  }
}
```

is translated into an object with a getXHRData method that returns a promise.  It also lets the caller of the method pass params.

The call would look like:

```js
asyncLayer.getXHRData({params:{snapshotId: 4}}).then(data => {
    console.log('got xhr data -> ',data );
});
```

## Table of Contents

- [Setup](#setup)
- [Running Local Examples](#running-local-examples)
- [Using This Library](#using-this-library)

### Setup

Run the following commands:

```sh
npm install
npm run build
```



### Running Local Examples

Browser:
&nbsp; Open example.html and watch console output


### Using This Library

Coming soon....

### Todos
- 90% code coverage
- http PUT, POST, & DELETE  
- async-modules format validation
