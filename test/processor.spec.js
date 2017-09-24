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
    setBoth: {
      type: "SET_BOTH",
      process(state, payload){
        console.log(payload)
        const [foo, bar] = payload
        return Object.assign({}, state, {foo, bar})
      }
    },
    setBothWithAction: {
      type: "SET_BOTH",
      action(foo, bar){
        return { foo, bar }
      },
      process(state, payload){
        return Object.assign({}, state, payload)
      }
    }
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
});

test('named actions dispatch', function(){
  const {store, actions} = createTestStore();
  actions.setFoo("hello");

  expect(store.getState()).toEqual({
    foo: "hello",
    bar: "bar"
  });
});

test('named actions dispatch with multiple arguments', function(){
  const {store, actions} = createTestStore();
  actions.setBoth("hello", "world");

  expect(store.getState()).toEqual({
    foo: "hello",
    bar: "world"
  });
});

test('named actions dispatch with multiple arguments and action creator', function(){
  const {store, actions} = createTestStore();
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
