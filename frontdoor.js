"use strict";

var Route = require("./route");
var Section = require("./section");
var middleware = require("./middleware");
var api = require("./lib/api");

module.exports = function(description) {
    return new api.Api(description);
};

module.exports.Section = Section;
module.exports.Route = Route;
module.exports.midleware = middleware;


