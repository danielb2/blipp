'use strict';

// Load modules
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Lab = require('@hapi/lab');

const Blipp = require('../lib/');
const Pkg = require('../package.json');

// Test shortcuts

const lab = exports.lab = Lab.script();
const { describe, it } = lab;
const expect = Code.expect;

// only one connection; results are in alphabetical order
const internals = {
    validateFunc: function (request, username, password, h) {

        return { isValid: true, credentials: { scope: ['tester'] } };
    },
    result: [{
        routes: [
            { method: 'GET', path: '/', description: 'main index' },
            { method: 'GET', path: '/all', description: 'a route on all connections' },
            { method: 'GET', path: '/api', description: 'api routes' },
            { method: 'POST', path: '/apost/{foo}/comment/{another}', description: '' },
            { method: 'GET', path: '/hi', description: '' },
            { method: 'DELETE', path: '/post/{id}', description: '' }
        ]
    }],
    authResult: [{
        routes: [
            { method: 'GET', path: '/', description: 'main index', auth: false },
            { method: 'GET', path: '/all', description: 'a route on all connections', auth: false },
            { method: 'GET', path: '/api', description: 'api routes', auth: false },
            { method: 'POST', path: '/apost/{foo}/comment/{another}', description: '', auth: false },
            { method: 'GET', path: '/hi', description: '', auth: 'findme' },
            { method: 'DELETE', path: '/post/{id}', description: '', auth: false }
        ]
    }],
    scopeResult: [{
        routes: [
            { method: 'GET', path: '/', description: 'main index', auth: false, scope: false },
            { method: 'GET', path: '/all', description: 'a route on all connections', auth: false, scope: false },
            { method: 'GET', path: '/api', description: 'api routes', auth: false, scope: false },
            { method: 'POST', path: '/apost/{foo}/comment/{another}', description: '', auth: false, scope: false },
            { method: 'GET', path: '/hi', description: '', auth: 'findme', scope: '+tester1, !tester3, tester2' },
            { method: 'DELETE', path: '/post/{id}', description: '', auth: false, scope: false }
        ]
    }],
    requiredScopeResult: [{
        routes: [
            { method: 'GET', path: '/', description: 'main index', auth: false, scope: false },
            { method: 'GET', path: '/all', description: 'a route on all connections', auth: false, scope: false },
            { method: 'GET', path: '/api', description: 'api routes', auth: false, scope: false },
            { method: 'POST', path: '/apost/{foo}/comment/{another}', description: '', auth: false, scope: false },
            { method: 'GET', path: '/hi', description: '', auth: 'findme', scope: '+tester1' },
            { method: 'DELETE', path: '/post/{id}', description: '', auth: false, scope: false }
        ]
    }],
    forbiddenScopeResult: [{
        routes: [
            { method: 'GET', path: '/', description: 'main index', auth: false, scope: false },
            { method: 'GET', path: '/all', description: 'a route on all connections', auth: false, scope: false },
            { method: 'GET', path: '/api', description: 'api routes', auth: false, scope: false },
            { method: 'POST', path: '/apost/{foo}/comment/{another}', description: '', auth: false, scope: false },
            { method: 'GET', path: '/hi', description: '', auth: 'findme', scope: '!tester3' },
            { method: 'DELETE', path: '/post/{id}', description: '', auth: false, scope: false }
        ]
    }],
    selectionScopeResult: [{
        routes: [
            { method: 'GET', path: '/', description: 'main index', auth: false, scope: false },
            { method: 'GET', path: '/all', description: 'a route on all connections', auth: false, scope: false },
            { method: 'GET', path: '/api', description: 'api routes', auth: false, scope: false },
            { method: 'POST', path: '/apost/{foo}/comment/{another}', description: '', auth: false, scope: false },
            { method: 'GET', path: '/hi', description: '', auth: 'findme', scope: 'tester2' },
            { method: 'DELETE', path: '/post/{id}', description: '', auth: false, scope: false }
        ]
    }],
    defaultAuthResult: [{
        routes: [
            { method: 'GET', path: '/', description: 'main index', auth: false },
            { method: 'GET', path: '/all', description: 'a route on all connections', auth: 'findme' },
            { method: 'GET', path: '/api', description: 'api routes', auth: 'findme' },
            { method: 'POST', path: '/apost/{foo}/comment/{another}', description: '', auth: 'findme' },
            { method: 'GET', path: '/hi', description: '', auth: 'findme' },
            { method: 'DELETE', path: '/post/{id}', description: '', auth: 'findme' }
        ]
    }]

};

