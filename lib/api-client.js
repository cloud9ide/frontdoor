var request = require("request");

module.exports = function(endpoint, description, callback) {
    
    if (typeof description === "string") {
        loadDesc(description, function(err) {
            if (err) return callback(err);
            buildApi(description, callback);
        });
    }
    else {
        buildApi(description, callback);
    }
        
    
    function buildApi(err, description) {
        //if (err)
    }
    
    function loadDesc(url, callback) {
        request(url, function(error, response, body) {
            if (error || response.statusCode !== 200)
                return callback(new Error("Could not load API description from " + url));
                
            var json;
            try {
                json = JSON.parse(body);
            } catch(e) {
                return callback(new Error("Could not JSON parse API description"));
            }
            
            callback(null, json);
        });
    }
}; 