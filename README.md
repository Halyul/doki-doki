#Doki Doki

这是一个获取客户端IP的小程序

This is a small app that can get client IP

## Usage

### Directly
```` bash
$ git clone https://github.com/Halyul/doki-doki.git
$ cd doki-doki
$ npm i
$ npm start
````

### Docker
I just tested docker-compose, so I will just provide how to configure

```` yaml
version: '3.2'
services:
  dokidoki:
    build:
      context: https://github.com/Halyul/doki-doki.git
    ports:
      - target: 3000
        published: 3000
        protocol: tcp
        mode: host
    volumes:
      - ./data:/dokidoki/data:rw # this folder stores json files
      - ./_config.json:/dokidoki/_config.json:ro # this is the config file
````
In order to get real client IP, you should use 3.2+ version of configuration file and with such `ports` configuration.

## Config
Use `_config.json` as sample.
```` json
{
  "port": 3000,
  "key": "abcd1234",
  "times": 20
}
````
`port`: which port should the app listen, default is 3000
`key`: the authorized key
`times`: after how many time the app should clean up data

## Example

If your client IP is 5.5.5.5
and server IP is 6.6.6.6, port is 3000, key is 1234567890, device is Ubuntu

### add
`example.com/?request=add&key=[Your key here]&device=[Device name]`
`6.6.6.6:3000/?request=add&key=1234567890&device=Ubuntu`

If key is correct and device is set, the response should be `Succeeded!`

otherwise the response is 403 - `Forbidden`.

### get
`example.com/?request=get&key=[Your key here]&device=[Device name]`
`6.6.6.6:3000/?request=get&key=1234567890&device=Ubuntu`

```` json
{
  "data": [
    {
      "IP": "::ffff:5.5.5.5",
      "time": "Sat Jan 13 2018 19:29:20 GMT-0500 (EST)"
    },
    {
      "IP": "5.5.5.5",
      "time": "Sat Jan 13 2018 19:29:21 GMT-0500 (EST)"
    }
  ],
  "times": 2
}

````

`IP` will contain `::ffff:`, I don't know what exactly it is, maybe this is IPv6 format

`time` is when the data is added

`times` counts after how many times the app will clean up data.
