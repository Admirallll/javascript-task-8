'use strict';

const http = require('http');
const url = require('url');
const md5 = require('md5');

const server = http.createServer();

let messages = {};
let totalMessages = 0;

server.on('request', (req, res) => {
    console.info(req.method, req.url);
    const { pathname } = url.parse(req.url, true);
    if (pathname.startsWith('/messages')) {
        handlerGoodRequest(req, res);
    } else {
        res.statusCode = 404;
        res.end();
    }
});

function handlerGoodRequest(req, res) {
    const { method } = req;
    const { pathname, query } = url.parse(req.url, true);
    let result;
    if (method === 'GET' && pathname === '/messages') {
        result = getMessages(query.from, query.to);
        sendJsonResultWithMessage(res, result);
    } else if (method === 'POST' && pathname === '/messages') {
        readResponse(req).then(body => {
            result = putMessage({ text: body.text, from: query.from, to: query.to });
            sendJsonResultWithMessage(res, result);
        });
    } else if (method === 'DELETE') {
        let id = extractIdFromUrl(pathname);
        if (deleteMessage(id)) {
            result = { status: 'ok' };
            sendJsonResultWithMessage(res, result);
        }
    } else if (method === 'PATCH') {
        let id = extractIdFromUrl(pathname);
        readResponse(req).then(body => {
            result = editMessage(id, body.text);
            sendJsonResultWithMessage(res, result);
        });
    } else {
        res.statusCode = 404;
        res.end();
    }
}

function extractIdFromUrl(sourceUrl) {
    let splitedUrl = sourceUrl.split('/');

    return splitedUrl[splitedUrl.length - 1];
}

function readResponse(initialResponse) {
    return new Promise(resolve => {
        let body = [];
        initialResponse.on('data', function (chunk) {
            body.push(chunk);
        });

        initialResponse.on('end', function () {
            body = Buffer.concat(body).toString();
            let result = JSON.parse(body);
            resolve(result);
        });
    });
}

function sendJsonResultWithMessage(result, message) {
    result.setHeader('Content-Type', 'application/json');
    result.statusCode = 200;
    result.write(JSON.stringify(message));
    result.end();
}

function editMessage(id, newText) {
    let message = messages[id];
    message.text = newText;
    message.edited = true;

    return message;
}

function deleteMessage(id) {
    if (id in messages) {
        delete messages[id];

        return true;
    }

    return false;
}

function putMessage(message) {
    let id = md5(totalMessages.toString());
    message.id = id;
    messages[id] = message;
    totalMessages++;

    return message;
}

function getMessages(from, to) {
    let result = Object.values(messages).filter(message =>
        (from === undefined || message.from === from) &&
        (to === undefined || message.to === to)
    );

    return result;
}

module.exports = server;
