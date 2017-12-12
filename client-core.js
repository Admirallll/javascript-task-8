'use strict';

module.exports.execute = execute;
module.exports.isStar = false;

const request = require('request');
const chalk = require('chalk');

const rootUrl = 'http://localhost:8080/messages';

const red = chalk.hex('#f00');
const green = chalk.hex('#0f0');
// const gray = chalk.hex('#777');
// const yellow = chalk.hex('#ff0');

function execute() {
    const { from, to, text, command } = parseArgs();
    if (command === 'list') {
        return listRequest(from, to);
    } else if (command === 'send') {
        return sendRequest({ from, to, text });
    }
}

function listRequest(from, to) {
    return new Promise(resolve => {
        request.get({ uri: rootUrl, qs: createDefinedQueryParams(from, to) })
            .on('response', res => {
                readResponse(res).then(result => {
                    result = result.map(messageToConsoleString);
                    resolve(result.join('\n\n'));
                });
            });
    });
}

function sendRequest(message) {
    const { from, to, text } = message;

    return new Promise(resolve => {
        request.post({
            uri: rootUrl,
            qs: createDefinedQueryParams(from, to),
            form: { text } })
            .on('response', res => {
                readResponse(res).then(result => resolve(messageToConsoleString(result)));
            });
    });
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
