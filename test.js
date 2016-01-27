#!/usr/bin/env node
var i = 0;
exports.callback0 = function () {
    var debug = require('debug')('newyear');
    var app = require('./app');

    app.set('port', process.env.PORT || 8082);

    var server = app.listen(app.get('port'), function() {
        debug('Express server listening on port ' + server.address().port);
    });

}

//setInterval(function(){exports.callback0()},3000);