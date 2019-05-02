exports.name = "http";

exports.getAsyncFn = jest.fn();

exports.getMockResponseFn = jest.fn(() => () => Promise.resolve("AsyncMockResponse"));

exports.sendXHR = jest.fn();

exports.closeConnections = jest.fn(() => Promise.resolve());