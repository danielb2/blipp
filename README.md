`blipp` is a simple hapi plugin to display the routes table to console at startup

![image](https://github.com/danielb2/blipp/raw/master/screenshot.png)

# Usage

``` javascript
    var Hapi = require('hapi');
    var server = new Hapi.Server(8086);
    var Blipp = require('blipp');

    server.route({
        method: 'GET',
        path: '/somepath',
        handler: function (request, reply) {
            // ..
        }
    });

    server.pack.register({ plugin: Blipp }, function(err) {
        server.start(function () {
            // ..
        });
    });
```
