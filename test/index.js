// Load modules

var Hapi = require('hapi');
var Code = require('code');
var Lab = require('lab');

var Blipp = require('../');


// Test shortcuts

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.test;


var internals = {
    validateFunc: function (username, password, callback) {

        callback(err, true, {});
    }
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

    server.register([ { register: Blipp, options: options.blippOptions } ], function (err) {

        server.register([main], { select: 'first' }, function (err) {

            server.register([api], { select: 'second' }, function (err) {

                expect(err).to.not.exist();
                callback(server);
            });
        });
    });

    server.start();
};

describe('routes', function () {

    it('print route information', function (done) {

        internals.prepareServer(false, function (server) {

            setTimeout(done, 20);
        });
    });

    it('print route information with auth', function (done) {

        internals.prepareServer({ blippOptions: { showAuth: true }, authType: 'findme' }, function (server) {

            setTimeout(done, 20);
        });
    });

    it('print route information with default', function (done) {

        internals.prepareServer({ blippOptions: { showAuth: true }, authType: 'default' }, function (server) {

            setTimeout(done, 20);
        });
    });

    it('fails with invalid options', function (done) {

        var invalidOptions = function () {

            internals.prepareServer({ blippOptions: { derp: true }}, function (server) {

            });
        };
        expect(invalidOptions).to.throw();
        done();
    });
});
