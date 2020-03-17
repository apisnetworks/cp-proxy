# cp-proxy: apnscp reverse proxy

cp-proxy is a reverse proxy that allows coordination between multiple, similar applications (chiefly, *apnscp control panels* in this case) in which the application will push a request to another server via 307 redirect to another server if the account resides elsewhere. cp-proxy doubles as a simple method of upgrading normal, unencrypted HTTP sessions to HTTPS by placing a performant SSL terminator in front of the proxy.

## Installation
See `multi-server-support/` bundled with this repository for information on coordinating apnscp across multiple servers. The following setup creates a limited system user that listens on port 8021. Apache sits in front of the proxy to act as an SSL terminator on 443 running apnscp. It could just as easily be haproxy or NGiNX.

It's a good idea to use [nvm](https://github.com/nvm-sh/nvm) if on CentOS 7 as the Node version that ships with CentOS 7 is a fossil.

```bash
useradd -rms /sbin/nologin cp
cd /home/cp
sudo -u cp git clone https://github.com/apisnetworks/cp-proxy.git /home/cp/proxy
cp /home/cp/proxy/cp-proxy.sysconf /etc/sysconfig/cp-proxy
# Now is a good time to edit /etc/sysconfig/cp-proxy!
cp /home/cp/proxy/cp-proxy.service /etc/systemd/service
# Skip below for fossilized environments!
sudo -u cp npm install
systemctl enable cp-proxy
systemctl start cp-proxy
```

**Workaround for Node belonging in a museum**
```bash
su -s /bin/bash cp
cd ~/proxy
nvm install --lts
echo 'lts' > .nvmrc
npm install
# exit su session
exit
```

### SSL termination
Any SSL terminator can sit in front of cp-proxy. This example covers Apache, but the same can be done for NGiNX, Caddy, haproxy, et cetera.

In `/etc/httpd/conf/httpd-custom.conf` add the following lines, substituting *1.2.3.4* for your server IP address and *cp.mydomain.com* for the panel hostname. Copying the IP addresses above from a previous VirtualHost in httpd-custom.conf is **normally sufficient**.

```
<VirtualHost 1.2.3.4:443>
SSLEngine On
ServerName cp.mydomain.com
ProxyPass / http://localhost:8021/
ProxyPassReverse / http://localhost:8021/
</VirtualHost>
```

Verify configuration and restart,
```bash
httpd -t && systemctl restart httpd
```
#### Adding SSL
In the above example, the panel inherits the primary SSL certificate. This is managed by apnscp. To add a new hostname, augment [letsencrypt] => additional_certs. It's easy to do using the apnscp.config Scope:
```bash
cpcmd scope:get apnscp.config letsencrypt additional_certs
# Make a note of the certs, if any. Each certificate
# is separated by a comma, e.g. "mydomain.com,cp.mydomain.com" or "cp.mydomain.com"
cpcmd scope:set apnscp.config letsencrypt additional_certs "mydomainalias.com,cp.mydomain.com"
```
apnscp will automatically restart and attempt to acquire an SSL certificate for `cp.mydomain.com` in addition to the pre-existing SSL alias, `mydomainalias.com`.

### CP Proxy configuration
All configuration is managed within /etc/sysconfig/cp-proxy. After making changes, activate the new configuration by restarting cp-proxy: `systemctl restart cp-proxy`.

* **CP_TARGET**: initial URL that is fetched, this should be a panel login portal
* **LISTEN_PORT**: port on which cp-proxy listens
* **LISTEN_ADDRESS**: IPv4/6 address on which cp-proxy listens
* **SECRET**: used to encrypt session cookie. Generated randomly on service startup, which may cause issues if cp-proxy is constantly restarted. Define this value.

### Passing X-Forwarded-For header
All requests pass X-Forwarded-For, which is the client address. Each apnscp panel installation **must be configured** to trust the cp-proxy server's data.
On all instances that accept traffic from cp-proxy, set [core] => http_trusted_forward,

```bash
cpcmd scope:set apnscp.config core http_trusted_forward 1.2.3.4
```

## Server layout

A caching HTTP accelerator like Varnish is recommended in front of the proxy to minimize requests that flow through to the proxy service. In my implementation, Apache sits in front for HTTP2 and TLS. Apache hits Varnish for static assets, then what is left flows to cp-proxy. cp-proxy serves from cp #1 by default.

```
                                               +---------+
                                           +--->  cp #1  |
                                           |   +---------+
+--------+    +---------+    +----------+  |
|        |    |         |    |          |  |   +---------+
| apache +----> varnish +----> cp proxy +------>  cp #2  |
|        |    |         |    |          |  |   +---------+
+--------+    +---------+    +----------+  |
                                           |   +---------+
                                           +--->  cp #3  |
                                               +---------+
```


## Login mechanism & server designation
A login should check if the account is resident on the server. If not resident, the request should be forwarded to the proper server as a 307 redirect issued. This `Location:` header is filtered from the response and its FQDN stored as a session cookie.

Each subsequent request sends the session cookie that includes the server name to the proxy.

### Bypassing reverse proxy
An application may include `no-proxy` header in its response. The Location will flow through in the response headers effectively allowing the session to break from the proxy. 

### Multi-homed Hosts
When working in situations in which a server is multi-homed, ensure each IP is bound to the panel. With apnscp this can be accomplished by specifying multiple VHost macros in `/usr/local/apnscp/config/httpd-custom.conf`:
```
ServerName myserver.com
Use VHost 64.22.68.12
Use VHost 64.22.68.13
```

# Making apnscp multi-server

apnscp assumes that it operates on a single server. When using a CP proxy with multiple servers, additional configuration is needed. These files and supporting documentation are available within `multi-server-support` of this repository.
