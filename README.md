# cp-proxy
Control panel reverse proxy

## Usage
cp-proxy is a reverse proxy that allows coordination between multiple, similar applications (*control panels*) in which the application will push a request to another server via 307 redirect to another server if the account resides elsewhere.

## Configuration
**DEFAULT_TARGET**: initial URL that is fetched, this should be a login portal
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
A login should check if the account is resident on the server. If not resident, the request should be forwarded to the proper server as a 307 redirect issued. This `Location:` header is filtered from the response.

### Bypassing reverse proxy
An application may include `no-proxy` header in its response. The Location will flow through in the response headers effectively allowing the session to break from the proxy. 
