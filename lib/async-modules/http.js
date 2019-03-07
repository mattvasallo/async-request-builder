const http = require('http');


function smartURIEncodeParam(data, paramName) {
    let value = data[paramName];
    if (Object.prototype.toString.call(value) === '[object Object]' && !Array.isArray(value)) {
        console.warn("value for '" + paramName + "' cannot be URI-encoded because it is an object");
        value = "";
    }
    if (value === undefined || value === null) {
        console.warn("null value for '" + paramName + "' treated as empty string");
        value = "";
    }
    return encodeURIComponent(value);
}

function replacePathParams(url, params) {
    if (params) {
        Object.keys(params).forEach(paramName => {
            url = url.replace(':' + paramName, smartURIEncodeParam(params, paramName));
        });
    }
    return url;
}

exports.name = "http";

exports.getAsyncFn = function(operationDetails, parentOperationDetails, globals) {
    let prefixType = operationDetails.prefixType || "default",
        urlPrefix = globals.prefixes && globals.prefixes[prefixType] || "";

    let fullPath = urlPrefix + operationDetails.url;

    let pathNoProtocol = fullPath.replace(/^\w+:\/\//, '');
    let pathOnly = pathNoProtocol.slice(pathNoProtocol.indexOf('/'));
    let hostAndPortArray = pathNoProtocol.slice(0, pathNoProtocol.indexOf('/')).split(':');
    let host = hostAndPortArray[0];
    let port = hostAndPortArray[1];

    if (globals.params) {
        pathOnly = replacePathParams(pathOnly, globals.params);
    }

    function sendHttpRequest(requestObject) {
        const params = requestObject && requestObject.params;

        let options = {
            hostname: host,
            port: port,
            path: replacePathParams(pathOnly, params),
            method: operationDetails.method,
            headers: operationDetails.headers
        };

        sendHttpRequest.lastReqURL = options.path;

        return new Promise((resolve, reject) => {
            let rawData = "";

            let req = http.request(options, (res) => {
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        resolve(parsedData);
                    } catch (e) {
                        const errorMessage = "problem parsing json response: " + e.message;
                        console.error(errorMessage);
                        reject(errorMessage);
                    }
                });
            });

            req.on('error', (e) => {
                const errorMessage = "problem with http request: " + e.message;
                console.error(errorMessage);
                reject(errorMessage);
            });
            req.end();
        });
    }

    sendHttpRequest.url = "http://" + host + ":" + port + pathOnly;
    sendHttpRequest.method = operationDetails.method;
    sendHttpRequest.expectedResponse = operationDetails.expectedResponse;

    return sendHttpRequest;
};