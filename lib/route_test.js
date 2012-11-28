"use strict";

var assert = require("assert");
var sinon = require("sinon");

var Route = require("./route");

module.exports = {
    "test router: simple route with argument": function() {
        var route = new Route("/user/:name", sinon.stub());
        
        assert.equal(route.match("/juhu"), false);
        assert.equal(route.match("/juhu/12"), false);
        
        assert.equal(route.match("/user/fabian"), true);
        assert.equal(route.lastMatch.name, "fabian");
    },
    
    "test router: simple route with number argument": function() {
        var route = new Route("/user/:id", {
            params: {
                id: {
                    type: "int"
                }
            }
        }, sinon.stub());
        
        assert.equal(route.match("/user/fabian"), false);
        assert.equal(route.match("/user/123"), true);
        assert.equal(route.lastMatch.id, 123);
    },
    
    "test router: for params if the value is a string it is treated as the type": function() {
        var route = new Route("/user/:id", {
            params: {
                id: "int"
            }
        }, sinon.stub());
        assert.equal(route.match("/user/123"), true);
        assert.equal(route.lastMatch.id, 123);
    },
    
    "test router: complex route with multiple arguments": function() {
        var route = new Route("/user/:name/:id", {
            params: {
                id: {
                    type: "int"
                }
            }
        }, sinon.stub());
        
        assert.equal(route.match("/user/fabian"), false);
        assert.equal(route.match("/user/123"), false);
        assert.equal(route.match("/user/fabian/123"), true);
        assert.equal(route.lastMatch.id, 123);
        assert.equal(route.lastMatch.name, "fabian");
    },
    
    "test regexp types": function() {
        var route = new Route("/users/:uid", {
            params: {
                uid: /u\d+/
            }
        }, sinon.stub());
        
        assert.ok(route.match("/users/u123"));
        assert.ok(!route.match("/users/_u123"));
    },
    
    "test custom type without register": function() {
        var DateType = {
            parse: function(string) {
                if (!/\d{13}/.test(string))
                    throw new Error("not a timestamp");
                    
                return new Date(parseInt(string, 10));
            },
            check: function(value) {
                return value instanceof Date;
            }
        };
        
        var route = new Route("/ts/:ts", {
            params: {
                ts: {
                    type: DateType
                }
            }
        }, sinon.stub());
        
        assert.ok(route.match("/ts/1353676299181"));
        assert.ok(route.lastMatch.ts instanceof Date);
        
        assert.ok(!route.match("/ts/353676299181"));
        assert.ok(!route.match("/ts/abc"));
    }
};

!module.parent && require("asyncjs").test.testcase(module.exports).exec();
