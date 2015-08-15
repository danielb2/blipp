# blipp ![build](https://travis-ci.org/danielb2/blipp.svg?branch=master)

`blipp` is a simple hapi plugin to display the routes table to console at
startup. It organizes the display per connection so if you have multiple
connections you can easily ensure that you've done your routing table
correctly. This can be difficult to see otherwise.

![image](images/screenshot.png)

## Usage

``` javascript
var Blipp = require('blipp');
var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection();

server.route({
    method: 'GET',
    path: '/somepath',
    config: {
        auth: 'simple',
        description: 'Description to display',
        handler: function (request, reply) {
        // ..
        }
    }
});

server.register({ register: Blipp, options: {} }, function (err) {
    server.start(function () {
        // ..
    });
});
```

## Options

The following options are available:

* `showAuth`: Shows any hapi authentication scheme using server.auth.strategy. Default: false
* `showStart`: Shows route information during startup of server. Default: true


The module also registers the _'info()'_  and _'text()'_ API methods:
```javascript
console.log(server.plugins.blipp.info();
console.log(server.plugins.blipp.text();
var json = JSON.stringify(server.plugins.blipp.info());
```


With showAuth:

![image](images/screenshot-with-auth.png)

## Versions

* 1.x = hapi 7.x
* 2.x = hapi 8.x
