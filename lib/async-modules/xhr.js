const VALID_METHODS = ["GET", "PUT", "POST", "DELETE"];
const URL_ENCODED_CONTENT_TYPE = 'application/x-www-form-urlencoded;charset=utf-8';
const JSON_CONTENT_TYPE = 'application/json;charset=UTF-8';
const FORM_DATA_CONTENT_TYPE = 'multipart/form-data';

const sendXHRPromise = (url, method, headers, payload) => {
    return new Promise((resolve, reject) => {
        const xmlHttpRequest = new XMLHttpRequest();
        //handle bad data
        headers = headers || {};
        xmlHttpRequest.onreadystatechange = () => {
            const done = xmlHttpRequest.readyState === 4;
            let successful;
            let response;
            if (done) {
                try {
                    response = JSON.parse(xmlHttpRequest.responseText);
                } catch (error) {
                    console.info('Response from ' + xmlHttpRequest.responseURL + ' not in json format. Response data set to un-parsed string');
                    response = xmlHttpRequest.responseText;
                }
                successful = ((200 <= xmlHttpRequest.status) && (xmlHttpRequest.status < 400));
                if (successful) {
                    resolve(response);
                } else {
                    reject({
                        data: response,
                        message: response.message || xmlHttpRequest.statusText,
                        reason: response.reason,
                        response: response,
                        status: xmlHttpRequest.status,
                        statusText: xmlHttpRequest.statusText,
                        responseURL: xmlHttpRequest.responseURL
                    });
                }
            }
        };
        xmlHttpRequest.open(method, url, true);
        Object.keys(headers).forEach((headerName) => {
            xmlHttpRequest.setRequestHeader(headerName, headers[headerName]);
        });
        xmlHttpRequest.send(payload);
    });
};

const setDefaultJSONContentType = (method, inputHeaders) => {
    const headers = inputHeaders || {};
    if ((method === 'PUT' || method === 'POST')) {
        if (!headers['Content-Type'] && !headers.enctype) {
            headers['Content-Type'] = JSON_CONTENT_TYPE;
        }
    }
    return headers;
};

const replaceParams = (string, params, skipURIEncoding) => {
    if (params) {
        Object.keys(params).forEach((paramName) => {
            string = string.replace(':' + paramName, smartURIEncodeParam(params, paramName, skipURIEncoding));
        });
    }
    return string;
};

const smartURIEncodeParam = (data, paramName, skipURIEncoding) => {
    let value = data[paramName];
    if (isObject(value) && !Array.isArray(value)) {
        console.warn("value for '" + paramName + "' cannot be URI-encoded because it is an object");
        value = "";
    }
    if (value === undefined || value === null) {
        console.warn("null value for '" + paramName + "' treated as empty string");
        value = "";
    }
    return skipURIEncoding ? value : encodeURIComponent(value);
};

const transformRequestPayload = (headersInput, payload) => {
    let contentType;
    const headers = headersInput || {};
    if (payload !== null && payload !== undefined) {
        contentType = headers['Content-Type'] || headers.enctype;
        switch (contentType) {
            case URL_ENCODED_CONTENT_TYPE:
                return transformToQueryString(payload);
            case JSON_CONTENT_TYPE:
                return JSON.stringify(payload);
            case FORM_DATA_CONTENT_TYPE:
                return transformToFormData(payload);
            default:
                return payload;
        }
    }
    return null;
};

const transformToQueryString = (data) => {
    let params = [];
    Object.keys(data).forEach((propertyName) => {
        params[params.length] = encodeURIComponent(propertyName) + "=" + smartURIEncodeParam(data, propertyName);
    });
    return params.join("&").replace(/%20/g, "+");
};

const transformToFormData = data => {
    let formData = new FormData();
    Object.keys(data).forEach((key) => {
        let value = data[key];
        formData.append(key, value);
    });
    return formData;
};

const getUrlPrefix = (operationDetails, globalPrefixes) => {
    const prefixType = operationDetails.prefixType || "default",
        urlPrefix = globalPrefixes && globalPrefixes[prefixType] || "";
    return urlPrefix;
};

