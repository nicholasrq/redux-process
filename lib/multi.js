const processor = require('./processor.js');

module.exports = function(setup, initialState = {}){
  const processors = Object.keys(setup).reduce(function(res, key){
    const {state: selfIniaitlState, ...actions} = setup[key];
    res[key] = processor(selfIniaitlState || initialState[key], actions);
    return res;
  }, {});
  
  const reducer = function(state = initialState, action){
    return Object.keys(processors).reduce(function(newState, key){
      newState[key] = processors[key].reducer(state[key], action);
      return newState;
    }, state);
  }
  
  const wrap = function(store){
    return Object.keys(processors).reduce(function(actions, key){
      actions[key] = processors[key].wrap(store);
      return actions;
    }, {});
  }
  
  return { reducer, wrap }
}
