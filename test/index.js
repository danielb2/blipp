'use strict';

// Load modules

const Hapi = require('hapi');
const Code = require('code');
const Lab = require('lab');

const Blipp = require('../lib/');
const Pkg = require('../package.json');

// Test shortcuts
const { expect, it, describe } = exports.lab = require('lab').script();

// only one connection; results are in alphabetical order
var internals = {
    validateFunc: async function (request, username, password, h) {

        return {isValid: true, credentials: null};
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
            { method: 'GET', path: '/all', description: 'a route on all connections', auth: 'findme' },
            { method: 'GET', path: '/api', description: 'api routes', auth: 'findme' },
            { method: 'POST', path: '/apost/{foo}/comment/{another}', description: '', auth: 'findme' },
            { method: 'GET', path: '/hi', description: '', auth: 'findme' },
            { method: 'DELETE', path: '/post/{id}', description: '', auth: 'findme' }
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

    var server = new Hapi.Server();

    try {
        await server.register(require('hapi-auth-basic'));
        
        if (options.authType === 'findme') {
            server.auth.strategy('findme', 'basic', { validate: internals.validateFunc });
        }

        if (options.authType === 'default') {
            server.auth.strategy('findme', 'basic', { validate: internals.validateFunc });
            server.auth.default('findme');
        }
        
    } catch(err) {
        console.log('Error: Couldn\'t register hapi-auth-basic', err);
    }

    var api = {
        register: function (plugin, pluginOptions) {
            plugin.route({
                method: 'GET',
                path: '/api',
                options: {
                    description: 'api routes',
                    auth: options.authType ? 'findme' : null,
                    handler: function (request, h) {

                        return 'index!';
                    }
                }
            });
        }
    };

    api.name = 'an api plugin';
    api.version = '1.0.0';

    var main = {
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

            plugin.route({
                method: 'GET',
                path: '/hi',
                options: {
                    auth: options.authType ? 'findme' : null,
                    handler: function (request, h) {

                        return 'Hello!';
                    }
                }
            });

            plugin.route({
                method: 'POST',
                path: '/apost/{foo}/comment/{another}',
                 options: {
                    auth: options.authType ? 'findme' : null,
                    handler: function (request, h) {

                        return '';
                    }
                }
            });

            plugin.route({
                method: 'DELETE',
                path: '/post/{id}',
                options: {
                    auth: options.authType ? 'findme' : null,
                    handler: function (request, h) {

                        return '';
                    }
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
            auth: options.authType ? 'findme' : null,
            handler: function (request, h) {

                return 'index!';
            }
        }
    });
    
    try {
        await server.register([
            { plugin: Blipp, options: options.blippOptions },
            { plugin: main,  options: {}},
            { plugin: api,   options: {}}
        ]);

        await server.start();

        expect(server).to.exist();

        return server;
    } catch(err) {
        expect(err).to.not.exist();
    }
};

describe('routes', function () {

    it('print route information', async () => {
        
        var saved = console.log;
        var out = '';
        console.log = (str) => out += str;

        const server = await internals.prepareServer(false);
        
        console.log = saved;
        expect(out).to.not.match(/none.*main index/);
        expect(out).to.match(/DELETE.*post/);
        
    });

    it('gets route information', async () => {
        let blippOptions = {
            showAuth: false,
            showStart: false
        };
        
        const server = await internals.prepareServer({blippOptions});
        
        var info = server.plugins[Pkg.name].info();
        delete info[0].uri;
        expect(info).to.equal(internals.result);
        var text = server.plugins[Pkg.name].text();
        expect(text).to.not.match(/none.*main index/);
    });

    it('gets route information with auth', async () => {
        let blippOptions = {
            showAuth: true,
            showStart: false
        };
        
        const server = await internals.prepareServer({ blippOptions, authType: 'findme' });
        
        var info = server.plugins[Pkg.name].info();
        delete info[0].uri;
        expect(info).to.equal(internals.authResult);

        var text = server.plugins[Pkg.name].text();
        expect(text).to.match(/none.*main index/);
        expect(text).to.match(/findme.*api routes/);
        expect(text).to.match(/hi.*findme/);
    });

    it('gets route information with default', async () => {
        let blippOptions = {
            showAuth: true,
            showStart: false
        };
        
        const server = await internals.prepareServer({ blippOptions, authType: 'default' });

        var info = server.plugins[Pkg.name].info();
        delete info[0].uri;
        expect(info).to.equal(internals.defaultAuthResult);
        var text = server.plugins[Pkg.name].text();
        expect(text).to.match(/none.*main index/);
        expect(text).to.match(/findme.*api routes/);
    });

    it('fails with invalid options', async () => {
        try {
            await internals.prepareServer({ blippOptions: { derp: true } })
        } catch(err) {
            expect(err).to.exist();
        };
    });
});
