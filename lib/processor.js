/**
 * Processor
 * @param  {Object} initialState initial state for reducers
 * @param  {Object} setup        setup
 * @return {Object}              object containing reducer and utils
 */
module.exports = function(initialState, setup){
  const actions = {},
        beforeActions = {},
        afterActions = {},
        reducers = {};

  const reduxThunkAvailable = (function(){
    try{
      require('redux-thunk')
      return true
    } catch(err){
      return false
    }
  })();

  const createActionCreator = function(type, actionCreator){
    return function(...args){
      const payload = actionCreator ? actionCreator(...args) : args.length > 1 ? args : args[0];
      return { type, payload }
    }
  }

  const createActionType = function(reducerName){
    return reducerName
      .replace(/([a-z\d])([A-Z]+)/g, '$1_$2')
      .replace(/([A-Z\d]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/[-\s]+/g, '_')
      .toUpperCase()
  }

  const createDefaultProcessor = function(){
    return function(state, payload){
      return Object.assign({}, state, payload)
    }
  }
  
  Object.keys(setup).forEach(key => {
    const {type, action, before, after, process} = setup[key];
    const actionType = type || createActionType(key)

    actions[key]          = createActionCreator(actionType, action)
    reducers[actionType]  = process || createDefaultProcessor();

    if(reduxThunkAvailable){
      if(before instanceof Function)  beforeActions[key]  = createActionCreator(`${actionType}_BEFORE`, before)
      if(after instanceof Function)   afterActions[key]   = createActionCreator(`${actionType}_AFTER`, after)
    }
  });

  const getActionCreator = function(actionType){
    actionType = actionType.replace(/(_BEFORE|_AFTER)$/, '');
    if(reducers.hasOwnProperty(actionType)){
      return reducers[actionType]
    }
  }

  const getActions = function(key, context){
    const beforeAction  = reduxThunkAvailable && beforeActions[key] && beforeActions[key].bind(context) || null
    const afterAction   = reduxThunkAvailable && afterActions[key] && afterActions[key].bind(context) || null
    return {
      before  : beforeActions[key],
      after   : afterActions[key],
      action  : actions[key].bind(context)
    }
  }
  
  const reducer = function(state = initialState, action){
    const actionCreator = getActionCreator(action.type);

    if(actionCreator instanceof Function){
      return actionCreator(state, action.payload, action.type)
    }
    
    return state
  }
  
  const wrap = function(store, context=null){
    return Object.keys(actions).reduce(function(wrappedActions, key){
      const actionContext = context || wrappedActions
      const {
        before,
        action,
        after
      } = getActions(key, actionContext);

      wrappedActions[key] = function(...args){
        if(before) store.dispatch(before(...args));
        const result = store.dispatch(action(...args));
        if(after) store.dispatch(after(...args));

        return result
      }
      return wrappedActions
    }, {})
  }
  
  return {
    reducer,
    wrap
  };
};
