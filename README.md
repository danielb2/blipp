`blipp` is a simple hapi plugin to display the routes table to console at startup

![image](https://github.com/danielb2/blipp/raw/master/screenshot.png)

# Usage

``` javascript
    var Blipp = require('blipp');
    var Hapi = require('hapi');

    var server = new Hapi.Server();
    server.connection();

    server.route({
        method: 'GET',
        path: '/somepath',
        handler: function (request, reply) {
            // ..
        }
    });

    server.register(Blipp, function(err) {
        server.start(function () {
            // ..
        });
    });
```
