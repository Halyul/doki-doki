/**
 * Init Koa base
 */
const Koa = require('koa');
const app = new Koa();
app.proxy = true;
const jsonfile = require('jsonfile');
const config = jsonfile.readFileSync("./_config.json", {throws: false});
const fs = require('fs');
const crypto = require('crypto');

app.use(async ctx => {
  const public = config.public;
  if (public === true) {
    publicMode(ctx)
  } else {
    privateMode(ctx)
  };
});

const port = config.port || 3000;
app.listen(port, function() {
  console.log('Server listening on', config.port);
  console.log('Is server running in public mode?', config.public);
  console.log('Server key is', config.key);
  console.log('Server times is', config.times);
});

function generateKey(ctx) {
  const request = ctx.request.query.request;
  const host = config.host;
  const requestKey = ctx.request.query.key;
  const device = ctx.request.query.device;
  const configKey = config.key;
  if (requestKey && device && configKey) {
    const hmac = crypto.createHmac('sha1WithRSAEncryption', requestKey);
    hmac.update(host);
    hmac.update(device);
    hmac.update(configKey);
    const key = hmac.digest('hex');
    const dataFile = './data/' + key + '.json';
    const data = {
      file: dataFile,
      key: key
    }
    return data
  } else {
    return null
  };
};

function publicMode(ctx) {
  const request = ctx.request.query.request;
  const requestKey = ctx.request.query.key;
  if (request === 'add') {
    const data = generateKey(ctx);
    if (data !== null) {
      const dataFile = data.file;
      const key = data.key
      if (request === 'add') {
        clean(dataFile);
        const addData = {
          ctx: ctx,
          dataFile: dataFile,
          key: key,
          device: ""
        };
        add(addData);
      };
    } else {
      ctx.response.status = 403;
    };
  } else if (request === 'get' && requestKey) {
    const dataFile = './data/' + requestKey + '.json';
    get(ctx, dataFile);
  } else {
    ctx.response.status = 403;
  };
};

function privateMode(ctx) {
  const request = ctx.request.query.request;
  const requestKey = ctx.request.query.key;
  const device = ctx.request.query.device;
  const configKey = config.key;
  if (requestKey === configKey && device) {
    const dataFile = './data/' + device + '.json';
    if (request === 'add') {
      clean(dataFile);
      const addData = {
        ctx: ctx,
        dataFile: dataFile,
        key: configKey,
        device: "&device=" + device
      }
      add(addData);
    } else if (request === 'get') {
      get(ctx, dataFile);
    };
  } else {
    ctx.response.status = 403;
  };
};

function clean(dataFile) {
  const obj = jsonfile.readFileSync(dataFile, {throws: false});
  const times = config.times;
  if (obj === null) {
    return;
  } else {
    if (obj.times === times) {
      fs.unlinkSync(dataFile)
    };
  }
};

function add(addData) {
  const ctx = addData.ctx;
  const dataFile = addData.dataFile;
  const key = addData.key;
  const device = addData.device;
  const obj = jsonfile.readFileSync(dataFile, {throws: false});
  const succeededJson = {
    status: "Succeeded",
    getUrl: config.host + "/?request=get&key=" + key + device
  };
  if (obj === null) {
    const obj = {
      data: [],
      times: 1
    };
    obj.data.push({
      IP: ctx.request.ip,
      time: Date()
    });
    jsonfile.writeFileSync(dataFile, obj, {spaces: 2});
    ctx.body = succeededJson;
  } else {
    obj.data.push({
      IP: ctx.request.ip,
      time: Date()
    });
    obj.times++;
    jsonfile.writeFileSync(dataFile, obj, {spaces: 2});
    ctx.body = succeededJson;
  };
};

function get(ctx, dataFile) {
  const obj = jsonfile.readFileSync(dataFile, {throws: false});
  if (obj === null) {
    ctx.response.status = 403;
  } else {
    ctx.body = obj;
  };
};
