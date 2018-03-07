/**
 * Processor
 * @param  {Object} initialState initial state for reducers
 * @param  {Object} setup        setup
 * @return {Object}              object containing reducer and utils
 */
module.exports = function(initialState, setup){
  const actions = {},
        reducers = {};
  
  Object.keys(setup).forEach(key => {
    const {type, action, process} = setup[key];
    actions[key] = function(...args){
      const payload = action ? action(...args) : args.length > 1 ? args : args[0];
      return { type, payload }
    };
    reducers[type] = process;
  });
  
  const reducer = function(state = initialState, action){
    if(reducers.hasOwnProperty(action.type)){
      return reducers[action.type](state, action.payload)
    }
    
    return {...state}
  }
  
  const wrap = function(store){
    return Object.keys(actions).reduce(function(wrappedActions, key){
      const action = actions[key];
      wrappedActions[key] = function(...args){
        return store.dispatch(action(...args));
      }
      return wrappedActions
    }, {})
  }
  
  return {
    reducer,
    wrap
  };
};
