'use strict';
const mysql = require('mysql');
const asyncRequestLib = require('../async-request-builder');

describe('mysql module', () => {
    process.env = {
        MYSQL_CONNECTION_LIMIT: 1000,
        MYSQL_HOST: "none",
        MYSQL_USER: "user",
        MYSQL_PASSWORD: "pass",
        MYSQL_DATABASE: "MYSQL_DATABASE"
    };
    const testSingleResponse = [{
        "test": true
    }];
    const testMultipleResponse = [testSingleResponse[0], {
        "test2": true
    }];
    let asyncRequestLayer;

    const globalParams = {
        "params": {
            "id": "1",
            "badParam1": {},
            "badParam2": null
        },
        "prefixes": {
            "test": "testing"
        }
    };
    let getConnectionCb = (err, connection) => {};
    let mysqlConnResponseFn = (err, result, fields) => {};
    let mysqlConnection = {
        query: (sqlToExecute, params, callbackFn) => {

        },
        release: () => {},
        escape: () => {

        }
    };
    let mysqlPoolMock = {
        getConnection: (cb) => {
            cb(null, mysqlConnection);
        },
        end: () => {}
    };

    let poolOptions;

    let queryResult;
    const SQL_STATEMENT = 'SELECT DB_COL_1 as dbCol1, DB_COL_2 as DB_COL_2 FROM TEST t WHERE t.ID = :id;';

    const requestDefFile = {
        "mysqlMethod": {
            "asyncModule": "mysql",
            "operationDetails": {
                "singleRecord": true,
                "SQL": [
                    "SELECT :COL_MAP",
                    "FROM TEST t",
                    "WHERE t.ID = :id;",
                ],
                "COL_MAP": {
                    "DB_COL_1": "dbCol1",
                    "DB_COL_2": "DB_COL_2"
                },
                "NOTES": ""
            }
        }
    };

    beforeEach(() => {
        jest.spyOn(mysql, "createPool").mockImplementation((options) => {
            poolOptions = options;
            return mysqlPoolMock;
        });

        jest.spyOn(mysqlConnection, "query").mockImplementation((sqlToExecute, params, cb) => {
            mysqlConnResponseFn = cb
        });

        jest.spyOn(mysqlConnection, "escape").mockImplementation((val) => {
            return val;
        });

        jest.spyOn(mysqlPoolMock, "getConnection").mockImplementation((cb) => {
            cb(null, mysqlConnection);
        });

        jest.spyOn(mysqlConnection, "release").mockImplementation(() => {});

        jest.spyOn(console, "warn").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});

        asyncRequestLayer = asyncRequestLib(requestDefFile, {});
        queryResult = asyncRequestLayer.mysqlMethod();
    });

    test('creates mysql connection pool', () => {
        expect(mysql.createPool).toHaveBeenCalled();
        expect(poolOptions.connectionLimit).toBe(process.env.MYSQL_CONNECTION_LIMIT);
        expect(poolOptions.user).toBe(process.env.MYSQL_USER);
        expect(poolOptions.password).toBe(process.env.MYSQL_PASSWORD);
        expect(poolOptions.database).toBe(process.env.MYSQL_DATABASE);
        expect(typeof poolOptions.queryFormat).toBe('function');
        mysqlConnResponseFn(null, {}, {});
    });

    test('type casts BIT field responses', () => {
        expect(typeof poolOptions.typeCast).toBe('function');
        const next = () => false;
        let field = [1];
        field.type = 'BIT';
        field.buffer = () => {
            return {
                readInt8: () => {
                    return 1;
                }
            };
        };
        expect(poolOptions.typeCast(field, next)).toBe(true);
        expect(poolOptions.typeCast([], next)).toBe(false);
        mysqlConnResponseFn(null, {}, {});
    });

    test('opens a SQL connection', () => {
        expect(mysqlPoolMock.getConnection).toHaveBeenCalled();
        mysqlConnResponseFn(null, {}, {});
    });

    describe('runs the query', () => {
        test('on the connection', (done) => {
            mysqlConnResponseFn(null, {}, {});
            asyncRequestLayer.mysqlMethod().then(() => {
                expect(mysqlConnection.query).toHaveBeenCalled();
                done();
            });
            mysqlConnResponseFn(null, {}, {});
        });

        test('using an update sql statement with the COL_MAP replaced', (done) => {
            mysqlConnResponseFn(null, {}, {});
            asyncRequestLayer.mysqlMethod().then(() => {
                expect(mysqlConnection.query).toHaveBeenCalledWith(SQL_STATEMENT, undefined, mysqlConnResponseFn);
                done();
            });
            mysqlConnResponseFn(null, {}, {});
        });

        test('with query parameters from the request object', (done) => {
            mysqlConnResponseFn(null, {}, {});
            const requestObject = {
                params: {
                    id: 1
                }
            };
            poolOptions.escape = () => {};
            jest.spyOn(poolOptions, "escape").mockImplementation((val) => {
                return val;
            });
            asyncRequestLayer.mysqlMethod(requestObject).then(() => {
                this.escape = () => {};
                expect(mysqlConnection.query).toHaveBeenCalledWith(SQL_STATEMENT, requestObject.params, mysqlConnResponseFn);
                expect(poolOptions.queryFormat(SQL_STATEMENT, requestObject.params)).toBe(SQL_STATEMENT.replace(":id", 1));
                expect(poolOptions.queryFormat(SQL_STATEMENT, {})).toBe(SQL_STATEMENT);
                expect(poolOptions.queryFormat(SQL_STATEMENT, undefined)).toBe(SQL_STATEMENT);
                expect(poolOptions.escape).toHaveBeenCalledWith(1);
                done();
            });
            mysqlConnResponseFn(null, {}, {});

        });

        test('with gloal query parameters if none specified in request object', (done) => {
            mysqlConnResponseFn(null, {}, {});
            asyncRequestLib(requestDefFile, globalParams).mysqlMethod().then(() => {
                expect(mysqlConnection.query).toHaveBeenCalledWith(SQL_STATEMENT, globalParams.params, mysqlConnResponseFn);
                done();
            });
            mysqlConnResponseFn(null, {}, {});
        });

        test('releases the connection after query completes', () => {
            mysqlConnResponseFn(null, {}, {});
            expect(mysqlConnection.release).toHaveBeenCalled();
        });
    });

    describe('returns promise that', () => {
        test('resolves with object for single responses', (done) => {
            const response = [{}];
            queryResult.then((res) => {
                expect(res).toBe(response[0]);
                done();
            });
            mysqlConnResponseFn(null, response, {});

        });

        test('resolves with empty object for invalid single response', (done) => {
            queryResult.then((res) => {
                expect(res).toEqual({});
                done();
            });
            mysqlConnResponseFn(null, testMultipleResponse, {});
        });

        test('resolves with array object for multiple response', (done) => {
            requestDefFile.mysqlMethod.operationDetails.singleRecord = false;
            mysqlConnResponseFn(null, testMultipleResponse, {});
            asyncRequestLib(requestDefFile, {}).mysqlMethod().then((res) => {
                expect(res).toEqual(testMultipleResponse);
                done();
            });
            mysqlConnResponseFn(null, testMultipleResponse, {});
            requestDefFile.mysqlMethod.operationDetails.singleRecord = true;
        });

        test('rejects on query error', (done) => {
            const error = {
                "errorMessage": "sql error"
            };
            queryResult.catch((res) => {
                expect(res).toBe(error);
                expect(console.error).toHaveBeenCalled();
                done();
            });
            mysqlConnResponseFn(error, testSingleResponse, {});
        });

        test('rejects on connection failure', (done) => {
            const error = {
                "errorMessage": "could not connect!"
            };
            jest.spyOn(mysqlPoolMock, "getConnection").mockImplementation((cb) => {
                cb(error, null);
            });
            mysqlConnResponseFn(null, {}, {});
            asyncRequestLayer.mysqlMethod().catch((err) => {
                expect(err).toBe(error);
                expect(console.error).toHaveBeenCalled();
                done();
            });

            expect(mysqlPoolMock.getConnection).toHaveBeenCalled();
        });
    });

    test('closeConnection closes mysql connection', (done) => {
        jest.spyOn(mysqlPoolMock, "end").mockImplementation((cb) => {
            cb(undefined);
        });
        mysqlConnResponseFn(null, {}, {});
        asyncRequestLayer.closeAsyncModuleConnections().then((res) => {
            expect(mysqlPoolMock.end).toHaveBeenCalled();
            done();
        });
        mysqlConnResponseFn(null, {}, {});
    });

});