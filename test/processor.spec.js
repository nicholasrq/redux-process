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

test('regular actions dispatch', function() {
  const {store} = createTestStore({
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

  store.dispatch({type: 'SET_FOO', payload: 'hello'})
})

test('named actions dispatch', function() {
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

test('named actions dispatch with multiple arguments', function() {
  const {store, actions} = createTestStore({
    setBoth: {
      type: 'SET_BOTH',
      reduce(state, payload) {
        const [foo, bar] = payload
        return Object.assign({}, state, {foo, bar})
      },
    },
  })

  const unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: 'hello',
      bar: 'world',
    })
    unsubscribe()
  })

  actions.setBoth('hello', 'world')
})

test('named actions dispatch with multiple arguments and action creator', function() {
  const {store, actions} = createTestStore({
    setBothWithAction: {
      type: 'SET_BOTH_ACT',
      action(foo, bar) {
        return {foo, bar}
      },
      reduce(state, payload) {
        return Object.assign({}, state, payload)
      },
    },
  })

  const unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: 'hello',
      bar: 'world',
    })
    unsubscribe()
  })

  actions.setBothWithAction('hello', 'world')
})

test('named actions dispatch with default processor', function() {
  const {store, actions} = createTestStore({
    setBothWithAction: {
      type: 'SET_BOTH_ACT',
      action(foo, bar) {
        return {foo, bar}
      },
    },
  })

  const unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: 'hello',
      bar: 'world',
    })
    unsubscribe()
  })

  actions.setBothWithAction('hello', 'world')
})

test('named actions dispatch with auto generated type', function() {
  const {store, actions} = createTestStore({
    setBothWithAction: {
      action(foo, bar) {
        return {foo, bar}
      },
      reduce(state, payload, type) {
        expect(type).toEqual('SET_BOTH_WITH_ACTION')
        return Object.assign({}, state, payload)
      },
    },
  })

  const unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: 'hello',
      bar: 'world',
    })
    unsubscribe()
  })

  actions.setBothWithAction('hello', 'world')
})

test('unknown action dispatch', function() {
  const {store, actions} = createTestStore()

  const unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: 'foo',
      bar: 'bar',
    })
    unsubscribe()
  })

  store.dispatch({type: 'UNKNOWN_ACTION', payload: {a: 1, b: 2}})
})
