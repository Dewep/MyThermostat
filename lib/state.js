const path = require('path')
const fs = require('fs').promises

const stateFile = path.join(__dirname, '..', 'state.json')
let state = null

async function getState () {
  if (!state) {
    try {
      state = {
        setTemperature: 190,
        wantedTemperature: 190,
        programs: [
          { hours: 1, minutes: 30, temperature: 180, enabled: true },
          { hours: 7, minutes: 45, temperature: 200, enabled: true },
          { hours: 8, minutes: 10, temperature: 205, enabled: true },
          { hours: 9, minutes: 15, temperature: 180, enabled: true },
          { hours: 17, minutes: 30, temperature: 200, enabled: true },
          { hours: 18, minutes: 0, temperature: 205, enabled: true }
        ],
        manualUntil: null
      }

      state = JSON.parse(await fs.readFile(stateFile))
    } catch (err) {
      console.warn('[state-file] Cannot load state file', err)
    }
  }

  return JSON.parse(JSON.stringify(state))
}

async function setState (newState) {
  const json = JSON.stringify(newState)
  state = JSON.parse(json)
  await fs.writeFile(stateFile, json)
}

async function updateStateSetTemperature (modifier) {
  const state = await getState()
  state.setTemperature += modifier
  await setState(state)
}

module.exports = {
  getState,
  setState,
  updateStateSetTemperature
}
