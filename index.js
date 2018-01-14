/**
 * Init Koa base
 */
const Koa = require('koa');
const app = new Koa();
app.proxy = true;
const jsonfile = require('jsonfile')

/**
 * Get config
 */
const yaml = require('js-yaml');
const fs   = require('fs');
const config = yaml.safeLoad(fs.readFileSync('./_config.yml', 'utf8'));

/**
 *
 */
app.use(async ctx => {
  const request = ctx.request.query.request;
  const requestKey = ctx.request.query.key;
  const device = ctx.request.query.device;
  const configKey = process.env.npm_config_key || config.key.toString();
  if (requestKey === configKey && device) {
    const dataFile = './data/' + device + '.json'
    if (request === 'add') {
      clean(dataFile)
      add(ctx, dataFile)
    } else if (request === 'get') {
      get(ctx, dataFile)
    }
  } else {
    ctx.response.status = 403
  };
});

const port = process.env.npm_config_port || 3000
app.listen(port, () => console.log('Server listening on', port))

function clean(dataFile) {
  const obj = jsonfile.readFileSync(dataFile, {throws: false})
  if (obj === null) {
    return
  } else {
    if (obj.times === config.times) {
      fs.unlinkSync(dataFile)
    }
  }
}

function add(ctx, dataFile) {
  const obj = jsonfile.readFileSync(dataFile, {throws: false})
  if (obj === null) {
    const obj = {
      data: [],
      times: 1
    }
    obj.data.push({
      IP: ctx.request.ip,
      time: Date()
    })
    jsonfile.writeFileSync(dataFile, obj, {spaces: 2})
    ctx.body = "Successed!"
  } else {
    obj.data.push({
      IP: ctx.request.ip,
      time: Date()
    })
    obj.times++
    jsonfile.writeFileSync(dataFile, obj, {spaces: 2})
    ctx.body = "Successed!"
  }
}

function get(ctx, dataFile) {
  const obj = jsonfile.readFileSync(dataFile, {throws: false})
  if (obj === null) {
    ctx.response.status = 403
  } else {
    ctx.body = obj
  }
}
