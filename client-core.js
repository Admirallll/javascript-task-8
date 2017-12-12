'use strict';

module.exports.execute = execute;
module.exports.isStar = false;
const request = require('request');
const chalk = require('chalk');
const red = chalk.hex('#f00');
const green = chalk.hex('#0f0');

function execute() {
    const { from, to, text, command } = parseArgs();
    if (command === 'list') {
        return listRequest(from, to);
    } else if (command === 'send') {
        return sendRequest({ from, to, text });
    }
}

function listRequest(from, to) {
    const url = 'http://localhost:8080/messages';

    return new Promise((resolve, reject) => {
        request.get({ uri: url, qs: createDefinedQueryParams(from, to) })
            .on('response', res => {
                let body = [];
                res.on('data', function (chunk) {
                    body.push(chunk);
                });

                res.on('end', function () {
                    body = Buffer.concat(body).toString();
                    let result = JSON.parse(body);
                    result = result.map(messageToConsoleString);
                    resolve(result.join('\n\n'));
                });
            })
            .on('error', reject);
    });
}

function sendRequest(message) {
    const { from, to, text } = message;

    return new Promise((resolve, reject) => {
        let req = request
            .post({ uri: 'http://localhost:8080/messages', qs: createDefinedQueryParams(from, to) })
            .on('response', res => {
                let body = [];
                res.on('data', function (chunk) {
                    body.push(chunk);
                });

                res.on('end', function () {
                    body = Buffer.concat(body).toString();
                    let result = JSON.parse(body);
                    resolve(messageToConsoleString(result));
                });
            });
        req.on('error', function (e) {
            reject(e);
        });

        req.write(JSON.stringify({ text }));
        req.end();
    });
}

function createDefinedQueryParams(from, to) {
    let result = {};
    if (from) {
        result.from = from;
    }
    if (to) {
        result.to = to;
    }

    return result;
}

function parseArgs() {
    var ArgumentParser = require('argparse').ArgumentParser;
    var parser = new ArgumentParser();
    parser.addArgument('command');
    parser.addArgument('--from');
    parser.addArgument('--to');
    parser.addArgument('--text');

    return parser.parseArgs();
}

function messageToConsoleString(message) {
    let strings = [];
    if (message.from !== undefined) {
        strings.push(`${red('FROM')}: ${message.from}`);
    }
    if (message.to !== undefined) {
        strings.push(`${red('TO')}: ${message.to}`);
    }
    strings.push(`${green('TEXT')}: ${message.text}`);

    return strings.join('\n');
}
