const EWeLink = require('ewelink-api')
const config = require('../config')

const eWeLink = new EWeLink(config.eWeLink)

setMode = false
timerSetMode = null

async function ensureSetMode () {
  while (setMode === null) {
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  if (setMode === false) {
    await powerOn(config.increase.deviceId)
  }
}

async function powerOn (deviceId) {
  if (timerSetMode) {
    clearTimeout(timerSetMode)
  }

  timerSetMode = setTimeout(() => {
    setMode = null
    timerSetMode = null
    setTimeout(() => {
      setMode = false
    }, 3000)
  }, 3000)

  setMode = true

  const response = await eWeLink.setDevicePowerState(deviceId, 'on')
  if (response.status !== 'on') {
    console.warn('[ewelink] Cannot power on button:', response)
    throw new Error('Cannot power on button')
  }
}

async function increase () {
  await ensureSetMode()
  await powerOn(config.increase.deviceId)
}

async function decrease () {
  await ensureSetMode()
  await powerOn(config.decrease.deviceId)
}

module.exports = {
  increase,
  decrease
}
