const {createStore} = require('redux');
const processor = require('../lib/processor');

const initialState = {
  foo: "foo",
  bar: "bar"
}

const createTestStore = function(){
  const preducers = processor(initialState, {
    setFoo: {
      type: "SET_FOO",
      process(state, foo){
        return Object.assign({}, state, {foo})
      }
    },
    setBar: {
      type: "SET_BAR",
      process(state, bar){
        return Object.assign({}, state, {bar})
      }
    },
  });

  const store = createStore(preducers.reducer);
  return {store, actions: preducers.wrap(store)}
}

test('regular actions dispatch', function(){
  const {store} = createTestStore();
  store.dispatch({ type: "SET_FOO", payload: "hello" });

  expect(store.getState()).toEqual({
    foo: "hello",
    bar: "bar"
  });
})

test('named actions dispatch', function(){
  const {store, actions} = createTestStore();
  actions.setFoo("hello");

  expect(store.getState()).toEqual({
    foo: "hello",
    bar: "bar"
  });
})

test('unknown action dispatch', function(){
  const {store, actions} = createTestStore();
  store.dispatch({ type: "UNKNOWN_ACTION", payload: { a: 1, b: 2 } });

  expect(store.getState()).toEqual({
    foo: "foo",
    bar: "bar"
  });
})
