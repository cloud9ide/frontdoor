"use strict";

var api = require("./api");

module.exports = function(options, imports, register) {
    
    var connect = imports.connect;
    connect.useSetup(connect.getModule().logger('":method :url" - ":referrer" [:date]'));
        
    var root = new api.Api();
    
    connect.useMain(function(req, res, next) {
        root.handle(req, res, next);
    });
    
    register(null, {
        "api": {
            use: root.use.bind(root), 
            section: root.section.bind(root),
            route: root.route.bind(root),
            registerType: root.registerType.bind(root),
            types: require("./types")
        }
    });
};
