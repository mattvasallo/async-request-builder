const arb = require('../index');

const exampleRequestDefinitionJSON = {
    "nodeHTTPGET": {
        "asyncModule": "http",
        "operationDetails": {
            "method": "GET",
            "url": "https://httpstat.us/200?sleep=:sleep",
            "headers": {
                "Accept": 'application/json'
            }
        }
    }
};

const asyncRequestLayer = arb.createAsyncRequestBuilder(exampleRequestDefinitionJSON);

console.log("Making async request http...");
asyncRequestLayer.nodeHTTPGET({
    params: {
        sleep: 10
    }
}).then(response => {
    console.log('Http request with sleep param at 10 made successfully - > ', response);
});