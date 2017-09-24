const {createStore} = require('redux');
const processor = require('../lib/multi');

const initialState = {
  foo: "foo",
  bar: "bar"
}

const createTestStore = function(setup, setInitialState = true){
  const preducers = processor(setup, setInitialState ? initialState : null);

  const store = createStore(preducers.reducer);
  return {store, actions: preducers.wrap(store)}
}

test('action names provided', function(){
  const {actions} = createTestStore({
    foo: {
      bar: {
        type: "FOO_BAR",
        process(state, foo){
          return foo
        }
      },
      baz: {
        type: "FOO_BAZ",
        process(state, foo){
          return foo
        }
      }
    },
    bar: {
      foo: {
        type: "BAR_FOO",
        process(state, foo){
          return foo
        }
      },
      baz: {
        type: "BAR_BAZ",
        process(state, foo){
          return foo
        }
      }
    }
  })

  expect(actions).toEqual({
    foo: {
      bar:  expect.any(Function),
      baz:  expect.any(Function)
    },
    bar: {
      foo:  expect.any(Function),
      baz:  expect.any(Function)
    }
  })
})

test('regular actions dispatch', function(){
  const {store} = createTestStore({
    foo: {
      set: {
        type: "SET_FOO",
        process(state, foo){
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
        process(state, foo){
          return foo
        }
      }
    }
  })

  actions.foo.set("hello")

  expect(store.getState()).toEqual({
    foo: "hello",
    bar: "bar"
  })
})

test('state separation', function(){
  const {store, actions} = createTestStore({
    foo: {
      state: "foo",
      set: {
        type: "SET_FOO",
        process(state, foo){
          return foo
        }
      }
    },
    bar: {
      state: "bar",
      set: {
        type: "SET_BAR",
        process(state, foo){
          return foo
        }
      }
    }
  }, false)

  expect(store.getState()).toEqual({
    foo: "foo",
    bar: "bar"
  })

  actions.foo.set("hello")

  expect(store.getState()).toEqual({
    foo: "hello",
    bar: "bar"
  })
})
