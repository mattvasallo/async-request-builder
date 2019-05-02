// const syncModuleLoader = require;
const ASYNC_MODULES_FOLDER = "./async-modules/";
const OPERATION_KEY_NAME = "operationDetails";
const ASYNC_MODULE_KEY_NAME = "asyncModule";
const DEFAULT_MOCK_RESPONSE = "mockResponse";
const MOCK_RESPONSE_NAMES = [DEFAULT_MOCK_RESPONSE, "smartMockResponse", "superMockResponse"];

let pendingRequestId = 0;
const pendingRequests = {};

const parseAsyncReqJSON = (currentDefinitionObject, globals) => {
    Object.keys(currentDefinitionObject).forEach(key => {
        const value = currentDefinitionObject[key];
        if (isPotentialAsyncFn(key, value)) {
            value[ASYNC_MODULE_KEY_NAME] = value[ASYNC_MODULE_KEY_NAME] || currentDefinitionObject[ASYNC_MODULE_KEY_NAME]; //copy asyncModule settings down from parent
            const canParseAsyncFn = (value[ASYNC_MODULE_KEY_NAME] && value[OPERATION_KEY_NAME]) || value[DEFAULT_MOCK_RESPONSE];
            //if async method, then parse, otherwise continue traversing the object tree
            currentDefinitionObject[key] = (canParseAsyncFn ? createAsyncFn(value, currentDefinitionObject, globals) : parseAsyncReqJSON(value, globals));
        }
    });
    globals.resourceFactory = currentDefinitionObject;
    return currentDefinitionObject;
};

const isPotentialAsyncFn = (key, value) => (typeof value === "object" && key !== OPERATION_KEY_NAME && MOCK_RESPONSE_NAMES.indexOf(key) === -1);

const containsMockResponse = methodDefinition => Object.keys(methodDefinition).some(key => MOCK_RESPONSE_NAMES.indexOf(key) !== -1);

const createAsyncFn = (methodDefinition, parentDefinition, globals) => {
    const asyncModuleName = methodDefinition[ASYNC_MODULE_KEY_NAME];
    const asyncModule = asyncModuleName && loadAsyncModule(asyncModuleName, globals.loadedAsyncModuleMap);

    return (containsMockResponse(methodDefinition)) ? getMockResponseFn(asyncModule, methodDefinition, globals) : getAsyncFn(asyncModule, methodDefinition, globals, parentDefinition);
};

const getMockResponseFn = (asyncModule, methodDefinition, globals) => {
    const asyncModuleMockFn = asyncModule && asyncModule.getMockResponseFn && asyncModule.getMockResponseFn(methodDefinition, globals);
    const asyncModuleName = asyncModule && asyncModule.name;

    return asyncModuleMockFn || (requestObject => {
        //default mock response
        //clone the response in case it is later modified in place and reloaded
        //this scenario was occasionally breaking e2e tests
        const responseToUse = JSON.parse(JSON.stringify(methodDefinition[DEFAULT_MOCK_RESPONSE])) || {};
        console.info("Mock: " + asyncModuleName + "\nReq=> " + requestObject + "\nRes=> " + responseToUse);
        return Promise.resolve(responseToUse);
    });
};

const getAsyncFn = (asyncModule, methodDefinition, globals, parentDefinition) => {
    const asyncFn = asyncModule && asyncModule.getAsyncFn && asyncModule.getAsyncFn(methodDefinition[OPERATION_KEY_NAME], parentDefinition[OPERATION_KEY_NAME], globals);
    const asyncModuleName = asyncModule && asyncModule.name;

    if (!asyncFn) {
        return () => Promise.reject("Failed to get asyncFn for module " + asyncModuleName);
    }

    // make note of all on-going requests, so that we can wait for them if necessary before closing down.
    const wrapperFn = request => {
        // ToDo: some kind of throttling if the list of pending requests gets too long?
        const promise = asyncFn(request);
        const index = ++pendingRequestId;
        pendingRequests[index] = promise;

        // what we really want is "finally", but node 6.5 doesn't support that yet; this is equivalent.
        const deleteFn = () => {
            delete pendingRequests[index];
        };
        promise.then(deleteFn, deleteFn);

        return promise;
    };

    return wrapperFn;
};

const loadAsyncModule = (moduleName, loadedAsyncModuleMap) => {
    const asyncModulePath = ASYNC_MODULES_FOLDER + moduleName;
    switch (moduleName) {
        case "http":
            loadedAsyncModuleMap[asyncModulePath] = loadedAsyncModuleMap[asyncModulePath] || require("./async-modules/http");
            break;
    }
    return loadedAsyncModuleMap[asyncModulePath];
};

const waitForPendingRequests = () => {
    return Promise.all(Object.keys(pendingRequests).map((index) => {
        return pendingRequests[index];
    }));
};

const closeAsyncModuleConnections = loadedAsyncModuleMap => {
    const connectionClosedPromises = [];
    const closeConnections = () => {
        Object.keys(loadedAsyncModuleMap).forEach(asyncModulePath => {
            const asyncModule = loadedAsyncModuleMap[asyncModulePath];
            if (asyncModule.closeConnections) {
                connectionClosedPromises.push(asyncModule.closeConnections());
            }
        });
        return Promise.all(connectionClosedPromises);
    };

    return waitForPendingRequests().then(closeConnections, closeConnections);
};

module.exports = function createAsyncRequestBuilder(requestJSON, config = {}) {
    const globals = {
        "prefixes": config.prefixes,
        "params": config.params,
        "loadedAsyncModuleMap": {}
    };

    const parsedRequestJSON = JSON.parse(JSON.stringify(requestJSON)) || {};

    parsedRequestJSON.closeAsyncModuleConnections = () => closeAsyncModuleConnections(globals.loadedAsyncModuleMap);
    parsedRequestJSON.waitForPendingRequests = () => waitForPendingRequests();
    parseAsyncReqJSON(parsedRequestJSON, globals, parsedRequestJSON.asyncModule);
    return parsedRequestJSON;
};