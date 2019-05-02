'use strict';
jest.mock('cross-fetch');
const crossFetch = require('cross-fetch');
const httpModule = require('../http');


describe('XHR module', () => {

    beforeEach(() => {
        crossFetch.mockClear();
    });

    describe('uses HTTP methods', () => {
        test('default to GET if none specified', () => {
            const operation = {
                "url": "sub.site.com:8080/path/:id",
                "headers": {
                    "Content-Type": "application/json;charset=UTF-8"
                }
            };
            return httpModule.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                }
            }).then(() => {
                expect(crossFetch).toHaveBeenCalledWith(operation.url.replace(":id", "1"), {
                    method: "GET",
                    headers: operation.headers,
                    body: null
                });
            });
        });

        test('GET', () => {
            const operation = {
                "url": "sub.site.com:8080/path/:id",
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json;charset=UTF-8"
                }
            };
            return httpModule.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                }
            }).then(() => {
                expect(crossFetch).toHaveBeenCalledWith(operation.url.replace(":id", "1"), {
                    method: "GET",
                    headers: operation.headers,
                    body: null
                });
            });
        });

        test('DELETE ', () => {
            const operation = {
                "url": "sub.site.com:8080/path/:id",
                "method": "DELETE",
                "headers": {
                    "Content-Type": "application/json;charset=UTF-8"
                }
            };
            return httpModule.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                }
            }).then(() => {
                expect(crossFetch).toHaveBeenCalledWith(operation.url.replace(":id", "1"), {
                    method: "DELETE",
                    headers: operation.headers,
                    body: null
                });
            });
        });

        test('PUT', () => {
            const operation = {
                "url": "sub.site.com:8080/path/:id",
                "method": "PUT",
                "headers": {
                    "Content-Type": "application/json;charset=UTF-8"
                }
            };
            return httpModule.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                },
                payload: {}
            }).then(() => {
                expect(crossFetch).toHaveBeenCalledWith(operation.url.replace(":id", "1"), {
                    method: "PUT",
                    headers: operation.headers,
                    body: JSON.stringify({})
                });
            });
        });

        test('POST', () => {
            const operation = {
                "url": "sub.site.com:8080/path/:id",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json;charset=UTF-8"
                }
            };
            return httpModule.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                },
                payload: {}
            }).then(() => {
                expect(crossFetch).toHaveBeenCalledWith(operation.url.replace(":id", "1"), {
                    method: "POST",
                    headers: operation.headers,
                    body: JSON.stringify({})
                });
            });
        });
    });

    describe('handles payload transformation for ', () => {
        describe('url', () => {
            describe('path params', () => {
                test('are replaced', () => {
                    const operation = {
                        "url": "sub.site.com:8080/path/:id",
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                        }
                    };
                    return httpModule.getAsyncFn(operation, {}, {})({
                        params: {
                            id: "1"
                        },
                        payload: {
                            name: "M A"
                        }
                    }).then(() => {
                        expect(crossFetch).toHaveBeenCalledWith(operation.url.replace(":id", "1"), {
                            method: "POST",
                            headers: operation.headers,
                            body: "name=M+A"
                        });
                    });
                });
                test('default to empty strings if they are complex objects', () => {
                    const operation = {
                        "url": "sub.site.com:8080/path/:id",
                        "method": "GET",
                        "headers": {
                            "Content-Type": "application/json;charset=UTF-8"
                        }
                    };
                    return httpModule.getAsyncFn(operation, {}, {})({
                        params: {
                            id: {
                                test: "test"
                            }
                        }
                    }).then(() => {
                        expect(crossFetch).toHaveBeenCalledWith(operation.url.replace(":id", ""), {
                            method: "GET",
                            headers: operation.headers,
                            body: null
                        });
                    });
                });

                test('defaults to empty strings for null or undefined values', () => {
                    const operation = {
                        "url": "sub.site.com:8080/path/:id",
                        "method": "GET",
                        "headers": {
                            "Content-Type": "application/json;charset=UTF-8"
                        }
                    };
                    return httpModule.getAsyncFn(operation, {}, {})({
                        params: {
                            id: null
                        }
                    }).then(() => {
                        expect(crossFetch).toHaveBeenCalledWith(operation.url.replace(":id", ""), {
                            method: "GET",
                            headers: operation.headers,
                            body: null
                        });
                    });
                });
            });
            describe('prefixes', () => {
                test('applied using default prefixType if url not fully qualified', () => {
                    const operation = {
                        "url": "/path/",
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                        }
                    };
                    let formData = new FormData();
                    formData.append("name", "M A");
                    return httpModule.getAsyncFn(operation, {}, {
                        prefixes: {
                            default: "www.test.com"
                        }
                    })({
                        params: {
                            id: "1"
                        }
                    }).then(() => {
                        expect(crossFetch).toHaveBeenCalledWith("www.test.com" + operation.url, {
                            method: "POST",
                            headers: operation.headers,
                            body: null
                        });
                    });
                });

                test('applied using prefixType if url not fully qualified', () => {
                    const operation = {
                        "url": "/path/",
                        "method": "POST",
                        "prefixType": "special",
                        "headers": {
                            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                        }
                    };
                    let formData = new FormData();
                    formData.append("name", "M A");
                    return httpModule.getAsyncFn(operation, {}, {
                        prefixes: {
                            default: "www.test.com",
                            special: "www.special.com"
                        }
                    })({
                        params: {
                            id: "1"
                        }
                    }).then(() => {
                        expect(crossFetch).toHaveBeenCalledWith("www.special.com" + operation.url, {
                            method: "POST",
                            headers: operation.headers,
                            body: null
                        });
                    });
                });

                test('not applied if url already fully qualified', () => {
                    const operation = {
                        "url": "http://www.fullURL.com/path/",
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                        }
                    };
                    return httpModule.getAsyncFn(operation, {}, {
                        prefixes: {
                            default: "www.special.com"
                        }
                    })({
                        params: {
                            id: "1"
                        }
                    }).then(() => {
                        expect(crossFetch).toHaveBeenCalledWith(operation.url, {
                            method: "POST",
                            headers: operation.headers,
                            body: null
                        });
                    });
                });
            });
        });
        test('form data', () => {
            const operation = {
                "url": "sub.site.com:8080/path/",
                "method": "POST",
                "headers": {
                    "Content-Type": "multipart/form-data"
                }
            };
            let formData = new FormData();
            formData.append("name", "M A");
            return httpModule.getAsyncFn(operation, {}, {})({
                payload: {
                    name: "M A"
                }
            }).then(() => {
                expect(crossFetch).toHaveBeenCalledWith(operation.url, {
                    method: operation.method,
                    headers: operation.headers,
                    body: formData
                });
            });
        });

    });

    describe('mocking ', () => {
        test('uses mock response as default', () => {
            const methodDefinition = {
                mockResponse: {
                    name: "mockResponse"
                },
                operationDetails: {
                    "url": "sub.site.com:8080/path/:id",
                    "method": "POST",
                    "headers": {
                        "Content-Type": "multipart/form-data"
                    }
                }
            };

            const result = httpModule.getMockResponseFn(methodDefinition, {})().then((result) => {
                expect(result).toEqual(methodDefinition.mockResponse);
            });
            return result;
        });

        test('uses smart mock response before standard mock response when available', () => {
            const methodDefinition = {
                mockResponse: {
                    name: "mockResponse"
                },
                smartMockResponse: {
                    "sub.site.com:8080/path/7": {
                        name: "smartMockResponse"
                    }
                },
                operationDetails: {
                    "url": "sub.site.com:8080/path/:id",
                    "method": "POST",
                    "headers": {
                        "Content-Type": "multipart/form-data"
                    }
                }
            };

            const result = httpModule.getMockResponseFn(methodDefinition, {})({
                params: {
                    id: "7"
                }
            }).then((result) => {
                expect(result).toEqual({
                    name: "smartMockResponse"
                });
            });
            return result;
        });

        test('uses super mock response before smart mock response when available', () => {
            const methodDefinition = {
                mockResponse: {
                    name: "mockResponse"
                },
                smartMockResponse: {
                    "sub.site.com:8080/path/7": {
                        name: "smartMockResponse"
                    }
                },
                superMockResponse: {
                    "URI[\"sub.site.com:8080/path/7\"]Payload[null]Headers[{\"Content-Type\":\"multipart/form-data\"}]": {
                        name: "superMockResponse"
                    },
                },
                operationDetails: {
                    "url": "sub.site.com:8080/path/:id",
                    "method": "POST",
                    "headers": {
                        "Content-Type": "multipart/form-data"
                    }
                }
            };

            const result = httpModule.getMockResponseFn(methodDefinition, {})({
                params: {
                    id: "7"
                }
            }).then((result) => {
                expect(result).toEqual({
                    name: "superMockResponse"
                });
            });
            return result;
        });
    });

    describe('makes http request', () => {
        test('uses cross-fetch if available', () => {
            const operation = {
                "url": "sub.site.com:8080/path/",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            };
            return httpModule.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                }
            }).then(() => {
                expect(crossFetch).toHaveBeenCalledWith(operation.url, {
                    method: operation.method,
                    headers: operation.headers,
                    body: null
                });
            });
        });
    });

    describe('returns promise', () => {
        test('success if fetch response code is >= 200 & < 400', () => {
            const operation = {
                "url": "www.google.com",
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json;charset=UTF-8"
                }
            };
            return httpModule.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                }
            }).then((response) => {
                expect(response).toEqual({
                    json: true
                });
            });
        });

        test('rejected if fetch response code is 500', () => {
            const operation = {
                "url": "sub.site.com:8080/path/",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            };
            crossFetch.mockImplementationOnce(() => Promise.resolve({
                status: 500,
                text: () => Promise.resolve(JSON.stringify({
                    json: true
                }))
            }));
            return httpModule.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                },
                payload: {
                    name: "M A"
                }
            }).catch((error) => {
                expect(error.status).toBe(500);
            });
        });

        test('rejected if fetch request fails', () => {
            const operation = {
                "url": "http://www.fullURL.com/path/",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            };
            crossFetch.mockImplementationOnce(() => Promise.reject("error"));
            return httpModule.getAsyncFn(operation, {}, {
                prefixes: {
                    default: "www.test.com"
                }
            })({
                params: {
                    id: "1"
                },
                payload: {
                    name: "M A"
                }
            }).catch(error => {
                expect(crossFetch).toHaveBeenCalledWith(operation.url, {
                    method: operation.method,
                    headers: operation.headers,
                    body: "name=M+A"
                });
                expect(error).toBe("error");
            });
        });
    });
});