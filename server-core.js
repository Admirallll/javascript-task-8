'use strict';

const http = require('http');
const url = require('url');

const server = http.createServer();

let messages = [];

server.on('request', (req, res) => {
    console.info(req.url);
    const { method } = req;
    const { pathname, query } = url.parse(req.url, true);
    if (pathname === '/messages') {
        let result = {};
        if (method === 'GET') {
            result = getMessages(query.from, query.to);
            console.info(result);
            sendJsonResultWithMessage(res, result);
        } else {
            let body = [];
            req.on('data', (chunk) => {
                body.push(chunk);
            }).on('end', () => {
                body = Buffer.concat(body).toString();
                body = JSON.parse(body);
                console.info(body);
                result = putMessage({ text: body.text, from: query.from, to: query.to });
                console.info(result);
                sendJsonResultWithMessage(res, result);
            });
        }
    } else {
        res.statusCode = 404;
        res.end();
    }
});

function sendJsonResultWithMessage(result, message) {
    result.setHeader('Content-Type', 'application/json');
    result.statusCode = 200;
    result.write(JSON.stringify(message));
    result.end();
}

function putMessage(message) {
    messages.push(message);

    return message;
}

function getMessages(from, to) {
    let result = messages.filter(message =>
        (from === undefined || message.from === from) &&
        (to === undefined || message.to === to)
    );

    return result;
}

module.exports = server;
