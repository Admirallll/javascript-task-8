'use strict';

module.exports.execute = execute;
module.exports.isStar = true;

const request = require('request');
const chalk = require('chalk');

const rootUrl = 'http://localhost:8080/messages';

const red = chalk.hex('#f00');
const green = chalk.hex('#0f0');
const gray = chalk.hex('#777');
const yellow = chalk.hex('#ff0');

function execute() {
    const { from, to, text, command, verbosity, id } = parseArgs();
    if (command === 'list') {
        return listRequest(from, to, verbosity);
    } else if (command === 'send') {
        return sendRequest({ from, to, text }, verbosity);
    } else if (command === 'delete') {
        return deleteRequest(id);
    } else if (command === 'edit') {
        return editRequest(id, text);
    }
}

function listRequest(from, to, verbosity) {
    return new Promise(resolve => {
        request.get({ uri: rootUrl, qs: createDefinedQueryParams(from, to) })
            .on('response', res => {
                readResponse(res).then(result => {
                    result = result.map(message => messageToConsoleString(message, verbosity));
                    resolve(result.join('\n\n'));
                });
            });
    });
}

function deleteRequest(id) {
    return new Promise(resolve => {
        request.delete(rootUrl + `/${id}`)
            .on('response', res => {
                readResponse(res).then(result => {
                    if (result.status === 'ok') {
                        resolve('DELETED');
                    }
                });
            });
    });
}

function editRequest(id, text) {
    return new Promise(resolve => {
        request.patch({ uri: rootUrl + `/${id}`, form: JSON.stringify({ text }) })
            .on('response', res => {
                readResponse(res).then(result => {
                    resolve(messageToConsoleString(result));
                });
            });
    });
}

function sendRequest(message, verbosity) {
    const { from, to, text } = message;

    return new Promise(resolve => {
        request.post({
            uri: rootUrl,
            qs: createDefinedQueryParams(from, to),
            form: JSON.stringify({ text }) })
            .on('response', res => {
                readResponse(res).then(
                    result => resolve(messageToConsoleString(result, verbosity))
                );
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
    parser.addArgument('-v', { action: 'storeTrue', dest: 'verbosity' });
    parser.addArgument('--from');
    parser.addArgument('--id');
    parser.addArgument('--to');
    parser.addArgument('--text');

    return parser.parseArgs();
}

function messageToConsoleString(message, verbosity) {
    let strings = [];
    if (verbosity) {
        strings.push(`${yellow('ID')}: ${message.id}`);
    }
    if (message.from !== undefined) {
        strings.push(`${red('FROM')}: ${message.from}`);
    }
    if (message.to !== undefined) {
        strings.push(`${red('TO')}: ${message.to}`);
    }
    let textString = `${green('TEXT')}: ${message.text}`;
    if ('edited' in message) {
        textString += `${gray('(edited)')}`;
    }
    strings.push(textString);

    return strings.join('\n');
}
