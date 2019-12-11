const EWeLink = require('ewelink-api')
const config = require('../config')

const eWeLink = new EWeLink(config.eWeLink)

async function ensureSetMode () {
  // @TODO: If we didnt made a call recently
  if (true) {
    await powerOn(config.increase.deviceid)
  }
}

async function powerOn (deviceid) {
  if (deviceid) {
    console.info('powerOn', deviceid)
    return await new Promise(resolve => setTimeout(resolve, 250))
  }
  // const status = await eWeLink.setDevicePowerState(deviceId, 'on')
  // console.log(status) // @TODO: check status
}

async function increase () {
  await ensureSetMode()
  await powerOn(config.increase.deviceid)
}

async function decrease () {
  await ensureSetMode()
  await powerOn(config.decrease.deviceid)
}

module.exports = {
  increase,
  decrease
}
