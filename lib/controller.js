const eWeLink = require('./ewelink')
const { getState, setState, updateStateSetTemperature } = require('./state')
const config = require('../config')
const moment = require('moment')

let timer = null
let lock = false

async function refreshWatcher () {
  if (lock) {
    return
  }
  try {
    lock = true
    await refreshWatcherAction()
    lock = false
  } catch (err) {
    lock = false
    console.warn('[watcher-error]', err)
  }
  if (!timer) {
    timer = setTimeout(refreshWatcher, 30 * 1000)
  }
}

function findProgramForDate (programs, dateFrom, nextInsteadOfCurrent = false) {
  if (!programs.length) {
    return { date: dateFrom, time: 0, temperature: null }
  }

  const possibilities = programs.map(program => {
    const date = dateFrom.clone().hours(program.hours).minutes(program.minutes).startOf('minute')
    if (date.isBefore(dateFrom)) {
      date.add(1, 'day')
    }
    return { date, time: date.diff(dateFrom, 'seconds'), temperature: program.temperature }
  })

  if (nextInsteadOfCurrent) {
    possibilities.sort((a, b) => a.time - b.time)
  } else {
    possibilities.sort((a, b) => b.time - a.time)
  }

  return possibilities[0]
}

async function refreshWatcherAction () {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }

  const state = await getState()

  if (state.setTemperature !== state.wantedTemperature) {
    if (state.setTemperature < state.wantedTemperature) {
      await eWeLink.increase()
      await updateStateSetTemperature(1)
      console.info(`[set-temperature] +0.1 (set=${state.setTemperature} wanted=${state.wantedTemperature})`)
    } else {
      await eWeLink.decrease()
      await updateStateSetTemperature(-1)
      console.info(`[set-temperature] -0.1 (set=${state.setTemperature} wanted=${state.wantedTemperature})`)
    }
    return refreshWatcherAction()
  }

  const now = moment()
  let timerBeforeChange = 5 * 60

  if (state.manualUntil) {
    const until = moment(state.manualUntil)

    if (until.isBefore(now)) {
      state.manualUntil = null
      await setState(state)
      return refreshWatcherAction()
    }

    timerBeforeChange = until.diff(now, 'seconds')
  }

  if (!state.manualUntil && state.programs.length) {
    const currentProgram = findProgramForDate(state.programs, now, false)

    if (currentProgram.temperature !== state.wantedTemperature) {
      state.wantedTemperature = currentProgram.temperature
      await setState(state)
      return refreshWatcherAction()
    }

    const nextProgram = findProgramForDate(state.programs, now, true)
    timerBeforeChange = nextProgram.time
  }

  timer = setTimeout(refreshWatcher, timerBeforeChange * 1000)
}

async function refreshState (edition) {
  const state = await getState()
  if (edition) {
    if (edition.setTemperature) {
      state.setTemperature = edition.setTemperature
    }
    if (edition.wantedTemperature) {
      state.wantedTemperature = edition.wantedTemperature
      state.manualUntil = edition.manualUntil
    }
    if (edition.programs) {
      state.programs = edition.programs
    }
    if (edition.manualUntil || edition.manualUntil === null) {
      state.manualUntil = edition.manualUntil
    }
    await setState(state)
  }

  refreshWatcher()

  const dateFrom = state.manualUntil ? moment(state.manualUntil) : moment()
  const program = findProgramForDate(state.programs, dateFrom, true)
  state.next = { date: program.date.format(), time: program.time, temperature: program.temperature }

  state.currentTime = moment().format('H[h]mm')

  return state
}

refreshWatcher()

module.exports = {
  state: refreshState
}
