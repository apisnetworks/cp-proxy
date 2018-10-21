# Multi-server extension
Control panel reverse proxy multi-server support

## Usage
Expand apnscp support to encompass multiple servers from a single endpoint (e.g. https://cp.apisnetworks.com). 

## Configuration
## config.ini

All configuration must be changed in `config/custom/config.ini`. cpcmd provides a short-hand means of doing this, e.g.

`cpcmd config_set apnscp.config <SECTION> <NAME> <VALUE>`

| Section | Name          | Description                                                  | Sample Value                     |
| ------- | ------------- | ------------------------------------------------------------ | -------------------------------- |
| auth    | secret        | Must be the same across *all* instances. Used to encrypt trusted browsers. | ABCDEFGH                         |
| auth    | server_format | Optional format that appends a domain to the result of *server_query*. <SERVER> is substituted with result from JSON query. | <SERVER>.apisnetworks.com        |
| auth    | server_query  | API endpoint that returns a JSON object with the server name | https://apnscp.com/server-lookup |
| misc    | cp_proxy      | Control panel proxy endpoint that cp-proxy resides on        | https://cp.apnscp.com            |
| misc    | sys_status    | Optional [Cachet](https://cachethq.io) location for system status | https://demo.cachethq.io/        |

## db.yaml

All servers must use the same database + host.

| Database configuration | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| api                    | API keys used by SOAP API.                                   |
| auth                   | Multi-server aggregate database. Used to validate global uniqueness of primary username. Can be disabled, but username collisions will deny a transfer into the server should one exist. |
| dns                    | Domain/invoice aggregate. Used to locate domains on servers. |

## Database schema

All schema is located under `schema/` with the respective naming.

# Server query response

apnscp sends a POST request to the value defined in **[auth]** => *server_query* consisting of `domain` and expects a JSON reply containing `status` (bool) and `data` (string) fields. 

Note that apnscp will always send `Accept: application/json` with its request. The response MUST be formatted in JSON.

## Request payload

| Field  | Type   | Description           |
| ------ | ------ | --------------------- |
| domain | string | Domain name to lookup |

## Response payload

| Field  | Type   | Description                              |
| ------ | ------ | ---------------------------------------- |
| status | bool   | Query succeeded and the domain was found |
| data   | string | Server name or error message             |

