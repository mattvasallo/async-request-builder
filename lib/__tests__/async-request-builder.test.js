'use strict';
const http_module = require('../lib/async-modules/http');
const asyncRequestLib = require('../async-request-builder');
http_module.closeConnections = () => {};

describe('async-request-builder', () => {
    const host = "sub.site.com";
    const host2 = "sub.site2.com";
    const port = "8080";
    const path = "/path";
    const sampleGlobals = {
        "prefixes": "https://test.domain",
        "params": "params"
    };
    let asyncRequestLayer;

    const simpleRequestDefFile = {
        "parent": {
            "operationDetails": {
                "url": "parent.url",
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json"
                }
            },
            "httpMethod":{
                "asyncModule": "http",
                "operationDetails": {
                    "url": "child.url",
                    "method": "GET",
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }
        }};

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
        "httpMethodMock": {
            "asyncModule": "http",
            "mockResponse":"foo"
        },
        "badMethod": {
            "asyncModule": "null",
            "operationDetails": {
                "url": host2 + ":" + port + path,
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
        }
    };

    const requestNestedDefFile = {
        "httpNestedMethods": {
            "operationDetails": {
                "url": host2 + ":" + port + path,
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json"
                }
            },
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
        }
    };

    const setupPendingAsyncRequests = () => {
        let response = {
            "asyncRequestCompleted": false
        };

        const testAsyncFn = () => {
            return new Promise((resolve, reject) => {
                response.resolvePromise = () => {
                    resolve("resolved");
                };
                response.rejectPromise = () => {
                    reject("rejected");
                };
            });
        };

        jest.spyOn(http_module, "getAsyncFn").mockImplementation(() => testAsyncFn);
        asyncRequestLayer = asyncRequestLib(requestDefFile, {});
        asyncRequestLayer.httpMethod1("test").then(() => {
            response.asyncRequestCompleted = true;
        },() => {
            response.asyncRequestCompleted = true;
        });
        return response;
    };

    it('creates rejected promise if no async method', (done) => {
        const tempFn = http_module.getAsyncFn;
        delete http_module["getAsyncFn"];
        asyncRequestLayer = asyncRequestLib(requestDefFile, {});
        asyncRequestLayer.httpMethod1().catch(function(err){
            expect(err).toBe("Failed to get asyncFn for module " + requestDefFile.httpMethod1.asyncModule);
            http_module.getAsyncFn = tempFn;
            done();
        });
    });

    it('creates rejected promise if async module does not exist', (done) => {
        asyncRequestLayer = asyncRequestLib(requestDefFile, {});
        asyncRequestLayer.badMethod().catch(function(err){
            expect(err).toBe("Failed to get asyncFn for module undefined");
            done();
        });
    });

    it('loads async module and gets the correct async function', () => {
        jest.spyOn(http_module, "getAsyncFn").mockImplementation(() => {});
        asyncRequestLayer = asyncRequestLib(requestDefFile, {});
        expect(http_module.getAsyncFn).toHaveBeenCalled();
    });

    it('uses mockResponse if defined', (done) => {
        jest.spyOn(console, "info").mockImplementation(() => {});
        asyncRequestLayer = asyncRequestLib(requestDefFile, {});
        asyncRequestLayer.httpMethodMock("test").then(function(mockResponse){
            expect(mockResponse).toEqual(requestDefFile.httpMethodMock.mockResponse);
            expect(console.info).toHaveBeenCalledWith("Mock: http\nReq=> test\nRes=> foo");
            done();
        });
    });

    it('calls getAsyncFn with correct request definition info', () => {
        let operationDetails, parentOperationDetails, globals;
        jest.spyOn(http_module, "getAsyncFn").mockImplementation((od, pod, globs) => {
            operationDetails = od;
            parentOperationDetails = pod;
            globals = globs;
        });
        asyncRequestLayer = asyncRequestLib(simpleRequestDefFile, sampleGlobals);
        expect(operationDetails).toEqual(simpleRequestDefFile.parent.httpMethod.operationDetails);
        expect(parentOperationDetails).toEqual(simpleRequestDefFile.parent.operationDetails);
        expect(globals.prefixes).toBe(sampleGlobals.prefixes);
        expect(globals.params).toBe(sampleGlobals.params);
    });

    it('closeAsyncModuleConnections waits for pending requests before closing connections', (done) => {
        let asyncHelper = setupPendingAsyncRequests();
        jest.spyOn(http_module, "closeConnections").mockImplementation(() => {});

        let closeResultPromise = asyncRequestLayer.closeAsyncModuleConnections();
        expect(asyncHelper.asyncRequestCompleted).toBe(false);
        closeResultPromise.then(() => {
            expect(asyncHelper.asyncRequestCompleted).toBe(true);
            expect(http_module.closeConnections).toHaveBeenCalled();
            done();
        });
        asyncHelper.resolvePromise();
    });

    it('waitForPendingRequests provides a hook for waiting for request to complete', (done) => {
        let asyncHelper = setupPendingAsyncRequests();
        let closeResultPromise = asyncRequestLayer.waitForPendingRequests();
        // expect(asyncHelper.asyncRequestCompleted).toBe(false);
        closeResultPromise.then(() => {
            expect(asyncHelper.asyncRequestCompleted).toBe(true);
            done();
        },() => {
            expect(asyncHelper.asyncRequestCompleted).toBe(true);
            done();
        });
        asyncHelper.rejectPromise();
    });

    xdescribe('Nested definitions', () => {
        const asyncRequestLayer = asyncRequestLib(requestDefFile, {});

        it('asyncModule definition passed down to all nested children', () => {
            Object.keys(requestDefFile).forEach(function(method) {
                expect(typeof asyncRequestLayer[method]).toBe('function');
                expect(typeof asyncRequestLayer[method]().then).toBe('function');
            });
        });

        it('operationDetail definition passed down only to direct child', () => {
            Object.keys(requestDefFile).forEach(function(method) {
                expect(typeof asyncRequestLayer[method]).toBe('function');
                expect(typeof asyncRequestLayer[method]().then).toBe('function');
            });
        });
    });
});