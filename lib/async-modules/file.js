const fs = require('fs');

exports.name = "file";

exports.getAsyncFn = (operationDetails, parentOperationDetails, globals) => {
    return function getAsyncFileHandler(requestObject) {
        return new Promise((resolve, reject) => {
            fs.readFile(operationDetails.location, operationDetails.encoding, (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    };
};