const {createStore, applyMiddleware} = require('redux');
const thunk = require('redux-thunk').default;
const processor = require('../lib/processor');
const { createLogger } = require('redux-logger')

const initialState = {
  foo: "foo",
  bar: "bar"
}

const middleware = [
  thunk,
  // createLogger({colors: false})
]

const createTestStore = function(setup = {}){
  const preducers = processor(initialState, setup);
  const store = createStore(preducers.reducer, applyMiddleware(...middleware));
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

  const unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: "hello",
      bar: "bar"
    });
    unsubscribe();
  })

  store.dispatch({ type: "SET_FOO", payload: "hello" });
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

  const unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: "hello",
      bar: "bar"
    });
    unsubscribe();
  });

  actions.setFoo("hello");

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

  const unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: "hello",
      bar: "world"
    });
    unsubscribe();
  });

  actions.setBoth("hello", "world");
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

  const unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: "hello",
      bar: "world"
    });
    unsubscribe();
  });

  actions.setBothWithAction("hello", "world");
});

test('unknown action dispatch', function(){
  const {store, actions} = createTestStore();

  const unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: "foo",
      bar: "bar"
    });
    unsubscribe();
  });

  store.dispatch({ type: "UNKNOWN_ACTION", payload: { a: 1, b: 2 } });
});

test('before action', function(){
  const {store, actions} = createTestStore({
    setBothWithAction: {
      type: "SET_BOTH_ACT",
      before(state){
        return { foo: "bar" }
      },
      action(foo, bar){
        return { foo, bar }
      },
      process(state, payload, type){
        return Object.assign({}, state, payload)
      }
    }
  });

  let unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: "bar",
      bar: "bar"
    });
    unsubscribe();

    unsubscribe = store.subscribe(() => {
      expect(store.getState()).toEqual({
        foo: "hello",
        bar: "world"
      });
      unsubscribe();
    });
  });

  actions.setBothWithAction("hello", "world");
});

test('after action', function(){
  const {store, actions} = createTestStore({
    setBothWithAction: {
      type: "SET_BOTH_ACT",
      after(state){
        return { foo: "bar" }
      },
      action(foo, bar){
        return { foo, bar }
      },
      process(state, payload, type){
        return Object.assign({}, state, payload)
      }
    }
  });

  let unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: "hello",
      bar: "world"
    });
    unsubscribe();

    unsubscribe = store.subscribe(() => {
      expect(store.getState()).toEqual({
        foo: "bar",
        bar: "world"
      });
      unsubscribe();
    });
  });

  actions.setBothWithAction("hello", "world");
});
