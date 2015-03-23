`blipp` is a simple hapi plugin to display the routes table to console at
startup. It organizes the display per connection so if you have multiple
connections you can easily ensure that you've done your routing table
correctly. This can be difficult to see otherwise.

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

# Versions

* 1.x = hapi 7.x
* 2.x = hapi 8.x
