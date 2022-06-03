var 	config = require('nconf'),
		http = require('http'),
		https = require('https'),
		fs = require('fs');

config
	.env()
	.argv()
	.file('./config.json')//absolute -file doesn't need to exist
	.defaults(require('./defaults.json'));//relative

var sslEnabled = false;
var createServerOptions = {};
//Turn on SSL if certs are found
if(config.get('ENV:ssl:key') && config.get('ENV:ssl:cert')){
	sslEnabled = true;
	createServerOptions = {
		key: fs.readFileSync(config.get('ENV:ssl:key')),
		cert: fs.readFileSync(config.get('ENV:ssl:cert')),
		secureOptions: require('constants').SSL_OP_NO_TLSv1//SSL_OP_CIPHER_SERVER_PREFERENCE
	};
	if(config.get('ENV:ssl:ciphers')){
		createServerOptions.ciphers = config.get('ENV:ssl:ciphers');
	}
}

var redirectService = function (req, res){
	var redirectUrl = '';

	if (config.get('ENV:special')){
		var parameters = config.get('ENV:special');
		for (index = 0; index < parameters.length; ++index) {
			if(parameters[index].exact && parameters[index].exact === req.url){
				redirectUrl = parameters[index].url;
				if(parameters[index].passthru){
					redirectUrl += req.url;
				}
				break;
			} else if(parameters[index].begins && req.url.startsWith(parameters[index].begins)){
				redirectUrl = parameters[index].url;
				if(parameters[index].passthru){
					redirectUrl += req.url;
				}
				break;
			}
		}
	}

	if(redirectUrl === ''){
		redirectUrl = config.get('ENV:url');
		if(config.get('ENV:passthru')){
			redirectUrl += req.url;
		}
	}

	res.writeHead(config.get('ENV:redirectCode'), { "Location": redirectUrl }); //301 perma/302 temp
	res.end();
};

if (sslEnabled) {
	https.createServer(createServerOptions, redirectService).listen(443);
}

http.createServer(redirectService).listen(80);


