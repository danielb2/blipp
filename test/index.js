// Load modules

var Hapi = require('hapi');
var Code = require('code');
var Lab = require('lab');


// Test shortcuts

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.test;


var internals = {};

internals.prepareServer = function (callback) {

    var server = new Hapi.Server();

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
        path: '/apost/{foo}',
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
    server.pack.register({ plugin: require('../')}, function (err) {


        expect(err).to.not.exist;
        callback(server);
    });
};

describe('routes', function () {

    it('print route information', function (done) {
        internals.prepareServer(function (server) {
            done();
        });
    })
});


