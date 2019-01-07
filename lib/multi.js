const processor = require('./processor.js')
const merge = require('./tools').merge

const isReservedKey = function(key) {
  return ['state', 'multi'].includes(key)
}

const RESET_STORE = 'RESET_STORE'

module.exports = function(setup, defaultInitialState, {reducerEnhancer = null} = {}) {
  const globalInitialState = defaultInitialState || {}

  const reducers = Object.keys(setup).reduce((res, key) => {
    if (isReservedKey(key)) return res

    const selfInitialState = setup[key].state
    const initialState = selfInitialState || globalInitialState[key]
    globalInitialState[key] = merge({}, initialState)

    const actions = Object.keys(setup[key]).reduce((res, sKey) => {
      if (isReservedKey(sKey) === false) {
        res[sKey] = setup[key][sKey]
      }
      return res
    }, {})

    res[key] = processor(actions, initialState, {
      name: key,
      reducerEnhancer,
    })
    return res
  }, {})

  const reducer = function(state = globalInitialState, action) {
    if (state == null) state = Object.assign({}, globalInitialState)

    if (action.type === RESET_STORE) {
      return Object.assign({}, globalInitialState)
    }

    return Object.keys(reducers).reduce((newState, key) => {
      return Object.assign({}, newState, {
        [key]: reducers[key].reducer(state[key], action),
      })
    }, state)
  }

  const wrap = function(store) {
    return Object.keys(reducers).reduce((actions, key) => {
      actions[key] = reducers[key].wrap(store, key)
      return actions
    }, {
      resetStore() {
        store.dispatch({type: RESET_STORE})
      }
    })
  }

  return {reducer, wrap}
}
