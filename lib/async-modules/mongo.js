const mongoClient = require('mongodb').MongoClient;
let connection;

function getConnection() {
    return new Promise((resolve, reject) => {

        let userLogin = "";
        let options = [];
        if (connection) {
            resolve(connection);
            return true;
        }

        if (process.env.MONGO_USER) {
            userLogin = process.env.MONGO_USER + ":" + process.env.MONGO_PASSWORD + "@";
        }

        if (process.env.MONGO_REPLICA_SET_NAME) {
            options.push("replicaSet=" + process.env.MONGO_REPLICA_SET_NAME);
        }

        if (process.env.MONGO_CONNECTION_LIMIT) {
            options.push("maxPoolSize=" + process.env.MONGO_CONNECTION_LIMIT);
        }

        if (process.env.MONGO_READ_PREFERENCE) {
            options.push("readPreference=" + process.env.MONGO_READ_PREFERENCE);
        }

        if (options.length) {
            options = "?" + options.join("&");
        }

        mongoClient.connect("mongodb://" + userLogin + process.env.MONGO_HOSTS + "/" + process.env.MONGO_DATABASE + options, (err, database) => {
            if (err) {
                reject(err);
                return false;
            }
            console.info('mongodb connection opened');
            connection = database;
            resolve(connection);
        });
    });
}


//Handle doing the find replace in mongodb query objects.
//Supports $match case for aggregate method by doing recursive call if object value is detected

function replaceQueryParams(queryObject, params) {
    return Object.keys(queryObject).forEach((paramName) => {
        let paramValue = queryObject[paramName];
        if (typeof paramValue === "object") {
            return replaceQueryParams(paramValue, params);
        }
        return (paramValue.length && paramValue[0] === ":") ? params[paramValue.slice(1)] : paramValue;
    });
}

function closeConnections() {
    return new Promise((resolve, reject) => {
        if (!connection) {
            resolve();
        }
        connection.close((err) => {
            if (err) {
                reject();
                return false;
            }
            console.info('mongodb connections closed');
            resolve();
        });
    });
}

exports.closeConnections = closeConnections;

exports.name = "mongo";

exports.getAsyncFn = (operationDetails, parentOperationDetails, globals) => {
    return function mongoAsyncRequestHandler(requestObject) {
        let params = requestObject && requestObject.params;
        let wasConnected = !!connection;

        return getConnection().then((db) => {
            return new Promise((resolve, reject) => {
                let query = replaceQueryParams(operationDetails.query, params);
                db.collection(operationDetails.collection)[operationDetails.method](query, operationDetails.projection, function getResult(err, results) {
                    if (err) {
                        if (err.message === "topology was destroyed" && wasConnected) {
                            //GRADE-2378 handling case where mongo was down and comes back online.
                            //Previously without this logic the server had to be restarted for new requests to work.
                            closeConnections()['finally'](() => {
                                connection = null;
                                mongoAsyncRequestHandler(operationDetails, {}, {}).then((result) => {
                                    resolve(result);
                                })['catch']((err) => {
                                    reject(err);
                                });
                            });
                        } else {
                            reject(err);
                        }
                        return false;
                    }

                    if (results.toArray) {
                        //handle find case which uses the cursor object
                        results.toArray(getResult);
                        return false;
                    }

                    if (results.length > 0 && operationDetails.singleRecord) {
                        results = results[0];
                    }
                    let useDefaultResponse = operationDetails.defaultResponse !== undefined && !results.length && Object.keys(results).length === 0;
                    results = useDefaultResponse ? operationDetails.defaultResponse : results;
                    resolve(results);
                    return true;
                });
            });
        });
    };
};