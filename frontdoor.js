"use strict";

var api = require("./lib/api");

module.exports = function(description) {
    return new api.Api(description);
};

for (var key in api)
    module.exports[key] = api[key];