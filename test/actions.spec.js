const {createStore, applyMiddleware} = require('redux')
const thunk = require('redux-thunk').default
const processor = require('../lib/processor')
const {createLogger} = require('redux-logger')

const initialState = {
  foo: 'foo',
  bar: 'bar',
}

const middleware = [
  thunk,
  // createLogger({colors: false})
]

const createTestStore = function(setup = {}) {
  const preducers = processor(setup, initialState)
  const store = createStore(preducers.reducer, applyMiddleware(...middleware))
  return {store, actions: preducers.wrap(store)}
}

test('named actions invoke', function() {
  const {store, actions} = createTestStore({
    setFoo: {
      type: 'SET_FOO',
      reduce(state, foo) {
        return Object.assign({}, state, {foo})
      },
    },
  })

  const unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: 'hello',
      bar: 'bar',
    })
    unsubscribe()
  })

  actions.setFoo('hello')
})

test('named actions content', function(done) {
  const {store, actions} = createTestStore({
    setFoo: {
      type: 'SET_FOO',
      action(payload) {
        expect(actions.isPrototypeOf(this)).toEqual(true)
        done()
        return payload
      },
      reduce(state, foo) {
        return Object.assign({}, state, {foo})
      },
    },
  })

  return actions.setFoo('hello')
})

test('named actions state access', function(done) {
  const {store, actions} = createTestStore({
    setFoo: {
      type: 'SET_FOO',
      action(payload) {
        expect(this.state.foo).toEqual('foo')
        done()
        return payload
      },
      reduce(state, foo) {
        return Object.assign({}, state, {foo})
      },
    },
  })

  return actions.setFoo('hello')
})
