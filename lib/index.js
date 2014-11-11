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

    for (var i = 0, il = routes.length; i < il; ++i) {
        var route = routes[i];

        var method = route.method.toUpperCase();
        method = Chalk.green(method);
        method = internals.ljust(method, 18);
        var path = internals.ljust(route.path, 30);
        var description = route.settings.description ? route.settings.description : '';
        description = Chalk.yellow(description);

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
