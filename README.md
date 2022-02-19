# SuperAgent JSON22 Plugin
SuperAgent plugin providing support to [JSON22](https://github.com/dancecoder/json22#readme) data format in your applications.

## Features
* Ready to use [SuperAgent](https://visionmedia.github.io/superagent/) plugin
* Parse [JSON22](https://github.com/dancecoder/json22#readme) body content
* Serialize data to JSON22
* Can be used with [SuperTest](https://github.com/visionmedia/supertest#readme)
* Both CJS/ESM modules support

## Installation
```shell
npm install superagent-json22
```

Add plugin to a request
```javascript
import superagent from 'superagent';
import { json22Plugin } from 'superagent-json22';

async function sendData() {
    try {
        return await superagent
            .post('https://example.com/api/data')
            .use(json22Plugin())
            .send(data);
    } catch (e) {
        console.error(e);
    }
}
```

Old-fashioned javascript imports
```javascript
const superagent = require('superagent');
const { json22Plugin } = require('superagent-json22');
```

## Options

Both stringify and parse methods of JSON22 accepts options. You may be interested to define such options at global level as well as with isolated client instance.

`Json22RequestInterceptor` accepts the next options structure

```typescript
interface Json22SuperagentPluginOptions {
    json22ParseOptions?: Json22ParseOptions;
    json22StringifyOptions?: Json22StringifyOptions;
}
```
See also `Json22ParseOptions` and `Json22StringifyOptions` at [JSON22 API description](https://github.com/dancecoder/json22#api)

### Define options on each request
```javascript
import superagent from 'superagent';
import { json22Plugin } from 'superagent-json22';
import { TypedModel } from './models/typed-model.js';

async function sendData() {
    try {
        return await superagent
            .post('https://example.com/api/data')
            .use(json22Plugin({
                json22ParseOptions: { context: { TypedModel } },
            }))
            .send(data);
    } catch (e) {
        console.error(e);
    }
}
```

### Define an agent instance plugin options
```javascript
import superagent from 'superagent';
import { json22Plugin } from 'superagent-json22';
import { TypedModel } from './models/typed-model.js';

const agent = superagent.agent().use(json22Plugin({
    json22ParseOptions: { context: { TypedModel } },
}));

async function sendData() {
    try {
        return await agent.post('https://example.com/api/data').send(data);
    } catch (e) {
        console.error(e);
    }
}
```

## Using with SuperTest
SuperTest uses SuperAgent under the hood. SuperAgent isn't well isolated by SuperTest,
so you can easily use any SuperAgent plugin including superagent-json22. Here is the example.
```javascript
import supertest from 'supertest';
import { appFactory } from '../lib/app/appFatory.js';
import { TypedModel } from '../lib/models/typed-model.js';

suite('Response tests', () => {

    test('supertest with plugin', (done) => {
        const app = appFactory();
        supertest(app)
            .post('/')
            .use(json22Plugin({ json22ParseOptions: { context: { TypedModel } }}))
            .send(data)
            .expect(200)
            .then(resp => done())
            .catch(done);
    });

});
```
