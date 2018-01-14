/**
 * Init Koa base
 */
const Koa = require('koa');
const app = new Koa();
app.proxy = true;
const jsonfile = require('jsonfile')

app.use(async ctx => {
  const request = ctx.request.query.request;
  const requestKey = ctx.request.query.key;
  const device = ctx.request.query.device;
  const configKey = process.env.npm_config_key;
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
app.listen(port, function() {
  console.log('Server listening on', port)
  console.log('Server key is', process.env.npm_config_key)
  console.log('Server times is', process.env.npm_config_times)
})

function clean(dataFile) {
  const obj = jsonfile.readFileSync(dataFile, {throws: false})
  const times = process.env.npm_config_times
  if (obj === null) {
    return
  } else {
    if (obj.times === times) {
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
    ctx.body = "Succeeded!"
  } else {
    obj.data.push({
      IP: ctx.request.ip,
      time: Date()
    })
    obj.times++
    jsonfile.writeFileSync(dataFile, obj, {spaces: 2})
    ctx.body = "Succeeded!"
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
