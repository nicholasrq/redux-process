const processor = require('./processor.js')

const isReservedKey = function (key) {
  return [
    'state',
    'multi',
  ].indexOf(key) >= 0
}

module.exports = function (setup, initialState, {
  reducerEnhancer = null
} = {}) {
  if (initialState == null) {
    initialState = {}
  }

  const reducers = Object.keys(setup).reduce((res, key) => {
    const selfInitialState = setup[key].state
    const actions = Object.keys(setup[key]).reduce((res, sKey) => {
      if (isReservedKey(sKey) === false) {
        res[sKey] = setup[key][sKey]
      }
      return res
    }, {})

    res[key] = processor(actions, selfInitialState || initialState[key], {
      name: key,
      reducerEnhancer
    })
    return res
  }, {})

  const reducer = function (state = initialState, action) {
    return Object.keys(reducers).reduce((newState, key) => {
      return Object.assign({}, newState, {
        [key]: reducers[key].reducer(state[key], action),
      })
    }, state)
  }

  const wrap = function (store) {
    return Object.keys(reducers).reduce((actions, key) => {
      actions[key] = reducers[key].wrap(store)
      return actions
    }, {})
  }

  return {reducer, wrap}
}
