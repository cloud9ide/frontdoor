"use strict";

"use server";

require("amd-loader");
var sinon = require("sinon");

var assert = require("assert-diff");
assert.options.strict = true;

var Api = require("./api");

describe(__filename, function () {
    before(function () {
        this.res = {
            writeHead: sinon.stub(),
            end: sinon.stub(),
        };
    });

    it("should route API calls", function () {
        var root = new Api("API");
        var channels = root.section("channels", "Channels");

        var next = sinon.stub();
        var listChannels = sinon.stub();
        var getChannel = sinon.stub();
        var delChannel = sinon.stub();

        function reset() {
            next.resetHistory();
            listChannels.resetHistory();
            getChannel.resetHistory();
            delChannel.resetHistory();
        }

        channels.get("/", listChannels);

        channels.get(
            "/:id",
            {
                params: {
                    id: {
                        type: "int",
                    },
                },
            },
            getChannel
        );

        channels.del(
            "/:id",
            {
                params: {
                    id: {
                        type: "int",
                    },
                },
            },
            delChannel
        );

        root.handle(
            {
                method: "GET",
                url: "/channels",
            },
            this.res,
            next
        );
        sinon.assert.notCalled(next);
        sinon.assert.calledOnce(listChannels);
        sinon.assert.notCalled(getChannel);
        sinon.assert.notCalled(delChannel);
        reset();

        root.handle(
            {
                method: "GET",
                url: "/channels/123",
            },
            this.res,
            next
        );
        sinon.assert.notCalled(next);
        sinon.assert.notCalled(listChannels);
        sinon.assert.calledOnce(getChannel);
        sinon.assert.notCalled(delChannel);
        reset();

        root.handle(
            {
                method: "GET",
                url: "/channels/abcd",
            },
            this.res,
            next
        );
        sinon.assert.called(next);
        sinon.assert.notCalled(listChannels);
        sinon.assert.notCalled(getChannel);
        sinon.assert.notCalled(delChannel);
        reset();

        root.handle(
            {
                method: "DELETE",
                url: "/channels/123",
            },
            this.res,
            next
        );
        sinon.assert.notCalled(next);
        sinon.assert.notCalled(listChannels);
        sinon.assert.notCalled(getChannel);
        sinon.assert.calledOnce(delChannel);
        reset();
    });

    it("two sections with same name should be additive", function () {
        var next = sinon.stub();
        var getUser = sinon.stub();
        var getProject = sinon.stub();

        function reset() {
            next.resetHistory();
            getUser.resetHistory();
            getProject.resetHistory();
        }

        var root = new Api("API");

        var users = root.section("users");
        users.get("/:uid", getUser);

        var projects = root.section("users");
        projects.get("/:uid/:pid", getProject);

        root.handle(
            {
                method: "GET",
                url: "/users/fjakobs",
            },
            this.res,
            next
        );
        sinon.assert.notCalled(next);
        sinon.assert.calledOnce(getUser);
        sinon.assert.notCalled(getProject);
        reset();

        root.handle(
            {
                method: "GET",
                url: "/users/fjakobs/ace",
            },
            this.res,
            next
        );
        sinon.assert.notCalled(next);
        sinon.assert.notCalled(getUser);
        sinon.assert.calledOnce(getProject);
        reset();
    });

    it("should add route to root", function () {
        var onPing = sinon.stub();

        var root = new Api("API");
        root.get("/ping", onPing);

        root.handle(
            {
                method: "GET",
                url: "/ping",
            },
            this.res,
            assert.fail
        );
        sinon.assert.calledOnce(onPing);
    });

    it("test section middleware shall only be called if the route was matched", function () {
        var root = new Api();

        var next = sinon.stub();
        var mw1 = sinon.stub().callsArg(2);
        var mw2 = sinon.stub().callsArg(2);
        var mw3 = sinon.stub().callsArg(2);
        var cb1 = sinon.stub();
        var cb2 = sinon.stub();

        next.displayName = "next";
        mw1.displayName = "mw1";
        mw2.displayName = "mw2";
        mw3.displayName = "mw3";
        cb1.displayName = "cb1";
        cb2.displayName = "cb2";

        function reset() {
            next.resetHistory();
            mw1.resetHistory();
            mw2.resetHistory();
            mw3.resetHistory();
            cb1.resetHistory();
            cb2.resetHistory();
        }

        root.use(mw1);
        var s1 = root.section("s1");
        s1.use(mw2);
        s1.get("/juhu", cb1);

        var s2 = root.section("s2");
        s2.use(mw3);
        s2.get("/kinners", cb2);

        root.handle(
            {
                method: "GET",
                url: "/s1/juhu",
            },
            this.res,
            next
        );
        sinon.assert.notCalled(next);
        sinon.assert.callOrder(mw1, mw2, cb1);
        sinon.assert.notCalled(mw3);
        reset();

        root.handle(
            {
                method: "GET",
                url: "/s2/kinners",
            },
            this.res,
            next
        );
        sinon.assert.callOrder(mw1, mw3, cb2);
        sinon.assert.notCalled(next);
        sinon.assert.notCalled(mw2);
        reset();

        root.handle(
            {
                method: "GET",
                url: "/nothing/here",
            },
            this.res,
            next
        );
        sinon.assert.calledOnce(next);
        sinon.assert.notCalled(mw1);
        sinon.assert.notCalled(mw2);
        sinon.assert.notCalled(mw3);
        reset();
    });

    it("test handler can be an array", function () {
        var next = sinon.stub();
        var middleware1 = sinon.stub().callsArg(2);
        var middleware2 = sinon.stub().callsArg(2);
        var handler = sinon.stub();

        function reset() {
            next.resetHistory();
            middleware1.resetHistory();
            middleware2.resetHistory();
            handler.resetHistory();
        }

        var root = new Api();
        root.get("/juhu", [middleware1, middleware2, handler]);

        root.handle(
            {
                method: "GET",
                url: "/juhu",
            },
            this.res,
            next
        );
        sinon.assert.notCalled(next);
        sinon.assert.callOrder(middleware1, middleware2, handler);
        reset();

        root.handle(
            {
                method: "GET",
                url: "/nothing",
            },
            this.res,
            next
        );
        sinon.assert.calledOnce(next);
        sinon.assert.notCalled(middleware1);
        sinon.assert.notCalled(middleware2);
        sinon.assert.notCalled(handler);
        reset();
    });

    it("test add route to '/' of a section", function () {
        var onGet = sinon.stub();
        var next = sinon.stub();

        var root = new Api();
        root.section("juhu").get("/", onGet);

        root.handle(
            {
                method: "GET",
                url: "/juhu",
            },
            this.res,
            next
        );

        sinon.assert.calledOnce(onGet);
        sinon.assert.notCalled(next);
    });

    it("test parameter decoding", function () {
        var onPost = sinon.stub();

        var root = new Api();
        root.put(
            "/post/:id",
            {
                params: {
                    id: {},
                    name: {},
                    age: {
                        source: "query",
                        type: "int",
                    },
                },
            },
            onPost
        );

        root.handle(
            {
                method: "PUT",
                url: "/post/fab?age=34",
                body: {
                    name: "Fabian",
                },
            },
            this.res,
            assert.fail
        );
        var params = onPost.args[0][0].params;
        assert.equal(params.name, "Fabian");
        assert.equal(params.id, "fab");
        assert.equal(params.age, 34);

        root.handle(
            {
                method: "PUT",
                url: "/post/fab?age=34",
            },
            this.res,
            function (err) {
                assert.ok(err);

                var errors = err.errors;
                assert.equal(errors.length, 1);
                assert.equal(errors[0].resource, "root");
                assert.equal(errors[0].field, "name");
                assert.equal(errors[0].code, "missing_field");
            }
        );

        this.res.writeHead.reset();
        this.res.end.reset();

        root.handle(
            {
                method: "PUT",
                url: "/post/fab?age=juhu",
                body: {
                    name: "Fabian",
                },
            },
            this.res,
            function (err) {
                assert.ok(err);

                var errors = err.errors;

                assert.equal(errors.length, 1);
                assert.equal(errors[0].resource, "root");
                assert.equal(errors[0].field, "age");
                assert.equal(errors[0].type_expected, "int");
                assert.equal(errors[0].code, "invalid");
            }
        );
    });

    it("test custom type with register", function () {
        var DateType = {
            parse: function (string) {
                if (!/\d{13}/.test(string)) throw new Error("not a timestamp");

                return new Date(parseInt(string, 10));
            },
            check: function (value) {
                return value instanceof Date;
            },
        };

        var onGet = sinon.stub();

        var root = new Api();
        var section = root.section("ts");
        section.registerType("ts", DateType);
        section.get(
            "/:ts",
            {
                params: {
                    ts: {
                        type: "ts",
                    },
                },
            },
            onGet
        );

        var req = {};
        assert.ok(root.match(req, "/ts/1353676299181", "get"));
        root.handle(
            {
                method: "GET",
                url: "/ts/1353676299181",
            },
            {},
            assert.fail
        );
        assert.ok(onGet.args[0][0].params.ts instanceof Date);

        assert.ok(!root.match(req, "/ts/353676299181", "get"));
        assert.ok(!root.match(req, "/abc", "get"));
    });

    it("test describe API", function () {
        var root = new Api("api");
        var handler = sinon.stub();

        root.section("users", "User management")
            .get(
                "/",
                {
                    name: "get",
                    description: "list all users",
                },
                handler
            )
            .put(
                "/:id",
                {
                    params: {
                        id: {
                            type: /\d{4}/,
                        },
                        name: {
                            type: "string",
                            body: true,
                        },
                        age: {
                            body: true,
                            optional: true,
                            type: "int",
                        },
                    },
                },
                handler
            )
            .delete("/:id", handler);

        var description = root.describe();
        // console.log(JSON.stringify(description, null, "    "));

        var expected = {
            description: "api",
            sections: [
                {
                    name: "users",
                    description: "User management",
                    routes: [
                        {
                            route: "/",
                            method: "get",
                            regexp: "/^\\/\\/?$/",
                            name: "get",
                            description: "list all users",
                        },
                        {
                            route: "/:id",
                            method: "put",
                            regexp: /^\/([^\\/]+)\/?$/.toString(),
                            params: {
                                id: {
                                    type: "/\\d{4}/",
                                    source: "url",
                                    optional: false,
                                    name: undefined,
                                },
                                name: {
                                    type: "string",
                                    source: "body",
                                    optional: false,
                                    name: undefined,
                                },
                                age: {
                                    type: "int",
                                    source: "body",
                                    optional: true,
                                    name: undefined,
                                },
                            },
                        },
                        {
                            route: "/:id",
                            method: "delete",
                            regexp: /^\/([^\\/]+)\/?$/.toString(),
                            params: {
                                id: {
                                    type: "string",
                                    source: "url",
                                    optional: false,
                                    name: undefined,
                                },
                            },
                        },
                    ],
                    mount: "users",
                },
            ],
        };
        assert.deepEqual(description, expected);
    });

    it("test handler with two arguments should be treated as function(params, callback) {}", function () {
        var root = new Api();
        root.get("/check/:id", function (params, callback) {
            assert.equal(params.id, "123");
            callback(null, {
                ok: 1,
            });
        });

        root.get("/fail", function (params, callback) {
            callback("error");
        });

        root.handle(
            {
                method: "GET",
                url: "/check/123",
            },
            this.res,
            assert.fail
        );
        assert.equal(JSON.parse(this.res.end.args[0][0]).ok, 1);

        var called = false;
        root.handle(
            {
                method: "GET",
                url: "/fail",
            },
            this.res,
            function (err) {
                assert.equal(err, "error");
                called = true;
            }
        );

        assert(called);
    });
});
