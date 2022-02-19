import { after, before, suite, test } from 'mocha';
import { createServer } from 'http';
import { Writable } from 'stream';
import { strict as assert } from 'assert';
import superagent from 'superagent';
import supertest from 'supertest';
import { JSON22 } from 'json22';
import { json22Plugin } from '../index.js';



suite('Response tests', () => {

    class TypedModel {
        constructor(data) {
            this.a = data?.a;
            this.b = data?.b;
        }
        valueOf() {
            return { a: this.a, b: this.b };
        }
    }

    const context = { TypedModel };

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
                    res.writeHead(200, {'Content-Type': req.url === '/json' ? 'application/json' : JSON22.mimeType});
                    const data = { date: new Date(), typedModel: new TypedModel({ a: 42 }) };
                    res.end(req.url === '/json' ? JSON.stringify(data) : JSON22.stringify(data));
                    callback();
                }
            }));
        });
        server.listen(4445);
        server.on('listening', done);
    });

    after(done => {
        server.close(done);
    });

    test('no plugin', async () => {
        const resp = await superagent.get('http://localhost:4445/');
        assert.equal(resp.status, 200);
    });

    test('plugin with no parameters', async () => {
        const data = { date: new Date() };
        await assert.rejects(
            superagent.post('http://localhost:4445/').use(json22Plugin()).send(data),
            { message: 'Constructor TypedModel not defined in the context' }
        );
    });

    test('plugin with parameters', async () => {
        const data = { date: new Date() };
        const resp = await superagent
                .post('http://localhost:4445/')
                .use(json22Plugin({ json22ParseOptions: { context } }))
                .send(data);
        assert.equal(typeof resp.body, 'object');
        assert.deepEqual(resp.body.date.constructor.name, 'Date');
        assert.deepEqual(resp.body.typedModel.constructor.name, 'TypedModel');
    });

    test('parse json', async () => {
        const data = { date: new Date() };
        const resp = await superagent
            .post('http://localhost:4445/json')
            .use(json22Plugin({ json22ParseOptions: { context } }))
            .send(data);
        assert.equal(typeof resp.body, 'object');
        assert.deepEqual(resp.body.date.constructor.name, 'String');
    });

    test('isolated agent', async () => {
        const agent = superagent.agent();
        agent.use(json22Plugin({ json22ParseOptions: { context } }));
        const data = { date: new Date() };
        const resp = await agent.post('http://localhost:4445/').send(data);
        assert.equal(typeof resp.body, 'object');
        assert.deepEqual(resp.body.date.constructor.name, 'Date');
        assert.deepEqual(resp.body.typedModel.constructor.name, 'TypedModel');
    });

    test('supertest with plugin', async () => {
        const data = { date: new Date() };
        const resp = await supertest(server)
            .post('/')
            .use(json22Plugin({ json22ParseOptions: { context } }))
            .send(data);
        assert.equal(typeof resp.body, 'object');
        assert.deepEqual(resp.body.date.constructor.name, 'Date');
        assert.deepEqual(resp.body.typedModel.constructor.name, 'TypedModel');
    });

});
