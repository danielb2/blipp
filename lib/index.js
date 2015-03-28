// Load modules
var Chalk = require('chalk');


// Declare internals
var internals = {};


exports.register = function (server, options, next) {

    server.on('start', function () {

        var routingTable = server.table();
        var connections = [];

        routingTable.forEach(function (connection) {

            var title = Chalk.underline(connection.info.uri);
            if (connection.labels.length) {
                var labels = '[' + Chalk.magenta(connection.labels.join(', ')) + ']';
                title += ' ' + labels;
            }
            console.log(Chalk.cyan(title));

            internals.printTable(connection.table);
        });
    });

    next();
};


exports.register.attributes = {
    pkg: require('../package.json')
};


internals.printTable = function (routes) {

    var routesShow = [];

    for (var i = 0, il = routes.length; i < il; ++i) {
        var route = routes[i];

        var show = {
            method: route.method.toUpperCase(),
            path: route.path,
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
        var path = internals.formatPath(show.path);

        console.log(method, path, description);
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

internals.formatDescription = function (description) {
    description = description || '';
    description = Chalk.yellow(description);
    return description;
};
