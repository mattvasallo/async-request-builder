const xmlHttpResponse = {
    open: jest.fn(),
    setRequestHeader: jest.fn(),
    send: jest.fn(),
    onreadystatechange: null,
    readyState: 4,
    responseText: "{}",
    responseURL: {},
    status: 200,
    statusText: {},

};

exports.response = xmlHttpResponse;

exports.mockClearAll = () => {
    xmlHttpResponse.open.mockClear();
    xmlHttpResponse.setRequestHeader.mockClear();
    xmlHttpResponse.send.mockClear();
    xmlHttpResponse.status = 200;
    xmlHttpResponse.readyState = 4;
    xmlHttpResponse.responseText = "{}";
};

exports.request = jest.fn(() => xmlHttpResponse);