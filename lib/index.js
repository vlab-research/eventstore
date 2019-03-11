const Cacheman = require('cacheman')

function _resolve(li, e) {
  if (!e) return li
  if (!li) return [e]

  const i = li.indexOf(e)
  return i === -1 ? [...li, e] : li.slice(0,i+1)
}

class EventStore {
  constructor(db, ttl = '24h') {
    if (!db) throw new TypeError('EventStore must be given a db')

    this.db = db
    this.cache = new Cacheman({ttl})
  }

  _makeKey(user) {
    return `state:${user}`
  }

  async put (user, event) {
    const key = this._makeKey(user)
    const prev = await this.cache.get(key) || []
    return this.cache.set(key, [...prev, event])
  }

  async getEvents(user, event) {

    const key = this._makeKey(user)
    let res = await this.cache.get(key)

    if (!res) {
      res = await this.db.get(user)
      await this.cache.set(key, res)
    }

    const events = _resolve(res, event)
    const getMessage = m => m.messaging ? m.messaging[0] : m
    return events.map(JSON.parse).map(getMessage)
  }
}

// class StateStore {
//   constructor (db) {
//     if (!db) throw new TypeError('EventStore must be given a db')
//     this.db = db
//     this.cache = new Cacheman()
//   }

//   _makeKey(user) {
//     return `state:${user}`
//   }

//   async _getEvents(user, event) {
//     const res = await this.db.get(user)
//     return _resolve(res, event)
//       .map(JSON.parse)
//       .map(m => m.messaging ? m.messaging[0] : m)
//   }


//   // get state UP TO BUT NOT INCLUDING this event
//   async getState(user, event) {
//     const key = this.makeKey(user)
//     const cached = await this.cache.get(key)
//     if (cached) return cached

//     const state = getState(this._getEvents(user, event))

//     return state
//   }

//   async updateState(user, state, event) {
//     const key = this.makeKey(user)
//     const newState = apply(state, exec(state, event))
//     return this.cache.put(key, newState, '2h')
//   }
// }



module.exports = { _resolve, EventStore }
