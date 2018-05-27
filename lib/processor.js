/**
 * Processor
 * @param  {Object} initialState initial state for reducers
 * @param  {Object} setup        setup
 * @return {Object}              object containing reducer and utils
 */
module.exports = function (initialState, setup, name = '') {
  const actions = {}
  const beforeActions = {}
  const afterActions = {}
  const reducers = {}

  const reduxThunkAvailable = (function () {
    try {
      require('redux-thunk')
      return true
    } catch (err) {
      return false
    }
  }())

  const createActionCreator = function (type, actionCreator) {
    return function (...args) {
      const payload = actionCreator ? actionCreator(...args) : args.length > 1 ? args : args[0]
      return {type, payload}
    }
  }

  const createActionType = function (reducerName) {
    return reducerName
      .replace(/([a-z\d])([A-Z]+)/g, '$1_$2')
      .replace(/([A-Z\d]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/[-\s]+/g, '_')
      .replace(/^([_]+)|([_]+)$/g, '')
      .toUpperCase()
  }

  const createDefaultProcessor = function () {
    return function (state, payload) {
      return Object.assign({}, state, payload)
    }
  }

  Object.keys(setup).forEach((key) => {
    let config = setup[key]

    if (config instanceof Function) {
      config = {action: setup[key]}
    }

    const {
      type, action, before, after, process,
    } = config

    const actionType = type || createActionType(`${name}-${key}`)

    actions[key] = createActionCreator(actionType, action)
    reducers[actionType] = process || createDefaultProcessor()

    Object.defineProperty(actions[key], '_type', {value: actionType})

    if (reduxThunkAvailable) {
      if (before instanceof Function) beforeActions[key] = createActionCreator(`${actionType}_BEFORE`, before)
      if (after instanceof Function) afterActions[key] = createActionCreator(`${actionType}_AFTER`, after)
    }
  })

  const getReducerFunction = function (actionType) {
    actionType = actionType.replace(/(_BEFORE|_AFTER)$/, '')
    if (reducers.hasOwnProperty(actionType)) {
      return reducers[actionType]
    }
  }

  const getActions = function (key) {
    const beforeAction = reduxThunkAvailable && beforeActions[key] && beforeActions[key] || null
    const afterAction = reduxThunkAvailable && afterActions[key] && afterActions[key] || null
    return {
      before: beforeActions[key],
      after: afterActions[key],
      action: actions[key],
    }
  }

  const reducer = function (state = initialState, action) {
    const reducerFunction = getReducerFunction(action.type)

    if (reducerFunction instanceof Function) {
      const reducedState = reducerFunction(state, action.payload, action.type)
      return reducedState
    }

    return state
  }

  const wrap = function (store, context = null) {
    return Object.keys(actions).reduce((wrappedActions, key) => {
      const actionContext = wrappedActions
      const {before, action, after} = getActions(key)

      const wrappedAction = function (...args) {
        if (before) store.dispatch(before.call(this, ...args))
        const result = store.dispatch(action.call(this, ...args))
        if (after) store.dispatch(after.call(this, ...args))

        return result
      }

      wrappedActions[key] = wrappedAction.bind(actionContext)
      Object.defineProperty(wrappedActions[key], '_type', {value: action._type})
      Object.defineProperty(wrappedActions[key], '_context', {value: actionContext})
      return wrappedActions
    }, {})
  }

  return {
    reducer,
    wrap,
  }
}