const getMethodURL = (operationDetails, prefixes, params) => {
    // copy the URL so we don't modified the definition, and create problems on reloading in DevMath
    let methodUrl = operationDetails.url;
    //Default url to empty string if incorrectly set
    methodUrl = typeof methodUrl === "string" ? methodUrl : "";

    //if url is not fully qualified, add prefix
    methodUrl = !methodUrl.match(/^\w+:\/\//) ? prefixes + methodUrl : methodUrl;

    methodUrl = replaceParams(methodUrl, params, false);
    return methodUrl;
};

const getTypeChecker = (typeString) => {
    return (val) => {
        return Object.prototype.toString.call(val) === typeString;
    };
};

const isString = getTypeChecker('[object String]');
const isObject = getTypeChecker('[object Object]');

const createFinalRequestObject = (url, urlPrefix, method, defaultHeaders, requestObject) => {
    let uriOverride = requestObject && requestObject.uriOverride,
        dynamicHeaders = requestObject && requestObject.headers,
        params = requestObject && requestObject.params,
        uri = uriOverride || url,
        headers = setDefaultJSONContentType(method, defaultHeaders),
        payload = requestObject && requestObject.payload;

    //if not fully qualified after uriOverride was applied, add prefix again
    uri = (uriOverride && !uri.match(/^\w+:\/\//)) ? urlPrefix + uri : uri;

    return {
        uri: replaceParams(uri, params, false),
        method: method,
        headers: Object.assign({}, headers, dynamicHeaders),
        payload: transformRequestPayload(headers, payload)
    };
};

const getAsyncFn = (operationDetails, parentOperationDetails, globals) => {
    let urlPrefix = getUrlPrefix(operationDetails, globals.prefixes);
    let methodUrl = getMethodURL(operationDetails, urlPrefix, globals.params);

    //If method isn't valid or doesn't exist, then just replace path params on the url
    if (VALID_METHODS.indexOf(operationDetails.method) === -1) {
        return function pathReplaceRequestHandler(params) {
            return replaceParams(methodUrl, params, false);
        };
    } else {
        return function xhrAsyncRequestHandler(requestObject) {
            let finalRequestObject = createFinalRequestObject(methodUrl, urlPrefix, operationDetails.method,
                operationDetails.headers, requestObject);
            return sendXHRPromise(finalRequestObject.uri, finalRequestObject.method, finalRequestObject.headers, finalRequestObject.payload);
        };
    }
};

const getMockResponseFn = (methodDefinition, globals) => {
    let urlPrefix = getUrlPrefix(methodDefinition.operationDetails, globals.prefixes);
    let methodUrl = getMethodURL(methodDefinition.operationDetails, urlPrefix, globals.params);

    return function xhrMockRequestFn(requestObject) {
        let finalRequestObject = createFinalRequestObject(methodUrl, urlPrefix, methodDefinition.operationDetails.method,
            methodDefinition.operationDetails.headers, requestObject);
        let responseToUse;
        if (methodDefinition.mockResponse || methodDefinition.smartMockResponse || methodDefinition.superMockResponse) {
            //Handle super mock and the smart responses if they are available
            if (methodDefinition.superMockResponse) {
                let superMockKey = "URI[" + JSON.stringify(finalRequestObject.uri) + "]Payload[" + JSON.stringify(finalRequestObject.payload) + "]Headers[" + JSON.stringify(finalRequestObject.headers);
                responseToUse = methodDefinition.superMockResponse[superMockKey];
            }

            if (!responseToUse && methodDefinition.smartMockResponse) {
                responseToUse = methodDefinition.smartMockResponse[finalRequestObject.uri];
            }
            //clone the response in case it is later modified in place and reloaded
            //this scenario was occasionally breaking e2e tests
            responseToUse = JSON.parse(JSON.stringify(responseToUse || methodDefinition.mockResponse || {}));
            console.info("Mock XHR :", finalRequestObject.uri, "\nReq=>", finalRequestObject, "\nRes=>", responseToUse);
        }
        return Promise.resolve(responseToUse);
    };
};

exports.name = "xhr";

exports.getAsyncFn = getAsyncFn;

exports.getMockResponseFn = getMockResponseFn;

exports.sendXHR = sendXHRPromise;