internals.prepareServer = async function (options) {

    const server = new Hapi.Server();

    try {
        await server.register(require('@hapi/basic'));

        if (options.authType === 'findme') {
            server.auth.strategy('findme', 'basic', { validate: internals.validateFunc });
        }

        if (options.authType === 'default') {
            server.auth.strategy('findme', 'basic', { validate: internals.validateFunc });
            server.auth.default('findme');
        }

    }
    catch (err) {
        console.log('Error: Couldn\'t register @hapi/basic', err);
    }

    const api = {
        register: function (plugin, pluginOptions) {

            plugin.route({
                method: 'GET',
                path: '/api',
                options: {
                    description: 'api routes',
                    handler: function (request, h) {

                        return 'index!';
                    }
                }
            });
        }
    };

    api.name = 'an api plugin';
    api.version = '1.0.0';

    const main = {
        register: function (plugin, pluginOptions) {

            plugin.route({
                method: 'GET',
                path: '/',
                options: {
                    auth: false,
                    description: 'main index',
                    handler: function (request, h) {

                        return 'index!';
                    }
                }
            });

            let authOptions = false;
            if (options.authType) {
                authOptions = {
                    strategy: 'findme'
                };
                switch (options.scopeType) {
                    case 'required':
                        authOptions.scope = ['+tester1'];
                        break;
                    case 'selection':
                        authOptions.scope = ['tester2'];
                        break;
                    case 'forbidden':
                        authOptions.scope = ['!tester3'];
                        break;
                    default:
                        authOptions.scope = ['+tester1', 'tester2', '!tester3'];
                        break;
                }
            }

            plugin.route({
                method: 'GET',
                path: '/hi',
                options: {
                    auth: authOptions,
                    handler: function (request, h) {

                        return 'Hello!';
                    }
                }
            });

            plugin.route({
                method: 'POST',
                path: '/apost/{foo}/comment/{another}',
                handler: function (request, h) {

                    return '';
                }
            });

            plugin.route({
                method: 'DELETE',
                path: '/post/{id}',
                handler: function (request, h) {

                    return '';
                }
            });
        }
    };

    main.name = 'main';
    main.version = '0.1.1';

    server.route({
        method: 'GET',
        path: '/all',
        options: {
            description: 'a route on all connections',
            handler: function (request, h) {

                return 'index!';
            }
        }
    });

    try {
        await server.register([
            { plugin: Blipp, options: options.blippOptions },
            { plugin: main,  options: {} },
            { plugin: api,   options: {} }
        ]);

        await server.start();

        expect(server).to.exist();

        return server;
    }
    catch (err) {
        expect(err).to.not.exist();
    }
};

describe('routes', () => {

    it('print route information', async () => {

        const saved = console.log;
        let out = '';
        console.log = (str) => {

            out += str;
        };

        await internals.prepareServer(false);

        console.log = saved;
        expect(out).to.not.match(/none.*main index/);
        expect(out).to.not.match(/none.*api index/);
        expect(out).to.match(/DELETE.*post/);

    });

    it('gets route information', async () => {

        const blippOptions = {
            showAuth: false,
            showStart: false
        };

        const server = await internals.prepareServer({ blippOptions });

        const info = server.plugins[Pkg.name].info();
        delete info[0].uri;
        expect(info).to.equal(internals.result);
        const text = server.plugins[Pkg.name].text();
        expect(text).to.not.match(/none.*main index/);
    });

    it('gets route information with auth', async () => {

        const blippOptions = {
            showAuth: true,
            showStart: false
        };

        const server = await internals.prepareServer({ blippOptions, authType: 'findme' });

        const info = server.plugins[Pkg.name].info();
        delete info[0].uri;
        expect(info).to.equal(internals.authResult);

        const text = server.plugins[Pkg.name].text();
        expect(text).to.match(/none.*main index/);
        expect(text).to.match(/none.*api routes/);
        expect(text).to.match(/hi.*findme/);
    });

    it('gets route information with all scope', async () => {

        const blippOptions = {
            showAuth: true,
            showScope: true,
            showStart: false
        };

        const server = await internals.prepareServer({ blippOptions, authType: 'findme' });

        const info = server.plugins[Pkg.name].info();
        delete info[0].uri;
        expect(info).to.equal(internals.scopeResult);

        const text = server.plugins[Pkg.name].text();
        expect(text).to.match(/none.*main index/);
        expect(text).to.match(/none.*api routes/);
        expect(text).to.match(/hi.*findme/);
    });

    it('gets route information with required scope', async () => {

        const blippOptions = {
            showAuth: true,
            showScope: true,
            showStart: false
        };

        const server = await internals.prepareServer({ blippOptions, authType: 'findme', scopeType: 'required' });

        const info = server.plugins[Pkg.name].info();
        delete info[0].uri;
        expect(info).to.equal(internals.requiredScopeResult);

        const text = server.plugins[Pkg.name].text();
        expect(text).to.match(/none.*main index/);
        expect(text).to.match(/none.*api routes/);
        expect(text).to.match(/hi.*findme/);
    });

    it('gets route information with selection scope', async () => {

        const blippOptions = {
            showAuth: true,
            showScope: true,
            showStart: false
        };

        const server = await internals.prepareServer({ blippOptions, authType: 'findme', scopeType: 'selection' });

        const info = server.plugins[Pkg.name].info();
        delete info[0].uri;
        expect(info).to.equal(internals.selectionScopeResult);

        const text = server.plugins[Pkg.name].text();
        expect(text).to.match(/none.*main index/);
        expect(text).to.match(/none.*api routes/);
        expect(text).to.match(/hi.*findme/);
    });

    it('gets route information with forbidden scope', async () => {

        const blippOptions = {
            showAuth: true,
            showScope: true,
            showStart: false
        };

        const server = await internals.prepareServer({ blippOptions, authType: 'findme', scopeType: 'forbidden' });

        const info = server.plugins[Pkg.name].info();
        delete info[0].uri;
        expect(info).to.equal(internals.forbiddenScopeResult);

        const text = server.plugins[Pkg.name].text();
        expect(text).to.match(/none.*main index/);
        expect(text).to.match(/none.*api routes/);
        expect(text).to.match(/hi.*findme/);
    });


    it('gets route information with default', async () => {

        const blippOptions = {
            showAuth: true,
            showStart: false
        };

        const server = await internals.prepareServer({ blippOptions, authType: 'default' });

        const info = server.plugins[Pkg.name].info();
        delete info[0].uri;
        expect(info).to.equal(internals.defaultAuthResult);
        const text = server.plugins[Pkg.name].text();
        expect(text).to.match(/none.*main index/);
        expect(text).to.match(/findme.*api routes/);
    });

    it('fails with invalid options', async () => {

        try {
            await internals.prepareServer({ blippOptions: { derp: true } });
        }
        catch (err) {
            expect(err).to.exist();
        }
    });
});
