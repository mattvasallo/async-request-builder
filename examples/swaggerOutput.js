import fetch from "cross-fetch";

export const globals = {
    getTree: {
        url: "/progressapp/service/itemsTreeWithSummaries/:snapshotId",
        method: "GET",
        headers: {}
    },
};

const sendHttpRequest = (url, method, headers, body) => {
    return crossFetch(url, {
        method: method,
        headers: headers,
        body: body
    }).then(
        res => {
            if (((200 <= res.status) && (res.status < 400))) {
                return res.text().then(response => {
                    try {
                        response = JSON.parse(response);
                    } catch (error) {
                        console.info(`Response ${response} not in json format. Response data set to un-parsed string`);
                    }
                    return response;
                });
            } else {
                return Promise.reject(res);
            }
        }).catch(err => {
        //should only get here due to network disconnected
        console.error("Unable to make fetch request.");
        return Promise.reject(err);
    });
};

export const activiy = {
    getTree: req => sendHttpRequest(globals.getTree.url,
        globals.getTree.method,
        req.headers || globals.getTree.headers,
        req.body
    )
};