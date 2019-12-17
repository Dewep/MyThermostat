const moment = window.moment
const Vue = window.Vue

window.app = new Vue({
  el: '#app',

  data () {
    return {
      password: localStorage.password || '',
      passwordSet: false,
      error: null,
      setTemperature: 200,
      wantedTemperature: 200,
      programs: [],
      updatePrograms: false,
      nextDate: null,
      nextDateFormatted: null,
      nextTime: null,
      nextTemperature: null,
      manualUntil: null,
      currentTime: null
    }
  },

  computed: {
    setTemperatureFormatted () {
      return (this.setTemperature / 10).toFixed(1)
    },
    wantedTemperatureFormatted () {
      return (this.wantedTemperature / 10).toFixed(1)
    }
  },

  watch: {
  },

  mounted () {
    setTimeout(() => {
      document.body.classList.remove('initializing')
    }, 250)
    if (this.password) {
      this.refresh()
    }
  },

  methods: {
    autoRefresh (seconds = 10) {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
      this.timer = setTimeout(() => this.refresh(), (seconds || 10) * 1000)
    },

    async refresh (data = null, nextRefreshSeconds = null) {
      try {
        data = data || {}
        data.password = this.password

        const response = await fetch('/api/state/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })

        const result = await response.json()
        if (result.error) {
          throw new Error(result.error)
        }

        this.passwordSet = true
        console.log(result)
        localStorage.password = this.password

        const calendarFormats = {
          lastDay : '[Yesterday at] H[h]mm',
          sameDay : '[Today at] H[h]mm',
          nextDay : '[Tomorrow at] H[h]mm',
          lastWeek : '[last] dddd [at] H[h]mm',
          nextWeek : 'dddd [at] H[h]mm',
          sameElse : 'L'
        }

        this.setTemperature = result.setTemperature
        this.wantedTemperature = result.wantedTemperature
        this.programs = result.programs
        this.nextDate = (result.next && result.next.date) || null
        this.nextDateFormatted = this.nextDate ? moment(this.nextDate).calendar(null, calendarFormats).toLowerCase() : null
        this.nextTime = (result.next && result.next.time) || null
        this.nextTemperature = (result.next && result.next.temperature) || null
        this.manualUntil = result.manualUntil
        this.currentTime = result.currentTime

        this.autoRefresh(this.setTemperature !== this.wantedTemperature ? 1 : Math.min(nextRefreshSeconds || this.nextTime || 10, 30))
      } catch (err) {
        console.warn(err)
        this.error = err.message
        delete localStorage.password
      }
    },

    increase () {
      this.refresh({
        wantedTemperature: this.wantedTemperature + 1,
        manualUntil: this.manualUntil || this.nextDate || moment().add('2', 'hours').format()
      })
    },

    decrease () {
      this.refresh({
        wantedTemperature: this.wantedTemperature - 1,
        manualUntil: this.manualUntil || this.nextDate || moment().add('2', 'hours').format()
      })
    },

    editSetTemperature () {
      const promptTemperature = prompt('Enter the current set temperature', this.setTemperature / 10)
      if (!promptTemperature) {
        return
      }
      const setTemperature = Math.round(+promptTemperature * 10)
      this.refresh({ setTemperature })
    },

    setAuto () {
      this.refresh({ manualUntil: null }, 1)
    },

    setManual () {
      const manualUntil = this.manualUntil || this.nextDate
      if (!manualUntil) {
        return this.updateManualUntil()
      }
      this.refresh({ manualUntil })
    },

    updateManualUntil () {
      const manualUntil = this.manualUntil || this.nextDate || moment().add('2', 'hours').format()
      const promptManualUntil = prompt('Manual until :', manualUntil)
      if (!promptManualUntil) {
        return
      }
      this.refresh({ manualUntil: promptManualUntil })
    },

    addNewProgram () {
      const promptHours = prompt('Enter the desired hour', '9')
      if (!promptHours) {
        return
      }
      const promptMinutes = prompt('Enter the desired minute', '0')
      if (!promptMinutes) {
        return
      }
      const promptTemperature = prompt('Enter the desired temperature', '20.0')
      if (!promptTemperature) {
        return
      }
      const hours = Math.round(+promptHours)
      const minutes = Math.round(+promptMinutes)
      const temperature = Math.round(+promptTemperature * 10)
      const programs = this.programs.map(program => ({ hours: program.hours, minutes: program.minutes, temperature: program.temperature, enabled: program.enabled }))
      programs.push({ hours, minutes, temperature, enabled: true })
      programs.sort((a, b) => {
        if (a.hours !== b.hours) {
          return a.hours - b.hours
        }
        return a.minutes - b.minutes
      })
      this.refresh({ programs })
    },

    removeProgram (index) {
      const programs = this.programs.map(program => ({ hours: program.hours, minutes: program.minutes, temperature: program.temperature, enabled: program.enabled }))
      programs.splice(index, 1)
      this.refresh({ programs })
    },

    toggleProgram (index) {
      const programs = this.programs.map(program => ({ hours: program.hours, minutes: program.minutes, temperature: program.temperature, enabled: program.enabled }))
      programs[index].enabled = !programs[index].enabled
      this.refresh({ programs })
    }
  }
})
