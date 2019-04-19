'use strict';
const xmlhttpMock = require('../__mocks__/XMLHttpMock');
const xhr = require('../xhr');

describe('XHR module', () => {

    global.XMLHttpRequest = xmlhttpMock.request;

    beforeEach(() => {
        global.fetch = null;
        xmlhttpMock.mockClearAll();
    });

    describe('uses HTTP methods', () => {
        test('default to GET if none specified', () => {
            const operation = {
                "url": "sub.site.com:8080/path/:id",
                "headers": {
                    "Content-Type": "application/json;charset=UTF-8"
                }
            };
            const result = xhr.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                }
            }).then(() => {
                expect(xmlhttpMock.response.open).toHaveBeenCalledWith("GET", operation.url.replace(":id", "1"), true);
                expect(xmlhttpMock.response.send).toHaveBeenCalledWith(null);
                expect(xmlhttpMock.response.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/json;charset=UTF-8");

            });
            xmlhttpMock.response.onreadystatechange();
            return result;
        });

        test('GET', () => {
            const operation = {
                "url": "sub.site.com:8080/path/:id",
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json;charset=UTF-8"
                }
            };
            const result = xhr.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                }
            }).then(() => {
                expect(xmlhttpMock.response.open).toHaveBeenCalledWith(operation.method, operation.url.replace(":id", "1"), true);
                expect(xmlhttpMock.response.send).toHaveBeenCalledWith(null);
                expect(xmlhttpMock.response.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/json;charset=UTF-8");

            });
            xmlhttpMock.response.onreadystatechange();
            return result;
        });

        test('DELETE ', () => {
            const operation = {
                "url": "sub.site.com:8080/path/:id",
                "method": "DELETE"
            };
            const result = xhr.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                }
            }).then(() => {
                expect(xmlhttpMock.response.open).toHaveBeenCalledWith(operation.method, operation.url.replace(":id", "1"), true);
                expect(xmlhttpMock.response.send).toHaveBeenCalledWith(null);
                expect(xmlhttpMock.response.setRequestHeader).not.toHaveBeenCalled();

            });
            xmlhttpMock.response.onreadystatechange();
            return result;
        });

        test('PUT', () => {
            const operation = {
                "url": "sub.site.com:8080/path/:id",
                "method": "PUT"
            };
            const result = xhr.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                },
                payload: {}
            }).then(() => {
                expect(xmlhttpMock.response.open).toHaveBeenCalledWith(operation.method, operation.url.replace(":id", "1"), true);
                expect(xmlhttpMock.response.send).toHaveBeenCalledWith(JSON.stringify({}));
                expect(xmlhttpMock.response.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/json;charset=UTF-8");

            });
            xmlhttpMock.response.onreadystatechange();
            return result;
        });

        test('POST', () => {
            const operation = {
                "url": "sub.site.com:8080/path/:id",
                "method": "POST"
            };
            const result = xhr.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                },
                payload: {}
            }).then(() => {
                expect(xmlhttpMock.response.open).toHaveBeenCalledWith(operation.method, operation.url.replace(":id", "1"), true);
                expect(xmlhttpMock.response.send).toHaveBeenCalledWith(JSON.stringify({}));
                expect(xmlhttpMock.response.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/json;charset=UTF-8");
            });
            xmlhttpMock.response.onreadystatechange();
            return result;
        });

        test('REPLACE does simple URL params replacement', () => {
            const operation = {
                "url": "sub.site.com:8080/path/:id",
                "method": "REPLACE",
                "headers": {
                    "Content-Type": "application/json;charset=UTF-8"
                }
            };
            const result = xhr.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                }
            }).then((response) => {
                expect(xmlhttpMock.response.open).not.toHaveBeenCalled();
                expect(response).toBe(operation.url.replace(":id", 1));
            });
            return result;
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
                    const result = xhr.getAsyncFn(operation, {}, {})({
                        params: {
                            id: "1"
                        },
                        payload: {
                            name: "M A"
                        }
                    }).then(() => {
                        expect(xmlhttpMock.response.send).toHaveBeenCalledWith("name=M+A");
                        expect(xmlhttpMock.response.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");
                    });
                    xmlhttpMock.response.onreadystatechange();
                    return result;
                });
                test('default to empty strings if they are complex objects', () => {
                    const operation = {
                        "url": "sub.site.com:8080/path/:id",
                        "method": "GET",
                        "headers": {
                            "Content-Type": "application/json;charset=UTF-8"
                        }
                    };
                    const result = xhr.getAsyncFn(operation, {}, {})({
                        params: {
                            id: {
                                test: "test"
                            }
                        }
                    }).then(() => {
                        expect(xmlhttpMock.response.open).toHaveBeenCalledWith(operation.method, operation.url.replace(":id", ""), true);
                    });
                    xmlhttpMock.response.onreadystatechange();
                    return result;
                });

                test('defaults to empty strings for null or undefined values', () => {
                    const operation = {
                        "url": "sub.site.com:8080/path/:id",
                        "method": "GET",
                        "headers": {
                            "Content-Type": "application/json;charset=UTF-8"
                        }
                    };
                    const result = xhr.getAsyncFn(operation, {}, {})({
                        params: {
                            id: null
                        }
                    }).then(() => {
                        expect(xmlhttpMock.response.open).toHaveBeenCalledWith(operation.method, operation.url.replace(":id", ""), true);
                    });
                    xmlhttpMock.response.onreadystatechange();
                    return result;
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
                    const result = xhr.getAsyncFn(operation, {}, {
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
                    }).then(() => {
                        expect(xmlhttpMock.response.open).toHaveBeenCalledWith(operation.method, "www.test.com" + operation.url, true);
                    });
                    xmlhttpMock.response.onreadystatechange();
                    return result;
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
                    const result = xhr.getAsyncFn(operation, {}, {
                        prefixes: {
                            default: "www.test.com",
                            special: "www.special.com"
                        }
                    })({
                        params: {
                            id: "1"
                        },
                        payload: {
                            name: "M A"
                        }
                    }).then(() => {
                        expect(xmlhttpMock.response.open).toHaveBeenCalledWith(operation.method, "www.special.com" + operation.url, true);
                    });
                    xmlhttpMock.response.onreadystatechange();
                    return result;
                });

                test('not applied if url already fully qualified', () => {
                    const operation = {
                        "url": "http://www.fullURL.com/path/",
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                        }
                    };
                    const result = xhr.getAsyncFn(operation, {}, {
                        prefixes: {
                            default: "www.special.com"
                        }
                    })({
                        params: {
                            id: "1"
                        },
                        payload: {
                            name: "M A"
                        }
                    }).then(() => {
                        expect(xmlhttpMock.response.open).toHaveBeenCalledWith(operation.method, operation.url, true);
                    });
                    xmlhttpMock.response.onreadystatechange();
                    return result;
                });
            });
        });
        test('form data', () => {
            const operation = {
                "url": "sub.site.com:8080/path/:id",
                "method": "POST",
                "headers": {
                    "Content-Type": "multipart/form-data"
                }
            };
            let formData = new FormData();
            formData.append("name", "M A");
            const result = xhr.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                },
                payload: {
                    name: "M A"
                }
            }).then(() => {
                expect(xmlhttpMock.response.send).toHaveBeenCalledWith(formData);
                expect(xmlhttpMock.response.setRequestHeader).toHaveBeenCalledWith("Content-Type", "multipart/form-data");
            });
            xmlhttpMock.response.onreadystatechange();
            return result;
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

            const result = xhr.getMockResponseFn(methodDefinition, {})().then((result) => {
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

            const result = xhr.getMockResponseFn(methodDefinition, {})({
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

            const result = xhr.getMockResponseFn(methodDefinition, {})({
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
        test('using XMLHttpRequest if fetch not available', () => {
            global.fetch = null;
            const operation = {
                "url": "sub.site.com:8080/path/",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            };
            let formData = new FormData();
            formData.append("name", "M A");
            const result = xhr.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                },
                payload: {
                    name: "M A"
                }
            }).then(() => {
                expect(global.XMLHttpRequest).toHaveBeenCalled();
            });
            xmlhttpMock.response.onreadystatechange();
            return result;
        });

        test('using fetch if available', () => {
            global.fetch = jest.fn(() => Promise.resolve({
                status: 200,
                text: () => Promise.resolve(JSON.stringify({
                    json: true
                }))
            }));
            const operation = {
                "url": "sub.site.com:8080/path/",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            };
            let formData = new FormData();
            formData.append("name", "M A");
            const result = xhr.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                },
                payload: {
                    name: "M A"
                }
            }).then(() => {
                expect(global.fetch).toHaveBeenCalledWith(operation.url, {
                    method: operation.method,
                    headers: operation.headers,
                    body: "name=M+A"
                });
            });
            return result;
        });
    });

    describe('returns promise', () => {
        test('rejected if fetch and XMLHttpRequest not available', () => {
            const operation = {
                "url": "sub.site.com:8080/path/",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            };
            global.XMLHttpRequest = null;
            const result = xhr.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                },
                payload: {
                    name: "M A"
                }
            }).catch((result) => {
                expect(result).toEqual("Fetch and XmlHttpRequest not available!");
            });
            global.XMLHttpRequest = xmlhttpMock.request;
            return result;
        });

        test('success if xmlHttpRequest response code is >= 200 & < 400', () => {
            const operation = {
                "url": "www.google.com",
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json;charset=UTF-8"
                }
            };

            xmlhttpMock.response.responseText = "test";
            const result = xhr.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                }
            }).then((response) => {
                expect(response).toBe("test");

            });
            xmlhttpMock.response.onreadystatechange();
            return result;
        });

        test('rejected if xmlHttpRequest response code is 500', () => {
            const operation = {
                "url": "sub.site.com:8080/path/",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            };
            xmlhttpMock.response.status = 500;
            const result = xhr.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                },
                payload: {
                    name: "M A"
                }
            }).catch((error) => {
                expect(error.status).toBe(500);
            });
            xmlhttpMock.response.onreadystatechange();
            return result;
        });

        test('rejected if xmlHttpRequest send throws exception', () => {
            const operation = {
                "url": "sub.site.com:8080/path/",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            };
            xmlhttpMock.response.status = 500;
            xmlhttpMock.response.send = jest.fn(() => {
                throw "error";
            });
            const result = xhr.getAsyncFn(operation, {}, {})({
                params: {
                    id: "1"
                },
                payload: {
                    name: "M A"
                }
            }).catch((error) => {
                expect(error).toBe("error");
            });
            xmlhttpMock.response.onreadystatechange();

            return result;
        });

        test('rejected if fetch request fails', () => {
            global.fetch = jest.fn(() => Promise.reject("error"));
            const operation = {
                "url": "http://www.fullURL.com/path/",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            };
            return xhr.getAsyncFn(operation, {}, {
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
                expect(global.fetch).toHaveBeenCalledWith(operation.url, {
                    method: operation.method,
                    headers: operation.headers,
                    body: "name=M+A"
                });
                expect(error).toBe("error");
            });
        });

        test('rejected if fetch returns with response code 500', () => {
            global.fetch = jest.fn(() => Promise.resolve({
                status: 500
            }));
            const operation = {
                "url": "http://www.fullURL.com/path/",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            };
            return xhr.getAsyncFn(operation, {}, {
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
            }).catch((error) => {
                expect(global.fetch).toHaveBeenCalledWith(operation.url, {
                    method: operation.method,
                    headers: operation.headers,
                    body: "name=M+A"
                });
                expect(error.status).toBe(500);
            });
        });

        test('success if fetch returns with response code >= 200 and < 400 ', () => {
            global.fetch = jest.fn(() => Promise.resolve({
                status: 200,
                text: () => Promise.resolve(JSON.stringify({
                    json: true
                }))
            }));
            const operation = {
                "url": "http://www.fullURL.com/path/",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            };
            return xhr.getAsyncFn(operation, {}, {
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
            }).then((response) => {
                expect(global.fetch).toHaveBeenCalledWith(operation.url, {
                    method: operation.method,
                    headers: operation.headers,
                    body: "name=M+A"
                });
                expect(response.json).toBe(true);
            });
        });
    });
});