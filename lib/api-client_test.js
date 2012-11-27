"use strict";

var assert = require("assert");
var sinon = require("sinon");
var http = require("http");

var api = require("./api");
var apiClientBuilder = require("./api-client");

module.exports = {
    
    setUp: function(next) {
        var self = this;
        
        this.getUsers = sinon.stub();
        this.getUser = sinon.stub();
        this.onError = sinon.stub();
        
        var root = new api.Api();
        root.section("users")
            .get("/", this.getUsers)
            .get("/:uid", this.getUser);
            
        root.get({
            route: "/inspect.json"
        }, api.mw.describeApi(root));

        var port = process.env.PORT || 8383;
        this.server = http.createServer(function(req, res) {
            root.handle(req, res, self.onError);
        }).listen(port, function() {
            apiClientBuilder("http://localhost:8383");
        });
    },
    
    "test string array type": function() {
        var t = new types.Array(new types.String());
        
        assert.ok(t.check(["a", "b", "c"]));
        assert.ok(!t.check([12, "b", "c"]));
    },
    
    "test array type": function() {
        var t = new types.Array();
        
        assert.ok(t.check(["a", "b", "c"]));
        assert.ok(t.check([12, "b", "c"]));
        assert.ok(!t.check({}));
        assert.ok(!t.check(12));
        assert.ok(!t.check("juhu"));
    }
};

!module.parent && require("asyncjs").test.testcase(module.exports).exec();