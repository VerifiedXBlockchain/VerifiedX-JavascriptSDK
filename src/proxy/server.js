
const cors_proxy = require('cors-anywhere');
const dotenv = require('dotenv');

dotenv.config({path: '.env'})

var host = process.env.HOST || 'localhost';
var port = process.env.PORT || 3001;

cors_proxy.createServer({
    originWhitelist: [],
}).listen(port, host, function() {
    console.log('Running Proxy on ' + host + ':' + port);
});