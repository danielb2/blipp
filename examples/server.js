'use strict';

const Hapi = require('hapi');
const Boom = require('boom');
const Blipp = require('../');

const internals = {};

const init = async () => {

    const server = new Hapi.Server();

    await server.register({ plugin: Blipp, options: { showAuth: true } });

    server.auth.scheme('custom', internals.scheme);
    server.auth.strategy('stimpy', 'custom');

    server.route({
        method: 'GET',
        path: '/user/{id}',
        config: {
            auth: 'stimpy',
            description: 'Display user specific info',
            handler: (request, h) => 'Something'
        }
    });

    server.route({
        method: 'GET',
        path: '/user/{id}/profile',
        config: {
            auth: false,
            description: 'Display user public info',
            handler: (request, h) => 'Something'
        }
    });

    server.route({
        method: 'GET',
        path: '/users',
        config: {
            auth: false,
            description: 'List all users',
            handler: (request, h) => 'Something'
        }
    });

    server.route({
        method: 'GET',
        path: '/routes.table',
        config: {
            auth: false,
            description: 'List routes table',
            handler: (request, h) => {

                return request.server.plugins.blipp.info();
            }
        }
    });

    await server.start();
};

init();


internals.scheme = function (server, options) {

    return {
        authenticate: function (request, h) {

            const authorization = request.headers.authorization;
            if (!authorization) {
                throw Boom.unauthorized(null, 'Custom');
            }

            return h.authenticated({ credentials: { user: 'john' } });
        }
    };
};
