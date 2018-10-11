"use strict";

// Before switching servers on a request, fetch from this location
var DEFAULT_TARGET = 'http://cp.sol.apisnetworks.com';

// Port that the proxy server will listen on
var PORT = 8021;

// Optional header to include in requests to bypass Location: subtitution
var HEADER_PASSTHRU = 'no-proxy';

var http = require('http'),
    connect = require('connect'),
    httpProxy = require('http-proxy'),
    cookieSession = require('cookie-session'),
    app = connect();

app.use(cookieSession( {
    name: 'cpTarget',
    keys: ['genericKey']
}));

var proxy = httpProxy.createProxyServer({
    target: DEFAULT_TARGET
}).on('error', function (err, req, res) {
    res.end();
});

app.use(function (req, res, next) {
    var oSetHeader = res.setHeader.bind(res), useProxy = true;
    res.setHeader = function(name, value) {
        if (!name) {
            return;
        }
        var hdr = name.toLowerCase(), location;
        if (hdr === HEADER_PASSTHRU) {
            useProxy = false;
        } else if (useProxy && hdr === 'location') {
            location = value;
            if (res.statusCode === 307) { 
                return oSetHeader(name, value); 
            }

            if (location.charAt(6) === '/' &&
                (location.substr(0, 7) === 'http://' || location.substr(0,8) === 'https://'))
            {
                if (location.substr(0, 17) !== 'http://localhost:') {
                    // ensure proto is http, otherwise upstream http server will double-encrypt
                    // transmission
                    req.session.target = location.substr(0, location.indexOf('/', 8)).
                        replace("https:","http:");
                }

                value = location.substr(location.indexOf('/', 8));
            }
        }
        return oSetHeader(name, value);
    };
    next();
});

app.use(function (req, res) {
    proxy.web(req, res, {
        target: req.session.target != 'http://localhost:' + PORT &&
            req.session.target || DEFAULT_TARGET
    });
});

http.createServer(app).listen(PORT);
