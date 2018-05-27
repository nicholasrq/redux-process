const createStore = require('../lib/createStore')

test('creating store', function(){
  const store = createStore({
    setFoo: {
      action () {
        return 'foo'
      },
      reduce(state) {
        return 'foo'
      }
    }
  }, {initialState: 'bar'})

  store.actions.setFoo()
  expect(store.getState()).toEqual('foo')
})

test('creating store', function(){
  const store = createStore({
    setFoo: {
      action () {
        return 'foo'
      },
      reduce(state) {
        return 'foo'
      }
    }
  }, {
    initialState: 'bar',
    reducerEnhancer (reducer, name) {
      return reducer
    }
  })

  store.actions.setFoo()
  expect(store.getState()).toEqual('foo')
})
