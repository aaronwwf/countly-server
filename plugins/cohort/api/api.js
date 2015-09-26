var plugin = {},
	common = require('../../../api/utils/common.js'),
    plugins = require('../../pluginManager.js'),
	fs = require('fs');
var request = require("request");

(function (plugin) {
	//write api call
	plugins.register("/i", function(ob){
		fs.appendFile("../input.log", JSON.stringify(ob.params.qstring)+"\n", function(err) {
			if(err) {
				return console.log(err);
			}

		});
	});

	plugins.register("/o",function(ob){

		var params = ob.params;
		var validateUserForDataReadAPI = ob.validateUserForDataReadAPI;

		//if user requested to read our metric
		if (params.qstring.method == "cohort") {
			//console.log(params.qstring.query);
			//validate user and output data using fetchTimeObj method
			validateUserForDataReadAPI(params, function(){
				request({
					url: "http://172.26.187.202:9998/v1/cohort",
					method: "POST",
					json:true,
				    headers:{
						"content-type":'application/json'
					},
					body:JSON.parse(params.qstring.query)
				}, function(error, response, body) {
					//console.log(body);
					if (!error && response.statusCode === 200) {

						common.returnOutput(params,body);
					}
				});

			});

			//return true, we responded to this request
			return true;
		}
		return true;


	});
}(plugin));

module.exports = plugin;