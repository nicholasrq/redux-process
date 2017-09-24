const {createStore} = require('redux');
const processor = require('../lib/processor');

const initialState = {
  foo: "foo",
  bar: "bar"
}

const createTestStore = function(setup = {}){
  const preducers = processor(initialState, setup);
  const store = createStore(preducers.reducer);
  return {store, actions: preducers.wrap(store)}
}

test('regular actions dispatch', function(){
  const {store} = createTestStore({
    setFoo: {
      type: "SET_FOO",
      process(state, foo){
        return Object.assign({}, state, {foo})
      }
    }
  });
  store.dispatch({ type: "SET_FOO", payload: "hello" });

  expect(store.getState()).toEqual({
    foo: "hello",
    bar: "bar"
  });
});

test('named actions dispatch', function(){
  const {store, actions} = createTestStore({
    setFoo: {
      type: "SET_FOO",
      process(state, foo){
        return Object.assign({}, state, {foo})
      }
    }
  });
  actions.setFoo("hello");

  expect(store.getState()).toEqual({
    foo: "hello",
    bar: "bar"
  });
});

test('named actions dispatch with multiple arguments', function(){
  const {store, actions} = createTestStore({
    setBoth: {
      type: "SET_BOTH",
      process(state, payload){
        const [foo, bar] = payload
        return Object.assign({}, state, {foo, bar})
      }
    },
  });
  actions.setBoth("hello", "world");

  expect(store.getState()).toEqual({
    foo: "hello",
    bar: "world"
  });
});

test('named actions dispatch with multiple arguments and action creator', function(){
  const {store, actions} = createTestStore({
    setBothWithAction: {
      type: "SET_BOTH_ACT",
      action(foo, bar){
        return { foo, bar }
      },
      process(state, payload){
        return Object.assign({}, state, payload)
      }
    }
  });
  actions.setBothWithAction("hello", "world");

  expect(store.getState()).toEqual({
    foo: "hello",
    bar: "world"
  });
});

test('unknown action dispatch', function(){
  const {store, actions} = createTestStore();
  store.dispatch({ type: "UNKNOWN_ACTION", payload: { a: 1, b: 2 } });

  expect(store.getState()).toEqual({
    foo: "foo",
    bar: "bar"
  });
});
