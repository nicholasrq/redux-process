const processor = require('./processor.js');

const isReservedKey = function(key){
  return [
    'state'
  ].indexOf(key) >= 0
}

module.exports = function(setup, initialState){
  if(initialState == null){
    initialState = {}
  }

  const processors = Object.keys(setup).reduce(function(res, key){
    const selfIniaitlState = setup[key].state
    const actions = Object.keys(setup[key]).reduce((res, sKey) => {
      if(isReservedKey(sKey) === false){
        res[sKey] = setup[key][sKey]
      }
      return res
    }, {})

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
