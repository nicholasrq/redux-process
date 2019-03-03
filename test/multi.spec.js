const {createStore, applyMiddleware} = require('redux');
const thunk = require('redux-thunk').default;
const processor = require('../lib/multi');
const { createLogger } = require('redux-logger')

const initialState = {
  foo: "foo",
  bar: "bar"
}

const middleware = [
  thunk,
  // createLogger({colors: false})
]

const createTestStore = function(setup, setInitialState = true){
  const preducers = processor(setup, setInitialState ? initialState : null);
  const store = createStore(preducers.reducer, applyMiddleware(...middleware));
  return {store, actions: preducers.wrap(store) }
}

test('action names provided', function(){
  const {actions} = createTestStore({
    foo: {
      bar: {
        type: "FOO_BAR",
        reduce(state, foo){
          return foo
        }
      },
      baz: {
        type: "FOO_BAZ",
        reduce(state, foo){
          return foo
        }
      }
    },
    bar: {
      foo: {
        type: "BAR_FOO",
        reduce(state, foo){
          return foo
        }
      },
      baz: {
        type: "BAR_BAZ",
        reduce(state, foo){
          return foo
        }
      }
    }
  })

  expect(actions).toEqual({
    foo: {
      bar:  expect.any(Function),
      baz:  expect.any(Function),
      resetStore: expect.any(Function)
    },
    bar: {
      foo:  expect.any(Function),
      baz:  expect.any(Function),
      resetStore: expect.any(Function)
    },
    resetStore: expect.any(Function)
  })
})

test('regular actions dispatch', function(){
  const {store} = createTestStore({
    foo: {
      set: {
        type: "SET_FOO",
        reduce(state, foo){
          return foo
        }
      }
    }
  })

  store.dispatch({ type: "SET_FOO", payload: "hello" })

  expect(store.getState()).toEqual({
    foo: "hello",
    bar: "bar"
  })
})

test('named actions dispatch', function(){
  const {store, actions} = createTestStore({
    foo: {
      set: {
        type: "SET_FOO",
        reduce(state, foo){
          return foo
        }
      }
    }
  })

  actions.foo.set("hello").then(() => {
    expect(store.getState()).toEqual({
      foo: "hello",
      bar: "bar"
    })
  })
})

test('state separation', function(){
  const {store, actions} = createTestStore({
    foo: {
      state: "foo",
      set: {
        type: "SET_FOO",
        reduce(state, foo){
          return foo
        }
      }
    },
    bar: {
      state: "bar",
      set: {
        type: "SET_BAR",
        reduce(state, foo){
          return foo
        }
      }
    }
  }, false)

  expect(store.getState()).toEqual({
    foo: "foo",
    bar: "bar"
  })

  actions.foo.set("hello").then(() => {
    expect(store.getState()).toEqual({
      foo: "hello",
      bar: "bar"
    })
  })
})

test('state reset', function(){
  const initialState = {
    foo: {
      state: {hello: "foo"},
      set: {
        type: "SET_FOO",
        reduce(state, foo){
          return {hello: foo}
        }
      }
    },
    bar: {
      state: {hello: "bar"},
      set: {
        type: "SET_BAR",
        reduce(state, bar){
          return {hello: bar}
        }
      }
    }
  }
  const {store, actions} = createTestStore(initialState, false)

  store.dispatch({ type: "SET_FOO", payload: "world" })
  expect(store.getState()).toEqual({
    foo: {hello: "world"},
    bar: {hello: "bar"}
  })

  actions.resetStore()
  expect(store.getState()).toEqual({
    foo: {hello: "foo"},
    bar: {hello: "bar"}
  })

  store.dispatch({ type: "SET_FOO", payload: "hello" })
  store.dispatch({ type: "SET_BAR", payload: "world" })
  expect(store.getState()).toEqual({
    foo: {hello: "hello"},
    bar: {hello: "world"}
  })

  actions.resetStore({include: ['foo']})
  expect(store.getState()).toEqual({
    foo: {hello: "foo"},
    bar: {hello: "world"}
  })

  store.dispatch({ type: "SET_FOO", payload: "hello" })
  store.dispatch({ type: "SET_BAR", payload: "world" })
  expect(store.getState()).toEqual({
    foo: {hello: "hello"},
    bar: {hello: "world"}
  })

  actions.resetStore({exclude: ['foo']})
  expect(store.getState()).toEqual({
    foo: {hello: "hello"},
    bar: {hello: "bar"}
  })
})
