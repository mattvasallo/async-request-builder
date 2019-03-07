exports.name = "aggregator";

exports.getAsyncFn = function(operationDetails, parentOperationDetails, globals) {
    let asyncMethods;
    //This will find the corresponding asyncfn calls on the resourceFactory based on the operationIds
    function getASyncMethods(resourceFactory) {
        return operationDetails.operationIds.map(operationId => {
            let operationIdArray = operationId.split('.');
            //using reduce to find the right field on the object
            return operationIdArray.reduce((previousValue, currentValue) => {
                if (previousValue && previousValue.hasOwnProperty(currentValue)) {
                    return previousValue[currentValue];
                }
            }, globals.resourceFactory);
        });
    }

    return function aggregatorAsyncRequestHandler(requestObject) {
        if (!asyncMethods) {
            asyncMethods = getASyncMethods(globals.resourceFactory);
        }
        let promises = asyncMethods.map(asyncFn => {
            return asyncFn(requestObject);
        });
        return Promise.all(promises).then(resultArray => {
            //Only handling aggregating simple objects and don't handle arrays
            let resultsCanBeMerged = resultArray.some(result => Object.prototype.toString.call(result) === '[object Object]' && !Array.isArray(result));
            let finalResult = {};

            return resultsCanBeMerged ? Object.assign(finalResult, ...resultArray) : Promise.reject("Unable to merge aggregate responses");
        });
    };
};