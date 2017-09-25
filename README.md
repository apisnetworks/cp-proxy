# cp-proxy
Control panel reverse proxy

## Usage
cp-proxy is a reverse proxy that allows coordination between multiple, similar applications (chiefly, *control panels* in this case) in which the application will push a request to another server via 307 redirect to another server if the account resides elsewhere. cp-proxy doubles as a simple method of upgrading normal, unencrypted HTTP sessions to HTTPS by placing a performant SSL terminator, like nginx, in front of the proxy.

## Configuration
**DEFAULT_TARGET**: initial URL that is fetched, this should be a login portal<br/>
**PORT**: port on which cp-proxy listens

## Server layout
A caching HTTP accelerator like Varnish is recommended in front of the proxy to minimize requests that flow through to the proxy service. In my implementation, nginx sits in front for HTTP2 and TLS. Nginx hits Varnish for static assets, then what is left flows to cp-proxy. cp-proxy serves from cp #1 by default.

<pre>                                              +---------+
                                          +--->  cp #1  |
                                          |   +---------+
+-------+    +---------+    +----------+  |
|       |    |         |    |          |  |   +---------+
| nginx +----> varnish +----> cp proxy +------>  cp #2  |
|       |    |         |    |          |  |   +---------+
+-------+    +---------+    +----------+  |
                                          |   +---------+
                                          +--->  cp #3  |
                                              +---------+</pre>

## Login Mechanism & Server Designation
A login should check if the account is resident on the server. If not resident, the request should be forwarded to the proper server as a 307 redirect issued. This `Location:` header is filtered from the response and its FQDN stored as a session cookie.

Each subsequent request sends the session cookie that includes the server name to the proxy.

### Bypassing reverse proxy
An application may include `no-proxy` header in its response. The Location will flow through in the response headers effectively allowing the session to break from the proxy. 

### Multi-homed Hosts
When working in situations in which a server is multi-homed, ensure each IP is bound to the panel. With apnscp this can be accomplished by specifying multiple VHost macros in config/httpd-custom.conf:
```
ServerName myserver.com
Use VHost 64.22.68.12
Use VHost 64.22.68.13
```
