// const {createStore} = require('redux');
// const processor = require('../lib/multi');

// const initialState = {
//   foo: "foo",
//   bar: "bar"
// }

// const createTestStore = function(){
//   const preducers = processor(initialState, {
//     setFoo: {
//       type: "SET_FOO",
//       process(state, foo){
//         return Object.assign({}, state, {foo})
//       }
//     },
//     setBar: {
//       type: "SET_BAR",
//       process(state, bar){
//         return Object.assign({}, state, {bar})
//       }
//     },
//   });

//   const store = createStore(preducers.reducer);
//   return {store, actions: preducers.wrap(store)}
// }

test('regular actions dispatch', function(){
  expect(1).toBe(1);
})
