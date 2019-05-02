module.exports = jest.fn(() => Promise.resolve({
    status: 200,
    text: () => Promise.resolve(JSON.stringify({
        json: true
    }))
}));