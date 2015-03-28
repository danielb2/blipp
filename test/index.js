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


var internals = {};

internals.prepareServer = function (callback) {

    var server = new Hapi.Server();
    server.connection({ labels: ['first'] });
    server.connection({ labels: ['second'] });
    server.connection();

    var api = {
        register: function (plugin, options, next) {

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
        register: function (plugin, options, next) {

            plugin.route({
                method: 'GET',
                path: '/',
                config: {
                    description: 'main index',
                    handler: function (request, reply) {

                        reply('index!');
                    }
                }
            });

            plugin.route({
                method: 'GET',
                path: '/hi',
                handler: function (request, reply) {

                    reply('Hello!');
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

    server.register([Blipp], function (err) {

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

        internals.prepareServer(function (server) {

            setTimeout(function() { done(); }, 20);
        });
    });
});
