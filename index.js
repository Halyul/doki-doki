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
    publicMode(ctx);
  } else {
    privateMode(ctx);
  };
});

const port = config.port || 3000;
app.listen(port, function() {
  console.log('Server listening on', config.port);
  console.log('Is server running in public mode?', config.public);
  console.log('Server key is', config.key);
  console.log('Server times is', config.times);
});

/**
 * Use to generate key and file name in public mode
 * return `null` when requestKey, device or configKey doesn't exist
 * return a json when all exist
 * {
 *    file: IP storage file path
 *    key: file name and the secret key
 * }
 */
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

/**
 * Public mode, without matching the config key and the request key
 */
function publicMode(ctx) {
  const request = ctx.request.query.request;
  const requestKey = ctx.request.query.key;
  if (request === 'add') {
    const data = generateKey(ctx);
    if (data !== null) {
      const dataFile = data.file;
      const key = data.key
      if (request === 'add') {
        clean(ctx, dataFile, false);
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
  } else if (request === 'delete' && requestKey) {
    const dataFile = './data/' + requestKey + '.json';
    clean(ctx, dataFile, true)
  } else {
    ctx.response.status = 403;
  };
};

/**
 * Private mode, with matching the config key and the request key
 */
function privateMode(ctx) {
  const request = ctx.request.query.request;
  const requestKey = ctx.request.query.key;
  const device = ctx.request.query.device;
  const configKey = config.key;
  if (requestKey === configKey && device) {
    const dataFile = './data/' + device + '.json';
    if (request === 'add') {
      clean(ctx, dataFile, false);
      const addData = {
        ctx: ctx,
        dataFile: dataFile,
        key: configKey,
        device: "&device=" + device
      }
      add(addData);
    } else if (request === 'get') {
      get(ctx, dataFile);
    } else if (request === 'delete') {
      clean(ctx, dataFile, true)
    };
  } else {
    ctx.response.status = 403;
  };
};

/**
 * Clean data, this can be called by request or when it reach the maximum time
 * ctx -> koa variable
 * dataFile -> IP storage file path
 * request -> if is true, means it requests to be deleted
 *            if is false, means it reachs the maximum time
 */
function clean(ctx, dataFile, request) {
  const obj = jsonfile.readFileSync(dataFile, {throws: false});
  const times = config.times;
  if (obj === null) {
    ctx.response.status = 403;
  } else {
   if (request === true) {
      const succeededJson = {
        status: "Succeeded"
      };
      fs.unlinkSync(dataFile);
      ctx.body = succeededJson;
    } else if (obj.times === times) {
      fs.unlinkSync(dataFile);
    };
  }
};

/**
 * Add IP
 * addData -> {
 *    ctx: koa variable,
 *    dataFile: IP storage file path,
 *    key: config key or request key,
 *    device: null or request device
 * }
 */
function add(addData) {
  const ctx = addData.ctx;
  const dataFile = addData.dataFile;
  const key = addData.key;
  const device = addData.device;
  const obj = jsonfile.readFileSync(dataFile, {throws: false});
  const succeededJson = {
    status: "Succeeded",
    getUrl: config.host + "/?request=get&key=" + key + device,
    deleteUrl: config.host + "/?request=delete&key=" + key + device
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

/**
 * Get IP
 * ctx -> koa variable
 * dataFile -> IP storage file path
 */
function get(ctx, dataFile) {
  const obj = jsonfile.readFileSync(dataFile, {throws: false});
  if (obj === null) {
    ctx.response.status = 403;
  } else {
    ctx.body = obj;
  };
};
