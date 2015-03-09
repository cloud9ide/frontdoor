"use strict";

var Types = require("./types").Types;
var RegExpType = require("./types").RegExp;
var BuiltinTypes = new Types();

var Params = {

    normalize: function(params, types, source) {
        if( ! params ) return {};

        types = types || BuiltinTypes;

        for (var name in params) {
            var param = Params.param(params[name], name, source);

            param.type = types.get(param.type);
            params[name] = param;
        }

        return params;
    },

    /**
     * Param can be:
     *
     *  - object with name: 'type',
     *  - a String where String === 'name', type: "string"
     *  - An object where { name: 'name', type: 'type' }
     */

    param: function(def, name, source) {
        var param = def;
        source = source || 'url';

        if (typeof def === 'string' && !name) {
            param = {
                name: def,
                type: BuiltinTypes.get('string')
            };
        }
        else if (typeof def === 'string' || def instanceof RegExp) {
            param = {
                name: name,
                type: def
            };
        }

        param.optional = !!param.optional;
        param.source = param.source || source;

        // allow regular expressions as types
        if (param.type instanceof RegExp)
            param.type = new RegExpType(param.type);

        if (param.source == "body")
            param.type = param.type || "json";

        param.type = param.type || "string";

        if (!/^body|url|query$/.test(param.source)) {
            throw new Error("parameter source muste be 'url', 'query' or 'body'");
        }

        return param;
    }
};

module.exports = Params;