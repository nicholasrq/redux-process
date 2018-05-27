const {createStore} = require('redux')
const processor = require('./processor')
const multiProcessor = require('./multi')

module.exports = function (setup, {
  initialState = null,
  enhancer = null,
  reducerEnhancer = null,
}) {
  const {reducer, wrap} = setup.multi
    ? multiProcessor(setup, initialState, {reducerEnhancer})
    : processor(setup, initialState, {reducerEnhancer})

  const store = createStore(reducer, initialState, enhancer || undefined)
  const actions = wrap(store)

  Object.defineProperty(store, 'actions', {value: actions})
  return store
}
