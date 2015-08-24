// Load modules
var Chalk = require('chalk');
var Hoek = require('hoek');
var Joi = require('joi');
var Pkg = require('../package.json');


// Declare internals
var internals = {
    schema: {
        showAuth: Joi.boolean().default(false),
        showStart: Joi.boolean().default(true)
    }
};


exports.register = function (server, options, next) {

    var result = Joi.validate(options, internals.schema);
    Hoek.assert(!result.error, result.error && result.error.annotate());
    options = result.value;

    server.expose('text', function () {

        var info = this.info();
        return internals.printableInfo(info, options);
    });

    server.expose('info', function () {

        return internals.getRouteInfo(server, options);
    });

    if (options.showStart) {
        server.on('start', function () {

            var out = server.plugins[Pkg.name].text();
            console.log(out);
        });
    }

    return next();
};


exports.register.attributes = {
    pkg: Pkg
};


internals.printableInfo = function (connections, options) {

    var out = '';
    for (var i = 0, il = connections.length; i < il; ++i) {
        var connection = connections[i];

        out += internals.printableConnection(connection, options);
    }
    return out;
};


internals.printableConnection = function (connection, options) {

    var out = internals.printableTitle(connection, options) + '\n';
    out += internals.printableRoutes(connection.routes, options);
    return out;
};


internals.printableRoutes = function (routes, options) {

    var out = '';
    for (var i = 0, il = routes.length; i < il; ++i) {
        var show = routes[i];

        var method = internals.formatMethod(show.method);
        var description = internals.formatDescription(show.description);
        var auth = internals.formatAuth(show.auth);
        var path = internals.formatPath(show.path);

        if (options.showAuth) {
            out += [method, path, auth, description].join(' ') + '\n';
        } else {
            out += [method, path, description].join(' ') + '\n';
        }
    }

    return out;
};


internals.printableTitle = function (connection) {

    var title = Chalk.underline(connection.uri);
    if (connection.labels.length) {
        var labels = '[' + Chalk.magenta(connection.labels.join(', ')) + ']';
        title += ' ' + labels;
    }
    return Chalk.cyan(title);
};


internals.getRouteInfo = function (server, options) {

    var connections = [];

    var routingTable = server.table();

    routingTable.forEach(function (connection) {

        var connectionInfo = {
            uri: connection.info.uri,
            labels: connection.labels,
            routes: []
        };

        internals.connectionInfo(connection.table, options, connectionInfo);
        connections.push(connectionInfo);
    });

    return connections;
};

internals.connectionInfo = function (routes, options, connectionInfo) {

    for (var i = 0, il = routes.length; i < il; ++i) {
        var route = routes[i];

        var defaultStrategy = Hoek.reach(route, 'connection.auth.settings.default.strategies');
        var authStrategy = route.settings.auth ? route.settings.auth.strategies.toString() : false;

        if (route.settings.auth === undefined) {
            authStrategy = defaultStrategy ? String(defaultStrategy) : false;
        }

        var show = {
            method: route.method.toUpperCase(),
            path: route.path,
            description: route.settings.description || ''
        };

        if (options.showAuth) {
            show.auth = authStrategy;
        };

        connectionInfo.routes.push(show);
    }

    connectionInfo.routes.sort(function (a, b) {

        return a.path.localeCompare(b.path);
    });
};


internals.formatPath = function (path) {

    path = internals.ljust(path, 30);
    path = path.replace(/({.*?})/g, Chalk.gray('$1'));
    return path;
};


internals.ljust = function (string, amount) {

    var padding = ' ';
    var currentLength = string.length;

    while (string.length < amount) {
        string = string + padding;
    }

    return string;
};


internals.formatMethod = function (method) {

    method = '  ' + method.toUpperCase();
    method = Chalk.green(method);
    method = internals.ljust(method, 18);
    return method;
};

internals.formatAuth = function (auth) {

    if (auth === false) {
        auth = Chalk.red('none');
    } else {
        auth = Chalk.green(auth);
    }
    auth = internals.ljust(auth, 20);
    return auth;
};

internals.formatDescription = function (description) {

    description = description || '';
    description = Chalk.yellow(description);
    return description;
};
