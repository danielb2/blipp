// Load modules
var Chalk = require('chalk');
var Hoek = require('hoek');
var Joi = require('joi');


// Declare internals
var internals = {
    schema: {
        showAuth: Joi.boolean().default(false)
    }
};


exports.register = function (server, options, next) {

    var validation = Joi.validate(options, internals.schema);
    Hoek.assert(validation.error === null, 'Invalid Blipp option(s)');
    options = validation.value;

    server.on('start', function () {

        var routingTable = server.table();

        routingTable.forEach(function (connection) {

            var title = Chalk.underline(connection.info.uri);
            if (connection.labels.length) {
                var labels = '[' + Chalk.magenta(connection.labels.join(', ')) + ']';
                title += ' ' + labels;
            }
            console.log(Chalk.cyan(title));

            internals.printTable(connection.table, options);
        });
    });

    next();
};


exports.register.attributes = {
    pkg: require('../package.json')
};


internals.printTable = function (routes, options) {

    var routesShow = [];

    for (var i = 0, il = routes.length; i < il; ++i) {
        var route = routes[i];

        var defaultStrategy = Hoek.reach(route, 'connection.auth.settings.default.strategies.0', { default: false });
        var authStrategy = route.settings.auth ? route.settings.auth.strategies.toString() : false;

        if (route.settings.auth === undefined) {
            authStrategy = defaultStrategy;
        }

        var show = {
            method: route.method.toUpperCase(),
            path: route.path,
            auth: authStrategy,
            description: route.settings.description || ''
        };

        routesShow.push(show);
    }

    routesShow.sort(function (a, b) {

        return a.path.localeCompare(b.path);
    });

    for (i = 0, il = routesShow.length; i < il; ++i) {
        show = routesShow[i];

        var method = internals.formatMethod(show.method);
        var description = internals.formatDescription(show.description);
        var auth = internals.formatAuth(show.auth);
        var path = internals.formatPath(show.path);

        if (options.showAuth) {
            console.log(method, path, auth, description);
        } else {
            console.log(method, path, description);
        }
    }
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
