const asyncRequestLib = require('./../index');
const exampleRequestDefinitionJSON = require('./exampleRequestDefFile.json');

const asyncRequestLayer = asyncRequestLib.createAsyncRequestBuilder(exampleRequestDefinitionJSON, {});

asyncRequestLayer.getHTTPCourseData({
    params: {
        snapshotId: 4
    }
}).then(response => {
    console.log('got http response -> ', response);
});

asyncRequestLayer.getHTTPCourseDataMock({
    params: {
        snapshotId: 4
    }
}).then(response => {
    console.log('got mock http response -> ', response);
});

asyncRequestLayer.getFileData({}).then(response => {
    console.log('got file contents -> ', response);
});

asyncRequestLayer.getFileDataMock({}).then(response => {
    console.log('got mock file contents -> ', response);
});

asyncRequestLayer.getAggregatorData({
    params: {
        snapshotId: 4
    }
}).then(response => {
    console.log('got aggregator contents -> ', response);
});

asyncRequestLayer.getAggregatorDataMock({
    params: {
        snapshotId: 4
    }
}).then(response => {
    console.log('got aggregator mock contents -> ', response);
});

asyncRequestLayer.closeAsyncModuleConnections();