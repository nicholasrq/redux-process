//@ts-check
/**
 * Processor
 * @param  {Object} initialState initial state for reducers
 * @param  {Object} setup        setup
 * @return {Object}              object containing reducer and utils
 */
module.exports = function(setup, initialState, {
  name = '',
  reducerEnhancer = null
} = {}) {
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

  /**
   * @param {promise[]|function[]} promises
   */
  const promiseChain = promises => {
    let promised = Promise.resolve()
    const chainResult = []

    for (let promise of promises) {
      promised = promised.then(result => {
        if (typeof promise === 'function') {
          return promise(result)
        } else {
          return promise || result
        }
      })

      promised.then(result => {
        if (result !== undefined) {
          chainResult.push(result)
        }
        return result
      }).catch(err => console.log(err))
    }

    return promised.then(() => chainResult)
  }

  /**
   *
   * @param {string} type
   * @param {function} actionCreator
   */
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
    if (action.type === 'RESET_STORE') {
      const {include, exclude} = action.payload
      const resetState = Object.assign({}, initialState)
      const shouldReset = (include === undefined && exclude === undefined) ||
                          ((include && include.indexOf(name) >= 0) === true) ||
                          ((exclude && exclude.indexOf(name) >= 0) === false)

      if (shouldReset) {
        return resetState
      }

      return state
    }

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
        .then(action => {
          store.dispatch(action)
          return action.payload
        })
        .catch(err => console.log(err))
    }
  }

  const wrap = function(store, reducerName) {
    const reducer = Object.keys(actions).reduce((wrappedActions, key) => {
      const {before, action, after} = getActions(key)
      const context = Object.create(wrappedActions, {
        _type: {value: action._type},
      })

      const wrappedAction = function(...args) {
        if (!reduxThunkAvailable) {
          return store.dispatch(action.call(this, ...args))
        } else {
          return promiseChain([
            () => invokeAction(store, before, args, this),
            () => invokeAction(store, action, args, this),
            () => invokeAction(store, after, args, this),
          ]).then((result) => {
            if (result.length > 1) {
              return result
            } else {
              return result[0]
            }
          })
        }
      }

      wrappedActions[key] = wrappedAction.bind(context)
      return wrappedActions
    }, {
      resetStore () {
        store.dispatch({
          type: 'RESET_STORE',
          payload: { include: [name] }
        })
      }
    })

    Object.defineProperties(reducer, {
      state: {
        get() {
          return store.getState()
        },
      },
    })

    if (reducerName) {
      Object.defineProperty(reducer, 'ownState', {
        get() {
          return this.state[reducerName]
        },
      })
    }

    return reducer
  }

  // promiseChain(['string'])

  return {
    reducer: createReducer(reducer),
    wrap,
  }
}
