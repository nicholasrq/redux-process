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

test('before action', function(done) {
  const {store, actions} = createTestStore({
    setBothWithAction: {
      type: 'SET_BOTH_ACT',
      before(state) {
        return {foo: 'bar'}
      },
      action(foo, bar) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({foo, bar})
          }, 1000)
        })
      },
      reduce(state, payload, type) {
        return Object.assign({}, state, payload)
      },
    },
  })

  let unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: 'bar',
      bar: 'bar',
    })
    unsubscribe()

    unsubscribe = store.subscribe(() => {
      expect(store.getState()).toEqual({
        foo: 'hello',
        bar: 'world',
      })
      unsubscribe()
      done()
    })
  })

  return actions.setBothWithAction('hello', 'world')
})

test('after action', function() {
  const {store, actions} = createTestStore({
    setBothWithAction: {
      type: 'SET_BOTH_ACT',
      async action(foo, bar) {
        return {foo, bar}
      },

      after(state) {
        return {foo: 'bar'}
      },

      reduce(state, payload, type) {
        return Object.assign({}, state, payload)
      },
    },
  })

  let unsubscribe = store.subscribe(() => {
    expect(store.getState()).toEqual({
      foo: 'hello',
      bar: 'world',
    })
    unsubscribe()

    unsubscribe = store.subscribe(() => {
      expect(store.getState()).toEqual({
        foo: 'bar',
        bar: 'world',
      })
      unsubscribe()
    })
  })

  actions.setBothWithAction('hello', 'world')
})
