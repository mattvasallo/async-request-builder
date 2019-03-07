'use strict';
const http = require('http');
const asyncRequestLib = require('../async-request-builder');

describe('Http module', () => {
    const host = "sub.site.com";
    const host2 = "sub.site2.com";
    const port = "8080";
    const path = "/path";
    const pathWithParams = "/path/:id";
    const pathWithParams2 = "/path/:test";
    let actualOptions;
    const globalParams = {
        "params": {
            "id": "123%",
            "badParam1": {},
            "badParam2": null
        },
        "prefixes": {
            "test": "testing"
        }
    };
    let httpCallbackFn;
    let httpErrorFn;
    let httpRequestMock = {
        on: (type, fn) => {
            if (type === 'error') {
                httpErrorFn = fn;
            }
        },
        end: () => {}
    };

    const requestDefFile = {
        "httpMethod1": {
            "asyncModule": "http",
            "operationDetails": {
                "url": host + ":" + port + path,
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
        },
        "httpMethod2": {
            "asyncModule": "http",
            "operationDetails": {
                "url": host2 + ":" + port + path,
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
        },
        "httpMethod3": {
            "asyncModule": "http",
            "operationDetails": {
                "prefixType": "test",
                "url": pathWithParams,
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
        },
        "httpMethod4": {
            "asyncModule": "http",
            "operationDetails": {
                "prefixType": "test",
                "url": pathWithParams2,
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
        }
    };

    jest.spyOn(http, "request").mockImplementation((options, callback) => {
        actualOptions = options;
        httpCallbackFn = callback;
        return httpRequestMock;
    });
    jest.spyOn(console, "warn").mockImplementation(() => {});

    const asyncRequestLayer = asyncRequestLib(requestDefFile, globalParams);

    test('creates async function', () => {
        Object.keys(requestDefFile).forEach(function(method) {
            expect(typeof asyncRequestLayer[method]).toBe('function');
            expect(typeof asyncRequestLayer[method]().then).toBe('function');
        });
    });

    test('http request is called with correct arguments', () => {
        const expectedOptions = {
            hostname: host,
            port: port,
            path: path,
            method: requestDefFile.httpMethod1.operationDetails.method,
            headers: requestDefFile.httpMethod1.operationDetails.headers
        };

        asyncRequestLayer.httpMethod1();
        expect(actualOptions).toEqual({
            hostname: host,
            port: port,
            path: path,
            method: requestDefFile.httpMethod1.operationDetails.method,
            headers: requestDefFile.httpMethod1.operationDetails.headers
        });
        asyncRequestLayer.httpMethod2();

        expect(actualOptions).toEqual({
            hostname: host2,
            port: port,
            path: path,
            method: requestDefFile.httpMethod2.operationDetails.method,
            headers: requestDefFile.httpMethod2.operationDetails.headers
        });
    });

    test('global path params are validated and replaced based by uriEncoded global params', () => {
        asyncRequestLayer.httpMethod3();
        expect(actualOptions.hostname).toEqual(globalParams.prefixes.test);
        expect(actualOptions.path).toEqual("/path/" + encodeURIComponent(globalParams.params.id));
        expect(console.warn).toHaveBeenCalled(); //This should have been called for the badParams case.
    });

    test('request object path params are validated and replaced based by uriEncoded global params', () => {
        asyncRequestLayer.httpMethod4({
            params: {
                "test": "345%"
            }
        });
        expect(actualOptions.path).toEqual("/path/" + encodeURIComponent("345%"));
    });

    test('returns successful promise on valid http JSON response', (done) => {
        asyncRequestLayer.httpMethod1().then((response) => {
            expect(response).toEqual("hello world");
            done();
        });
        let httpMockResponse;
        let httpMockEnd;
        let responseObj = {
            setEncoding: () => {},
            on: (type, fn) => {
                if (type === 'data') {
                    httpMockResponse = fn;
                }
                if (type === 'end') {
                    httpMockEnd = fn;
                }
            },
        };
        httpCallbackFn(responseObj);
        httpMockResponse("\"hello");
        httpMockResponse(" ");
        httpMockResponse("world\"");
        httpMockEnd();
    });

    test('returns rejected promise on invalid http JSON response', (done) => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        asyncRequestLayer.httpMethod1().catch((err) => {
            expect(err).toEqual("problem parsing json response: Unexpected token w in JSON at position 7");
            expect(console.error).toHaveBeenCalledWith("problem parsing json response: Unexpected token w in JSON at position 7");
            done();
        });
        let httpMockResponse;
        let httpMockEnd;
        let responseObj = {
            setEncoding: () => {},
            on: (type, fn) => {
                if (type === 'data') {
                    httpMockResponse = fn;
                }
                if (type === 'end') {
                    httpMockEnd = fn;
                }
            },
        };
        httpCallbackFn(responseObj);
        httpMockResponse("\"hello");
        httpMockResponse("\"");
        httpMockResponse("world\"");
        httpMockEnd();
    });

    test('returns rejected promise on http error ', (done) => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        asyncRequestLayer.httpMethod1().catch((err) => {
            expect(err).toEqual("problem with http request: http error");
            expect(console.error).toHaveBeenCalledWith("problem with http request: http error");
            done();
        });
        let httpMockResponse;
        let httpMockEnd;
        let responseObj = {
            setEncoding: () => {},
            on: (type, fn) => {
                if (type === 'data') {
                    httpMockResponse = fn;
                }
                if (type === 'end') {
                    httpMockEnd = fn;
                }
            },
        };
        httpCallbackFn(responseObj);
        httpErrorFn({
            "message": "http error"
        });
    });
});