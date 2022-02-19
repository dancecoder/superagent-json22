import { createServer } from 'http'
import { strict as assert } from 'assert'
import { Writable } from 'stream';

import { suite, before, after, test } from 'mocha';
import { JSON22 } from 'json22';
import superagent from 'superagent';
import { json22Plugin } from '../index.js';


suite('Request interceptor tests', () => {

    let server;

    before(done => {
        server = createServer(function (req, res) {
            const chunks = [];
            req.pipe(new Writable({
                write(chunk, encoding, callback) {
                    chunks.push(chunk);
                    callback();
                },
                final(callback) {
                    const buffer = Buffer.concat(chunks);
                    const contentText = buffer.toString();
                    const contentType = req.headers['content-type'];
                    const accept = req.headers['accept'];
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ contentType, contentText, accept }));
                    callback();
                }
            }));
        });
        server.listen(4444);
        server.on('listening', done);
    });

    after(done => {
        server.close(done);
    });

    test('no plugin', async () => {
        const resp = await superagent.get('http://localhost:4444/');
        assert.equal(resp.status, 200);
    });

    test('plugin with no parameters', async () => {
        const data = { date: new Date() };
        const resp = await superagent.post('http://localhost:4444/').use(json22Plugin()).send(data);
        const contentType = JSON22.mimeType;
        const contentText = JSON22.stringify(data);
        const accept = JSON22.mimeType;
        assert.deepEqual(resp.body, { contentType, contentText, accept });
    });

    test('isolated agent', async () => {
        const agent = superagent.agent();
        agent.use(json22Plugin());
        const data = { date: new Date() };
        const resp = await agent.post('http://localhost:4444/').send(data);
        const contentType = JSON22.mimeType;
        const contentText = JSON22.stringify(data);
        const accept = JSON22.mimeType;
        assert.deepEqual(resp.body, { contentType, contentText, accept });
    });

    test('http GET method', async () => {
        const resp = await superagent.get('http://localhost:4444/').use(json22Plugin());
        assert.equal(resp.status, 200);
        const contentText = '';
        const accept = JSON22.mimeType;
        assert.deepEqual(resp.body, { contentText, accept });
    });

});
