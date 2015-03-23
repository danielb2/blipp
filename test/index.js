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

    var second = server.select('second');

    var plug = {
        register: function (plugin, options, next) {

            plugin.route({
                method: 'GET',
                path: '/pluginroute',
                config: {
                    description: 'a route from plugin',
                    handler: function (request, reply) {
                        reply('index!');
                    }
                }
            });
            return next();
        }
    };
    plug.register.attributes = {
        name: 'a plugin',
        version: '0.1.1'
    };

    server.route({
        method: 'GET',
        path: '/second',
        config: {
            description: 'a route on second connection',
            handler: function (request, reply) {
                reply('index!');
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/',
        config: {
            description: 'a route description',
            handler: function (request, reply) {
                reply('index!');
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/hi',
        handler: function (request, reply) {
            reply('Hello!');
        }
    });

    server.route({
        method: 'POST',
        path: '/apost/{foo}/comment/{another}',
        handler: function (request, reply) {
            reply('');
        }
    });

    server.route({
        method: 'DELETE',
        path: '/post/{id}',
        handler: function (request, reply) {
            reply('');
        }
    });

    server.register([Blipp, plug], function (err) {

        expect(err).to.not.exist();
        callback(server);
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
