'use strict';
const mockXHR = {
    open: () => {
        console.log('test');
    },
    setRequestHeader: () => {},
    send: () => {},
    onreadystatechange: () => {},
    readyState: 4,
    responseText: {},
    responseURL: {},
    status: {},
    statusText: {},

};

// global["XMLHttpRequest"] = "TEST";

// global["XMLHttpRequest"].name = 'TEST';
const asyncRequestLib = require('../lib/async-request-builder');

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
            "asyncModule": "xhr",
            "operationDetails": {
                "url": host + ":" + port + path,
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
        },
        "httpMethod2": {
            "asyncModule": "xhr",
            "operationDetails": {
                "url": host2 + ":" + port + path,
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
        },
        "httpMethod3": {
            "asyncModule": "xhr",
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
            "asyncModule": "xhr",
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

    jest.spyOn(global, "XMLHttpRequest").mockImplementation(() => {
        return mockXHR;
    });

    jest.spyOn(mockXHR, "open").mockImplementation(() => {});

    jest.spyOn(mockXHR, "send").mockImplementation(() => {});

    const asyncRequestLayer = asyncRequestLib(requestDefFile, globalParams);

    it('creates async function', () => {
        Object.keys(requestDefFile).forEach(function(method) {
            expect(typeof asyncRequestLayer[method]).toBe('function');
            expect(typeof asyncRequestLayer[method]().then).toBe('function');
        });
    });

    it('xhr open is called with correct arguments', () => {
        asyncRequestLayer.httpMethod1();
        expect(mockXHR.open).toHaveBeenCalledWith(requestDefFile.httpMethod1.operationDetails.method, requestDefFile.httpMethod1.operationDetails.url, true);
        mockXHR.onreadystatechange();
    });

    it('global path params are validated and replaced based by uriEncoded global params', () => {
        asyncRequestLayer.httpMethod3();
        expect(mockXHR.open).toHaveBeenCalledWith(requestDefFile.httpMethod1.operationDetails.method, globalParams.prefixes.test + "/path/" + encodeURIComponent(globalParams.params.id), true);
    });
    //
    // it('request object path params are validated and replaced based by uriEncoded global params', () => {
    //     asyncRequestLayer.httpMethod4({
    //         params: {
    //             "test": "345%"
    //         }
    //     });
    //     expect(actualOptions.path).toEqual("/path/" + encodeURIComponent("345%"));
    // });
    //
    // it('returns successful promise on valid http JSON response', (done) => {
    //     asyncRequestLayer.httpMethod1().then((response) => {
    //         expect(response).toEqual("hello world");
    //         done();
    //     });
    //     let httpMockResponse;
    //     let httpMockEnd;
    //     let responseObj = {
    //         setEncoding: () => {
    //         },
    //         on: (type, fn) => {
    //             if (type === 'data') {
    //                 httpMockResponse = fn;
    //             }
    //             if (type === 'end') {
    //                 httpMockEnd = fn;
    //             }
    //         },
    //     };
    //     httpCallbackFn(responseObj);
    //     httpMockResponse("\"hello");
    //     httpMockResponse(" ");
    //     httpMockResponse("world\"");
    //     httpMockEnd();
    // });
    //
    // it('returns rejected promise on invalid http JSON response', (done) => {
    //     jest.spyOn(console, "error").mockImplementation(() => {
    //     });
    //     asyncRequestLayer.httpMethod1().catch((err) => {
    //         expect(err).toEqual("problem parsing json response: Unexpected token w in JSON at position 7");
    //         expect(console.error).toHaveBeenCalledWith("problem parsing json response: Unexpected token w in JSON at position 7");
    //         done();
    //     });
    //     let httpMockResponse;
    //     let httpMockEnd;
    //     let responseObj = {
    //         setEncoding: () => {
    //         },
    //         on: (type, fn) => {
    //             if (type === 'data') {
    //                 httpMockResponse = fn;
    //             }
    //             if (type === 'end') {
    //                 httpMockEnd = fn;
    //             }
    //         },
    //     };
    //     httpCallbackFn(responseObj);
    //     httpMockResponse("\"hello");
    //     httpMockResponse("\"");
    //     httpMockResponse("world\"");
    //     httpMockEnd();
    // });
    //
    // it('returns rejected promise on http error ', (done) => {
    //     jest.spyOn(console, "error").mockImplementation(() => {
    //     });
    //     asyncRequestLayer.httpMethod1().catch((err) => {
    //         expect(err).toEqual("problem with http request: http error");
    //         expect(console.error).toHaveBeenCalledWith("problem with http request: http error");
    //         done();
    //     });
    //     let httpMockResponse;
    //     let httpMockEnd;
    //     let responseObj = {
    //         setEncoding: () => {
    //         },
    //         on: (type, fn) => {
    //             if (type === 'data') {
    //                 httpMockResponse = fn;
    //             }
    //             if (type === 'end') {
    //                 httpMockEnd = fn;
    //             }
    //         },
    //     };
    //     httpCallbackFn(responseObj);
    //     httpErrorFn({
    //         "message": "http error"
    //     });
    // });
});