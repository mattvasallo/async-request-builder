const mysql = require('mysql');
const mysqlPool = mysql.createPool({
    connectionLimit: process.env.MYSQL_CONNECTION_LIMIT,
    // debug: true,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    queryFormat: function queryFormat(query, values) {
        if (!values) {
            return query;
        }
        return query.replace(/:(\w+)/g, function(txt, key) {
            if (values.hasOwnProperty(key)) {
                return this.escape(values[key]);
            }
            return txt;
        }.bind(this));
    },
    //the db has no boolean data type, so these values are stored as BIT 0 or BIT 1, and converted to booleans here:
    typeCast: (field, next) => {
        if (field.length === 1 && field.type === 'BIT') {
            let buffer = field.buffer();
            return buffer && buffer.readInt8(0) === 1;
        }
        return next();
    }
});

const replaceSQLColumns = (sql, colMap) => {
    if (typeof sql === "string" && typeof colMap === "object") {
        let origColNames = Object.keys(colMap);
        let colStatement = "";
        for (let i = 0; i < origColNames.length; i++) {
            colStatement += origColNames[i] + " as " + colMap[origColNames[i]];
            colStatement += (i === origColNames.length - 1) ? "" : ", ";
        }
        sql = sql.replace(':COL_MAP', colStatement); //No need to worry about SQL injection as this is coming from devs not from endpoints.
    }
    return sql;
};

exports.closeConnections = () => {
    return new Promise((resolve, reject) => {
        mysqlPool.end(err => {
            if (err) {
                reject(err);
                return false;
            }
            console.info('mysql connections closed');
            resolve();
        });
    });

};

exports.name = "mysql";

exports.getAsyncFn = (operationDetails, parentOperationDetails, globals) => {
    let isSingleRecord = operationDetails.singleRecord;
    let sqlToExecute = Array.isArray(operationDetails.SQL) ? operationDetails.SQL.join(" ") : operationDetails.SQL;
    let COL_MAP_TO_USE = operationDetails.COL_MAP || parentOperationDetails.COL_MAP;
    //Replace COL_MAP on all SQL.
    //Note: COL_MAP comes from the resource file and not from user request, so no concerns about injection
    sqlToExecute = replaceSQLColumns(sqlToExecute, COL_MAP_TO_USE);

    return function mySQLAsyncHandler(requestObject) {
        const params = requestObject && requestObject.params || globals && globals.params;
        return new Promise((resolve, reject) => {
            mysqlPool.getConnection((err, connection) => {
                if (err) {
                    console.error('database connection error => ', err);
                    reject(err);
                    return false;
                }
                connection.query(sqlToExecute, params, (err, result, fields) => {
                    connection.release();
                    if (err) {
                        console.error('got sql error =>', err);
                        reject(err);
                        return false;
                    }

                    if (isSingleRecord) {
                        if (result.length > 1) {
                            console.warn("SQL statement specified single result, but got multiple records. Using the first one.");
                        }
                        result = (result.length && result.length === 1) ? result[0] : {};
                    }
                    resolve(result);
                });
            });
        });
    };
};