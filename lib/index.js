'use strict';

// Load modules
const Chalk = require('chalk');
const Hoek = require('@hapi/hoek');
const Joi = require('joi');
const Pkg = require('../package.json');
const Table = require('easy-table');


// Declare internals
const internals = {
    schema: {
        showAuth: Joi.boolean().default(false),
        showScope: Joi.boolean().default(false),
        showStart: Joi.boolean().default(true)
    }
};

exports.register = function (server, options) {

    const result = Joi.object(internals.schema).validate(options);
    Hoek.assert(!result.error, result.error && result.error.annotate());
    options = result.value;

    server.expose('text', function () {

        const info = this.info();
        return internals.printableInfo(info, options);
    });

    server.expose('info', () => {

        return internals.getRouteInfo(server, options);
    });

    if (options.showStart) {
        server.events.on('start', () => {

            const out = server.plugins[Pkg.name].text();
            console.log(out);
        });
    }
};

internals.printableInfo = function (connections, options) {

    let out = '';
    for (let i = 0; i < connections.length; ++i) {
        const connection = connections[i];

        out += internals.printableConnection(connection, options);
    }

    return out;
};


internals.printableConnection = function (connection, options) {

    let out = internals.printableTitle(connection, options) + '\n';
    out += internals.printableRoutes(connection.routes, options);
    return out;
};


internals.printableRoutes = function (routes, options) {

    const out = [];

    routes.forEach((show) => {

        const row = {
            method: internals.formatMethod(show.method),
            path: internals.formatPath(show.path),
            auth: internals.formatAuth(show.auth),
            scope: internals.formatScope(show.scope),
            description: internals.formatDescription(show.description)
        };

        if (!options.showAuth) {
            delete row.auth;
        }

        if (!options.showScope) {
            delete row.scope;
        }

        out.push(row);
    });

    return Table.print(out);
};


internals.printableTitle = function (connection) {

    const title = Chalk.underline(connection.uri);
    return Chalk.cyan(title);
};


internals.getRouteInfo = function (server, options) {

    const routingTable = server.table();

    const connectionInfo = {
        uri: server.info.uri,
        routes: []
    };

    internals.connectionInfo(server, routingTable, options, connectionInfo);

    return [connectionInfo];
};

internals.connectionInfo = function (server, routes, options, connectionInfo) {

    for (let i = 0; i < routes.length; ++i) {
        const route = routes[i];

        const defaultStrategy = Hoek.reach(server, 'auth.settings.default.strategies');
        let authStrategy = route.settings.auth ? route.settings.auth.strategies.toString() : false;
        let authScope = [];

        const required = Hoek.reach(route, 'settings.auth.access.0.scope.required', { default: '' });
        if (required !== '' ) {
            authScope.push(required.map((item) => `+${item}`).join(', '));
        }

        const forbidden = Hoek.reach(route, 'settings.auth.access.0.scope.forbidden', { default: '' });
        if (forbidden !== '' ) {
            authScope.push(forbidden.map((item) => `!${item}`).join(', '));
        }

        const selection = Hoek.reach(route, 'settings.auth.access.0.scope.selection', { default: '' });
        if (selection !== '') {
            authScope.push(selection.join(', '));
        }

        if (authScope.length > 0) {
            authScope = authScope.join(', ');
        }
        else {
            authScope = false;
        }

        if (route.settings.auth === undefined) {
            authStrategy = defaultStrategy ? String(defaultStrategy) : false;
        }

        const row = {
            method: route.method.toUpperCase(),
            path: route.path,
            auth: authStrategy,
            scope: authScope,
            description: route.settings.description || ''
        };

        if (!options.showAuth) {
            delete row.auth;
        }

        if (!options.showScope) {
            delete row.scope;
        }

        connectionInfo.routes.push(row);
    }

    connectionInfo.routes.sort((a, b) => a.path.localeCompare(b.path));
};


internals.formatPath = function (path) {

    path = path.replace(/({.*?})/g, Chalk.gray('$1'));
    return path;
};


internals.formatMethod = function (method) {

    method = method.toUpperCase();
    method = Chalk.green(method);
    return method;
};

internals.formatAuth = function (auth) {

    auth = String(auth);
    if (auth === 'false') {
        auth = Chalk.red('none');
    }
    else {
        auth = Chalk.green(auth);
    }

    return auth;
};

internals.formatScope = function (scope) {

    scope = String(scope);
    if (scope === 'false') {
        scope = Chalk.red('none');
    }
    else {
        scope = Chalk.green(scope);
    }

    return scope;
};

internals.formatDescription = function (description) {

    description = description || '';
    description = Chalk.yellow(description);

    return description;
};

exports.pkg = Pkg;
