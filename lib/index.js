// Load modules
var Chalk = require('chalk');


// Declare internals
var internals = {};


exports.register = function (plugin, options, next) {

    for (var i = 0, il = plugin.servers.length; i < il; ++i) {
        var server = plugin.servers[i];
        internals.printTable(server.table());
    }

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
        }
        routesShow.push(show);
    }

    routesShow.sort(function (a,b) {

        return a.path.localeCompare(b.path);
    });

    for (var i = 0, il = routesShow.length; i < il; ++i) {
        var show = routesShow[i];

        var method = internals.formatMethod(show.method);
        var description = internals.formatDescription(show.description);
        var path = internals.ljust(show.path, 30);

        console.log(method, path, description);
    }
};

internals.ljust = function (string, amount, padding) {

    padding = padding || ' ';
    var currentLength = string.length;

    while (string.length < amount) {
        string = string + padding;
    };

    return string;
};


internals.formatMethod = function (method) {
    method = method.toUpperCase();
    method = Chalk.green(method);
    method = internals.ljust(method, 18);
    return method;
};

internals.formatDescription = function (description) {
    description = description || '';
    description = Chalk.yellow(description);
    return description;
};
