exports.createAsyncRequestBuilder = require('./lib/async-request-builder');

exports.convertSwagger = (swaggerJSON) => {
    let arbFormat = {};
    if (swaggerJSON && swaggerJSON.paths) {
        Object.keys(swaggerJSON.paths).forEach(urlPath => {
            const methods = Object.keys(swaggerJSON.paths[urlPath]);
            methods.forEach(m => {
                const tags = swaggerJSON.paths[urlPath][m].tags;
                const operationId = swaggerJSON.paths[urlPath][m].operationId;
                if (tags.length && operationId) {
                    //ignore if no tags specified
                    //use first tag listed as key on arb json
                    arbFormat[tags[0]] = arbFormat[tags[0]] || {};
                    arbFormat[tags[0]][operationId] = {
                        "asyncModule": "http",
                        "operationDetails": {
                            "method": m,
                            "url": urlPath.replace(/}/gi, '').replace(/{/gi, ':')
                        }
                    };
                }
            });
        });
    }
    return arbFormat;
};