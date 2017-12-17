'use strict';

const http = require('http');
const url = require('url');
const readResponse = require('./http-helper').readResponse;

const server = http.createServer();

let messages = {};
let totalMessages = 0;

server.on('request', (req, res) => {
    console.info(req.method, req.url);
    const { pathname, query } = url.parse(req.url, true);
    if (pathname.startsWith('/messages')) {
        handleGoodRequest(req, res, pathname, query);
    } else {
        res.statusCode = 404;
        res.end();
    }
});

function handleGoodRequest(request, response, pathname, query) {
    const { method } = request;
    let result;
    if (method === 'GET' && pathname === '/messages') {
        result = getMessages(query.from, query.to);
        sendJsonResult(response, result);
    } else if (method === 'POST' && pathname === '/messages') {
        readResponse(request).then(body => {
            result = putMessage({ text: body.text, from: query.from, to: query.to });
            sendJsonResult(response, result);
        });
    } else if (method === 'DELETE') {
        let id = extractIdFromUrl(pathname);
        if (deleteMessage(id)) {
            result = { status: 'ok' };
            sendJsonResult(response, result);
        }
    } else if (method === 'PATCH') {
        let id = extractIdFromUrl(pathname);
        readResponse(request).then(body => {
            result = editMessage(id, body.text);
            sendJsonResult(response, result);
        });
    } else {
        response.statusCode = 404;
        response.end();
    }
}

function extractIdFromUrl(sourceUrl) {
    let splitedUrl = sourceUrl.split('/');

    return splitedUrl[splitedUrl.length - 1];
}

function sendJsonResult(result, message) {
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
    let id = totalMessages.toString();
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
