const crossFetch = require('cross-fetch');

const VALID_METHODS = ["GET", "PUT", "POST", "DELETE"];
const URL_ENCODED_CONTENT_TYPE = 'application/x-www-form-urlencoded;charset=utf-8';
const JSON_CONTENT_TYPE = 'application/json;charset=UTF-8';
const FORM_DATA_CONTENT_TYPE = 'multipart/form-data';

const sendHttpRequest = ({
    url,
    method,
    headers,
    payload
}) => {
    return crossFetch(url, {
        method: method,
        headers: headers,
        body: payload
    }).then(
        res => {
            if (((200 <= res.status) && (res.status < 400))) {
                return res.text().then(response => {
                    try {
                        response = JSON.parse(response);
                    } catch (error) {
                        console.info(`Response ${response} not in json format. Response data set to un-parsed string`);
                    }
                    return response;
                });
            } else {
                return Promise.reject(res);
            }
        }).catch(err => {
        //should only get here due to network disconnected
        console.error("Unable to make fetch request.");
        return Promise.reject(err);
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

const replaceParams = (string, params) => {
    if (params) {
        Object.keys(params).forEach((paramName) => {
            string = string.replace(':' + paramName, smartURIEncodeParam(params, paramName));
        });
    }
    return string;
};

const smartURIEncodeParam = (data, paramName) => {
    let value = data[paramName];
    if (isObject(value) && !Array.isArray(value)) {
        console.warn("value for '" + paramName + "' cannot be URI-encoded because it is an object");
        value = "";
    }
    if (value === undefined || value === null) {
        console.warn("null value for '" + paramName + "' treated as empty string");
        value = "";
    }
    return encodeURIComponent(value);
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

const transformToQueryString = data => {
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
    const prefixType = operationDetails && operationDetails.prefixType || "default",
        urlPrefix = globalPrefixes && globalPrefixes[prefixType] || "";
    return urlPrefix;
};

const getMethodURL = (operationDetails, prefixes, params) => {
    // copy the URL so we don't modified the definition, and create problems on reloading in DevMath
    let methodUrl = operationDetails && operationDetails.url;
    //Default url to empty string if incorrectly set
    methodUrl = typeof methodUrl === "string" ? methodUrl : "";

    //if url is not fully qualified, add prefix
    methodUrl = !methodUrl.match(/^\w+:\/\//) ? prefixes + methodUrl : methodUrl;

    methodUrl = replaceParams(methodUrl, params);
    return methodUrl;
};

const getTypeChecker = typeString => {
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
        payload = requestObject && requestObject.payload,
        uri = uriOverride || url,
        headers = setDefaultJSONContentType(method, defaultHeaders);

    //if not fully qualified after uriOverride was applied, add prefix again
    uri = (uriOverride && !uri.match(/^\w+:\/\//)) ? urlPrefix + uri : uri;

    return {
        url: replaceParams(uri, params),
        method: method,
        headers: Object.assign({}, headers, dynamicHeaders),
        payload: transformRequestPayload(headers, payload)
    };
};

const getAsyncFn = (operationDetails, parentOperationDetails, globals) => {
    let urlPrefix = getUrlPrefix(operationDetails, globals.prefixes);
    let methodUrl = getMethodURL(operationDetails, urlPrefix, globals.params);
    //use GET as default method
    operationDetails.method = (!operationDetails.method && operationDetails.url) ? "GET" : operationDetails.method;

    if (VALID_METHODS.indexOf(operationDetails.method) === -1) {
        return () => Promise.reject(`Invalid XHR method ${operationDetails.method}`);
    }

    return requestObject =>
        sendHttpRequest(createFinalRequestObject(methodUrl, urlPrefix, operationDetails.method,
            operationDetails.headers, requestObject));
};

const getMockResponseFn = (methodDefinition, globals) => {
    const operationDetails = methodDefinition && methodDefinition.operationDetails;
    const method = operationDetails && operationDetails.method || "";
    const headers = operationDetails && operationDetails.headers || "";
    const urlPrefix = getUrlPrefix(operationDetails, globals.prefixes);
    const methodUrl = getMethodURL(operationDetails, urlPrefix, globals.params);

    const xhrMockRequestFn = requestObject => {
        let finalRequestObject = createFinalRequestObject(methodUrl, urlPrefix, method,
            headers, requestObject);
        let responseToUse;
        if (methodDefinition.mockResponse || methodDefinition.smartMockResponse || methodDefinition.superMockResponse) {
            //Handle super mock and the smart responses if they are available
            if (methodDefinition.superMockResponse) {
                let superMockKey = `URI[${JSON.stringify(finalRequestObject.url)}]Payload[${JSON.stringify(finalRequestObject.payload)}]Headers[${JSON.stringify(finalRequestObject.headers)}]`;
                responseToUse = methodDefinition.superMockResponse[superMockKey];
            }

            if (!responseToUse && methodDefinition.smartMockResponse) {
                responseToUse = methodDefinition.smartMockResponse[finalRequestObject.url];
            }
            //clone the response in case it is later modified in place and reloaded
            //this scenario was occasionally breaking e2e tests
            responseToUse = JSON.parse(JSON.stringify(responseToUse || methodDefinition.mockResponse || {}));
            // console.info("Mock: XHR" + finalRequestObject.url +  "\nReq=> " + finalRequestObject + "\nRes=> " + responseToUse);
            console.info("Mock: XHR", finalRequestObject.url, "\nReq=>", finalRequestObject, "\nRes=>", responseToUse);
        }
        return Promise.resolve(responseToUse);
    };
    return xhrMockRequestFn;
};

exports.name = "http";

exports.getAsyncFn = getAsyncFn;

exports.getMockResponseFn = getMockResponseFn;