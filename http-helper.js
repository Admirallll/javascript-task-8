'use strict';

module.exports.readResponse = readResponse;

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
