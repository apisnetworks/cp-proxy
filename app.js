"use strict";
// Before switching servers on a request, fetch from this location
var DEFAULT_TARGET = process.env.CP_TARGET || 'http://127.0.0.1:2082';

var STRICT_SSL = process.env.hasOwnProperty("STRICT_SSL") ? Boolean(JSON.parse(process.env.STRICT_SSL.toLowerCase())) : true;
var DEBUG = process.env.hasOwnProperty("DEBUG") ? Boolean(JSON.parse(process.env.DEBUG.toLowerCase())) : false;
// Port that the proxy server will listen on
var PORT = JSON.parse(process.env.LISTEN_PORT || 8021);

// Optional header to include in requests to bypass Location: substitution
var HEADER_PASSTHRU = 'no-proxy';

// Key used to encrypt cookie session
var cookieSecret = process.env.SECRET ||
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

var http = require('http'),
    connect = require('connect'),
    httpProxy = require('http-proxy'),
    cookieSession = require('cookie-session'),
    app = connect();

app.use(cookieSession( {
    name: 'cpTarget',
    keys: [cookieSecret]
}));

var proxy = httpProxy.createProxyServer({
    target: {
        protocol: 'https:',
        host: 'localhost',
        port: 2083,
        xfwd: true
    },
    secure: STRICT_SSL
}).on('error', function (err, req, res) {
    console.log(err);
    if (DEBUG) {
        console.trace();
    }
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
                if (location.substr(0, 17) !== 'http://127.0.0.1:') {
                    // server isn't local proxy
                    req.session.target = location.substr(0, location.indexOf('/', 8));
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
        target: req.session.target != 'https://127.0.0.1:' + PORT &&
            req.session.target != 'http://127.0.0.1:' + PORT &&
            req.session.target || DEFAULT_TARGET
    });
});

http.createServer(app).listen(PORT, process.env.LISTEN_ADDR);
