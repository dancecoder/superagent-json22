/*
MIT License

Copyright (c) 2022 Dmitry Dutikov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
import { JSON22 } from 'json22';

const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH'];

/**
 * @param {Json22SuperagentPluginOptions} [options]
 * @return {request.Plugin}
 * */
export function json22Plugin(options) {
    return requestPlugin.bind(options ?? {});
}

/**
 * @this Json22SuperagentPluginOptions
 * @param {SuperAgentRequest} request
 **/
function requestPlugin(request) {
    if (METHODS_WITH_BODY.indexOf(request.method) > -1) {
        request.type(JSON22.mimeType);
        request.serialize(data => JSON22.stringify(data, this.json22StringifyOptions));
    }
    request.accept(JSON22.mimeType);
    request.buffer(true); // required for parsing in node environment
    request.parse((textOrResp, cb) => {
        if (cb == null) {
            return JSON22.parse(textOrResp, this.json22ParseOptions);
        } else {
            json22Parse(textOrResp, cb, this.json22ParseOptions);
        }
    });
}


function json22Parse(res, fn, json22ParseOptions) {
    const chunks = [];
    res.setEncoding('utf8');
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', function () {
        try {
            const text = chunks.join('');
            const body = JSON22.parse(text, json22ParseOptions);
            res.text = text
            fn(undefined, body);
        } catch (e) {
            e.rawResponse = chunks.join('');
            e.statusCode = res.statusCode;
            fn(e);
        }
    });
}
