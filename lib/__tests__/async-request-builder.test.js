'use strict';
jest.mock('../async-modules/http');
const httpModule = require('../async-modules/http');
const asyncRequestLib = require('../async-request-builder');

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
            "httpMethod": {
                "asyncModule": "http",
                "operationDetails": {
                    "url": "child.url",
                    "method": "GET",
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }
        }
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
        "httpMethodMock": {
            "asyncModule": "http",
            "operationDetails": {
                "url": host + ":" + port + path,
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json"
                }
            },
            "mockResponse": "defaultMockResponse"
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

        httpModule.getAsyncFn.mockImplementation(() => testAsyncFn);
        asyncRequestLayer = asyncRequestLib(requestDefFile, {});
        asyncRequestLayer.httpMethod1("test").then(() => {
            response.asyncRequestCompleted = true;
        }, () => {
            response.asyncRequestCompleted = true;
        });
        return response;
    };

    test('creates rejected promise if no async method', () => {
        const tempFn = httpModule.getAsyncFn;
        delete httpModule["getAsyncFn"];
        asyncRequestLayer = asyncRequestLib(requestDefFile, {});
        return asyncRequestLayer.httpMethod1().catch(err => {
            expect(err).toBe("Failed to get asyncFn for module " + requestDefFile.httpMethod1.asyncModule);
            httpModule.getAsyncFn = tempFn;
        });
    });

    test('creates rejected promise if async module does not exist', () => {
        asyncRequestLayer = asyncRequestLib(requestDefFile, {});
        return asyncRequestLayer.badMethod().catch(err => {
            expect(err).toBe("Failed to get asyncFn for module undefined");
        });
    });

    test('loads async module and gets the correct async function', () => {
        asyncRequestLayer = asyncRequestLib(requestDefFile, {});
        expect(httpModule.getAsyncFn).toHaveBeenCalled();
    });

    test('uses mockResponse if defined on asyncModule', () => {
        asyncRequestLayer = asyncRequestLib(requestDefFile, {});
        return asyncRequestLayer.httpMethodMock().then(mockResponse => {
            expect(httpModule.getMockResponseFn).toHaveBeenCalled();
            expect(mockResponse).toEqual("AsyncMockResponse");
        });
    });

    test('uses default mockResponse if undefined on asyncModule', () => {
        const tempFn = httpModule.getAsyncFn;
        delete httpModule["getMockResponseFn"];
        asyncRequestLayer = asyncRequestLib(requestDefFile, {});
        return asyncRequestLayer.httpMethodMock().then(mockResponse => {
            expect(mockResponse).toEqual("defaultMockResponse");
            httpModule.getMockResponseFn = tempFn;
        });
    });

    test('calls getAsyncFn with correct request definition info', () => {
        asyncRequestLayer = asyncRequestLib(simpleRequestDefFile, sampleGlobals);
        expect(httpModule.getAsyncFn).toHaveBeenCalledWith(
            simpleRequestDefFile.parent.httpMethod.operationDetails,
            simpleRequestDefFile.parent.operationDetails,
            expect.objectContaining({
                prefixes: sampleGlobals.prefixes,
                params: sampleGlobals.params,
                loadedAsyncModuleMap: expect.any(Object)
            }));
    });

    test('closeAsyncModuleConnections waits for pending requests before closing connections', () => {
        let asyncHelper = setupPendingAsyncRequests();
        let closeResultPromise = asyncRequestLayer.closeAsyncModuleConnections();
        expect(asyncHelper.asyncRequestCompleted).toBe(false);
        asyncHelper.resolvePromise();
        return closeResultPromise.then(() => {
            expect(asyncHelper.asyncRequestCompleted).toBe(true);
            expect(httpModule.closeConnections).toHaveBeenCalled();
        });
    });

    test('waitForPendingRequests provides a hook for waiting for request to complete', () => {
        let asyncHelper = setupPendingAsyncRequests();
        let closeResultPromise = asyncRequestLayer.waitForPendingRequests();
        expect(asyncHelper.asyncRequestCompleted).toBe(false);
        asyncHelper.resolvePromise();
        return closeResultPromise.then(() => {
            expect(asyncHelper.asyncRequestCompleted).toBe(true);
        });
    });

    describe.skip('Nested definitions', () => {
        const asyncRequestLayer = asyncRequestLib(requestDefFile, {});

        test('asyncModule definition passed down to all nested children', () => {
            Object.keys(requestDefFile).forEach(method => {
                expect(typeof asyncRequestLayer[method]).toBe('function');
                expect(typeof asyncRequestLayer[method]().then).toBe('function');
            });
        });

        test('operationDetail definition passed down only to direct child', () => {
            Object.keys(requestDefFile).forEach(method => {
                expect(typeof asyncRequestLayer[method]).toBe('function');
                expect(typeof asyncRequestLayer[method]().then).toBe('function');
            });
        });
    });
});