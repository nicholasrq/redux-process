/**
 * Processor
 * @param  {Object} initialState initial state for reducers
 * @param  {Object} setup        setup
 * @return {Object}              object containing reducer and utils
 */
module.exports = function(
  setup,
  initialState,
  {name = '', reducerEnhancer = null} = {},
) {
  const actions = {}
  const beforeActions = {}
  const afterActions = {}
  const reducers = {}

  const reduxThunkAvailable = (function() {
    try {
      require('redux-thunk')
      return true
    } catch (err) {
      return false
    }
  })()

  const promiseChain = promises => {
    let promised = Promise.resolve()

    for (let promise of promises) {
      promised = promised.then(result => {
        return promise(result) || result
      })
      promised.catch(err => console.log(err))
    }

    return promised
  }

  const createActionCreator = function(type, actionCreator) {
    return function(...args) {
      const payload = actionCreator
        ? actionCreator.call(this, ...args)
        : args.length > 1
          ? args
          : args[0]
      return {type, payload}
    }
  }

  const createActionType = function(reducerName) {
    return reducerName
      .replace(/([a-z\d])([A-Z]+)/g, '$1_$2')
      .replace(/([A-Z\d]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/[-\s]+/g, '_')
      .replace(/^([_]+)|([_]+)$/g, '')
      .toUpperCase()
  }

  const createDefaultReducer = function() {
    return function(state, payload) {
      return Object.assign({}, state, payload)
    }
  }

  const createActionProcessor = function(reducer) {
    return reducer || createDefaultReducer()
  }

  Object.keys(setup).forEach(key => {
    let config = setup[key]

    if (config instanceof Function) {
      config = {action: setup[key]}
    }

    const {type, action, before, after, reduce} = config

    const actionType = type || createActionType(`${name}-${key}`)

    actions[key] = createActionCreator(actionType, action)
    reducers[actionType] = createActionProcessor(reduce)

    Object.defineProperty(actions[key], '_type', {value: actionType})

    if (reduxThunkAvailable) {
      if (before instanceof Function)
        beforeActions[key] = createActionCreator(`${actionType}_BEFORE`, before)
      if (after instanceof Function)
        afterActions[key] = createActionCreator(`${actionType}_AFTER`, after)
    }
  })

  const getReducerFunction = function(actionType) {
    actionType = actionType.replace(/(_BEFORE|_AFTER)$/, '')
    if (reducers.hasOwnProperty(actionType)) {
      return reducers[actionType]
    }
  }

  const getActions = function(key) {
    const beforeAction =
      (reduxThunkAvailable && beforeActions[key] && beforeActions[key]) || null
    const afterAction =
      (reduxThunkAvailable && afterActions[key] && afterActions[key]) || null
    return {
      before: beforeActions[key],
      after: afterActions[key],
      action: actions[key],
    }
  }

  const reducer = function(state = initialState, action) {
    const reducerFunction = getReducerFunction(action.type)

    if (reducerFunction instanceof Function) {
      const reducedState = reducerFunction(state, action.payload, action.type)
      return reducedState
    }

    return state
  }

  const createReducer = function(reducer) {
    if (reducerEnhancer instanceof Function) {
      const enchancedReducer = reducerEnhancer(reducer, name)

      if (enchancedReducer instanceof Function) {
        return enchancedReducer
      } else {
        throw Error('Reducer Enhancer has to return Function')
      }
    } else {
      return reducer
    }
  }

  const invokeAction = function(store, action, args, context) {
    if (action) {
      return Promise.resolve(action.call(context, ...args))
        .then(({type, payload}) => {
          if (payload instanceof Function) {
            return Promise.resolve(payload.call(context))
              .catch(err => console.log(err))
              .then(payload => {
                return {type, payload}
              })
          } else {
            return Promise.resolve(payload)
              .catch(err => console.log(err))
              .then(payload => {
                return {type, payload}
              })
          }
        })
        .then(result => store.dispatch(result))
        .catch(err => console.log(err))
    }
  }

  const wrap = function(store, reducerName) {
    return Object.keys(actions).reduce((wrappedActions, key) => {
      const context = wrappedActions
      const {before, action, after} = getActions(key)

      const wrappedAction = function(...args) {
        if (!reduxThunkAvailable) {
          return store.dispatch(action.call(this, ...args))
        } else {
          return promiseChain([
            () => invokeAction(store, before, args, this),
            () => invokeAction(store, action, args, this),
            () => invokeAction(store, after, args, this),
          ])
        }
      }

      wrappedActions[key] = wrappedAction.bind(context)
      Object.defineProperties(wrappedActions[key], {
        _type: {value: action._type},
        _context: {value: context},
        state: {
          get() {
            return store.getState()
          },
        },
      })
      if (reducerName) {
        Object.defineProperty(wrappedActions[key], 'ownState', {
          get() {
            return this.state[reducerName]
          }
        })
      }
      return wrappedActions
    }, {})
  }

  return {
    reducer: createReducer(reducer),
    wrap,
  }
}
