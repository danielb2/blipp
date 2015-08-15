// Load modules

var Hapi = require('hapi');
var Code = require('code');
var Lab = require('lab');

var Blipp = require('../');
var Pkg = require('../package.json');


// Test shortcuts

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.test;


var internals = {
    validateFunc: function (username, password, callback) {

        callback(err, true, {});
    },
    result: [{
        uri: 'http://nero.local',
        labels: ['first'],
        routes: [
            { method: 'GET', path: '/', description: 'main index' },
            { method: 'GET', path: '/all', description: 'a route on all connections' },
            { method: 'POST', path: '/apost/{foo}/comment/{another}', description: '' },
            { method: 'GET', path: '/hi', description: '' },
            { method: 'DELETE', path: '/post/{id}', description: '' }
        ]
    }, {
        uri: 'http://nero.local',
        labels: ['second'],
        routes: [
            { method: 'GET', path: '/all', description: 'a route on all connections' },
            { method: 'GET', path: '/api', description: 'api routes' }
        ]
    }, {
        uri: 'http://nero.local',
        labels: [],
        routes: [{
            method: 'GET',
            path: '/all',
            description: 'a route on all connections'
        }]
    }],
    authResult: [{
        uri: 'http://nero.local',
        labels: ['first'],
        routes: [
            { method: 'GET', path: '/', description: 'main index', auth: false },
            { method: 'GET', path: '/all', description: 'a route on all connections', auth: false },
            { method: 'POST', path: '/apost/{foo}/comment/{another}', description: '', auth: false },
            { method: 'GET', path: '/hi', description: '', auth: 'findme' },
            { method: 'DELETE', path: '/post/{id}', description: '', auth: false }
        ]
    }, {
        uri: 'http://nero.local',
        labels: ['second'],
        routes: [
            { method: 'GET', path: '/all', description: 'a route on all connections', auth: false },
            { method: 'GET', path: '/api', description: 'api routes', auth: false }
        ]
    }, {
        uri: 'http://nero.local',
        labels: [],
        routes: [
            { method: 'GET', path: '/all', description: 'a route on all connections', auth: false }
        ]
    }],
    defaultAuthResult: [{
        uri: 'http://nero.local',
        labels: ['first'],
        routes: [
            { method: 'GET', path: '/', description: 'main index', auth: false },
            { method: 'GET', path: '/all', description: 'a route on all connections', auth: 'findme' },
            { method: 'POST', path: '/apost/{foo}/comment/{another}', description: '', auth: 'findme' },
            { method: 'GET', path: '/hi', description: '', auth: 'findme' },
            { method: 'DELETE', path: '/post/{id}', description: '', auth: 'findme' }
        ]
    }, {
        uri: 'http://nero.local',
        labels: ['second'],
        routes: [
            { method: 'GET', path: '/all', description: 'a route on all connections', auth: 'findme' },
            { method: 'GET', path: '/api', description: 'api routes', auth: 'findme' }
        ]
    }, {
        uri: 'http://nero.local',
        labels: [],
        routes: [
            { method: 'GET', path: '/all', description: 'a route on all connections', auth: 'findme' }
        ]
    }]

};

internals.prepareServer = function (options, callback) {

    var server = new Hapi.Server();
    server.connection({ labels: ['first'] });
    server.connection({ labels: ['second'] });
    server.connection();
    server.register(require('hapi-auth-basic'), function (err) {


        if (options.authType === 'findme') {
            server.auth.strategy('findme', 'basic', { validateFunc: internals.validateFunc });
        }

        if (options.authType === 'default') {
            server.auth.strategy('findme', 'basic', { validateFunc: internals.validateFunc });
            server.auth.default('findme');
        }
    });
    var api = {
        register: function (plugin, pluginOptions, next) {

            plugin.route({
                method: 'GET',
                path: '/api',
                config: {
                    description: 'api routes',
                    handler: function (request, reply) {

                        reply('index!');
                    }
                }
            });
            return next();
        }
    };

    api.register.attributes = {
        name: 'an api plugin',
        version: '0.1.1'
    };

    var main = {
        register: function (plugin, pluginOptions, next) {

            plugin.route({
                method: 'GET',
                path: '/',
                config: {
                    auth: false,
                    description: 'main index',
                    handler: function (request, reply) {

                        reply('index!');
                    }
                }
            });

            plugin.route({
                method: 'GET',
                path: '/hi',
                config: {
                    auth: options.authType ? 'findme' : null,
                    handler: function (request, reply) {

                        reply('Hello!');
                    }
                }
            });

            plugin.route({
                method: 'POST',
                path: '/apost/{foo}/comment/{another}',
                handler: function (request, reply) {

                    reply('');
                }
            });

            plugin.route({
                method: 'DELETE',
                path: '/post/{id}',
                handler: function (request, reply) {

                    reply('');
                }
            });


            return next();
        }
    };

    main.register.attributes = {
        name: 'main',
        version: '0.1.1'
    };

    server.route({
        method: 'GET',
        path: '/all',
        config: {
            description: 'a route on all connections',
            handler: function (request, reply) {

                reply('index!');
            }
        }
    });

    server.register([{ register: Blipp, options: options.blippOptions }], function (err) {

        server.register([main], { select: 'first' }, function (err) {

            server.register([api], { select: 'second' }, function (err) {

                expect(err).to.not.exist();
                callback(server);
            });
        });
    });

    server.start();
};


internals.fixUri = function (server, connections) {

    for (var i = 0, il = connections.length; i < il; ++i) {
        var connection = connections[i];
        connection.uri = server.info.uri;
    }
};


describe('routes', function () {

    it('print route information', function (done) {

        var saved = console.log;
        var out = '';
        console.log = function (str) {

            out += str;
        };

        internals.prepareServer(false, function (server) {

            setTimeout(function () {

                console.log = saved;
                expect(out).to.not.match(/none.*main index/);
                expect(out).to.match(/DELETE.*post/);
                done();
            }, 20);
        });
    });


    it('gets route information', function (done) {

        internals.prepareServer({ blippOptions: { showAuth: false, showStart: false } }, function (server) {

            var info = server.plugins[Pkg.name].info();
            internals.fixUri(server, internals.result);
            expect(info).to.deep.equal(internals.result);
            var text = server.plugins[Pkg.name].text();
            expect(text).to.not.match(/none.*main index/);
            done();
        });
    });

    it('gets route information with auth', function (done) {

        internals.prepareServer({ blippOptions: { showAuth: true, showStart: false }, authType: 'findme' }, function (server) {

            var info = server.plugins[Pkg.name].info();
            internals.fixUri(server, internals.authResult);
            expect(info).to.deep.equal(internals.authResult);
            var text = server.plugins[Pkg.name].text();
            expect(text).to.match(/none.*main index/);
            expect(text).to.match(/none.*api routes/);
            expect(text).to.match(/hi.*findme/);
            done();
        });
    });

    it('gets route information with default', function (done) {

        internals.prepareServer({ blippOptions: { showAuth: true, showStart: false }, authType: 'default' }, function (server) {

            var info = server.plugins[Pkg.name].info();
            internals.fixUri(server, internals.defaultAuthResult);
            expect(info).to.deep.equal(internals.defaultAuthResult);
            var text = server.plugins[Pkg.name].text();
            expect(text).to.match(/none.*main index/);
            expect(text).to.match(/findme.*api routes/);
            done();
        });
    });

    it('fails with invalid options', function (done) {

        var invalidOptions = function () {

            internals.prepareServer({ blippOptions: { derp: true } }, function (server) {

            });
        };
        expect(invalidOptions).to.throw();
        done();
    });
});
