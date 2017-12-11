# Redux-Processor

It's a tool to organize your reducers and action creators, built on top of Redux.

**This module ships ES6 code, so be sure that you're using tools like Babel or your target browsers supports ES6 natively.**

[![Build Status](https://travis-ci.org/nicholasrq/redux-processor.svg?branch=master)](https://travis-ci.org/nicholasrq/redux-processor)
[![codecov](https://codecov.io/gh/nicholasrq/redux-process/branch/master/graph/badge.svg)](https://codecov.io/gh/nicholasrq/redux-process)

# Why yet another tool

We used to organize our action creators and reducers in separate files, but on large scale apps this approach doesn't work very well. Tons of separate files and constants with action names brings bunch of pain for developes. Approach of Processor is to merge all of these files.

Reducers in Processor are separated by chunks of state and it allows you to store initial state, action creators and reducers all together.

# Installation

Simple as hell

```
npm install redux-processor -s
```

or, if you're familiar with Yarn

```
yarn add redux-processor
```

# How to

## Methods

Processor itself provides two functions to create state chunks:

`processor(initialState, actions)` – processor functionality itself

`processorMulti(multiActions[, initialState])` – for those, who's familiar with `combineReducers`

## Importing

Both ES6 modules and CommonJS styles are supported, so you're free to choose you the way to import Processor:

### ES6 style

```javascript
import { processor } from 'redux-processor'
import { multi } from 'redux-processor'

/* OR */

import { multi as processor } from 'redux-processor'

/* OR */

import processor from 'redux-processor/lib/processor'
import multi from 'redux-processor/lib/multi'
```

### CommonJS style

```javascript
const processor = require('redux-processor').processor
const multi = require('redux-processor').multi

/* OR */

const { processor } = require('redux-processor')

/* OR */

const processor = require('redux-processor/lib/processor');
const multi = require('redux-processor/lib/multi');
```

## Basics

Simple example of how to use processor within your application:

```javascript
import { createStore }  from 'redux';
import { processor }    from  'redux-processor';

const initialState = {
  count: 1
};

const preducers = processor(initialState, {
  increase: {
    type: "INCREASE",
    process(state){
      return Object.assign({}, state, {
        count: state.count + 1
      })
    }
  },
  decrease: {
    type: "DECREASE",
    process(state){
      return Object.assign({}, state, {
        count: state.count - 1
      })
    }
  },
})

const store = createStore(preducers.reducer);

store.subscribe(function(){
  console.log(`Count is ${store.getState().count}`)
})

store.dispatch({ type: "INCREASE" }) //=> Count is 1
store.dispatch({ type: "INCREASE" }) //=> Count is 2
store.dispatch({ type: "DECREASE" }) //=> Count is 1
```

## Using Named Actions

Named Actions is a handy tool designed to avoid action types sharing over your app and keep them only as a system-level names. The only place where you can see action types is the reducer declaration file.

To setup Named Actions Processor provides a `wrap(store)` function

```javascript
const store = createStore(preducers.reducer);
const actions = preducers.wrap(store);

store.subscribe(function(){
  console.log(`Count is ${store.getState().count}`)
})

actions.increase() //=> Count is 1
actions.increase() //=> Count is 2
actions.decrease() //=> Count is 1
```

## Action creators

When looking at these examples you maybe wonder how to provide data to reducer when you need to perform more complex mutations to the state. It's also very simple:

```javascript
const initialState = {
  name: "John",
  surname: "Sena"
};

const preducers = processor(initialState, {
  setName: {
    type: "SET_NAME",
    action(name){
      return { name: name }
    },
    process(state, payload){
      return Object.assign({}, state, {
        name: payload.name
      })
    }
  },
  setSurname: {
    type: "SET_SURNAME",
    action(surname){
      return surname
    },
    process(state, surname){
      return {...state, surname}
    }
  },
})

const store = createStore(preducers.reducer);

store.subscribe(function(){
  const {name, surname} = store.getState();
  console.log(`Hello ${name} ${surname}`)
})

store.setName("Mike") //=> Hello Mike Sena
store.setSurname("Wasowski") //=> Hello Mike Wasowski
```

## Describing named actions and action creators

As you can see, action creators works just like you used to. The only difference is that reducer function takes only a payload part of an action, everything else Processor does under the hood, so you don't need to deal with action types at all.

If your actions are so simple, so they don't need any additional data then you can get rid of action creator at all, Processor will create Named Action for you automatically.

Also if you need to pass some data to an action "as-is", then you can pass any number of arguments to Named Actions. The only crucial difference here is that if you're passing more than one argument to a Named Action, then you will get an array inside of reducer. To clarify this part look at the example below:

```javascript
const initialState = {
  name: "John",
  surname: "Sena"
};

const preducers = processor(initialState, {
  setFullName: {
    type: "SET_NAME",
    process(state, payload){
      const [name, surname] = payload
      return Object.assign({}, state, { name, surname })
    }
  }
})

const store = createStore(preducers.reducer);

store.subscribe(function(){
  const {name, surname} = store.getState();
  console.log(`Hello ${name} ${surname}`)
})

store.setFullName("Mike", "Shinoda") //=> Hello Mike Shinoda
```

You can notice that we use array destructuring syntax to create variables with `name` and `surname`. That's because we didn't create any action creator, so Processor has created it for us. As Processor doesn't know anything about data that we're passing and how to deal with it, it just transferring all arguments that we're passing to Named Action down to the reducer function. It causes the payload to be an array.

Otherwise, is we're passing only one argument to a Named Action, then we'll get a single value:

```javascript
const initialState = {
  filter: "ALL",
};

const preducers = processor(initialState, {
  setFilter: {
    type: "SET_FILTER",
    process(state, filter){
      return Object.assign({}, state, { filter })
    }
  }
})

const store = createStore(preducers.reducer);

store.subscribe(function(){
  console.log(`Filter: ${store.getState().filter}`)
})

store.setFilter("COMPLETED") //=> Filter: COMPLETED
```

# Multiple processors

## Basic usge

You're might be familiar with redux's `combineReducers` function. Processor has its own alternative with similar functionality. Let's say you have two scopes in your state: `user` and `todos`. To separate reducers for these scopes you can use `multi(setup[, initialState])` function.

```javascript
import { createStore }        from 'redux';
import { multi as processor } from 'redux-processor';

const initialState = {
  user: {
    name: "Mike",
    surname: "Shinoda"
  },
  todos: []
};

const mpreducers = processor({
  user: {
    setName: {
      type: "SET_NAME",
      process (state, name) => { ...state, name }
    }
    setSurname: {
      type: "SET_SURNAME",
      process (state, surname) => { ...state, surname }
    }
  },
  todos: {
    add: {
      type: "ADD_TODO",
      process(state, payload){
        const todo = Object.assign({
          id: generateTodoID()
        }, payload)
        return [...state, todo]
      }
    }
  }
}, initialState)

const store = createStore(mpreducers.reducer);
const actions = mpreducers.wrap(store);

actions.user.setName("Nicholas");
actions.user.setSurname("Cage");

actions.todos.add("First todo");
actions.todos.add("Second todo");
```

## Defining state for each processor

If you want to define initial state and structure for each reducer individually, then take a look at next example which works just like the previous one, but each reducer takes care of its part of a state. Resulting state is a combination of states returned by individual state chunks:

```javascript
import { createStore }        from 'redux';
import { multi as processor } from 'redux-processor';

const mpreducers = processor({
  user: {
    state: {
      name: "Mike",
      surname: "Shinoda"
    },
    setName: {
      type: "SET_NAME",
      process (state, name) => { ...state, name }
    }
    setSurname: {
      type: "SET_SURNAME",
      process (state, surname) => { ...state, surname }
    }
  },
  todos: {
    state: [],
    add: {
      type: "ADD_TODO",
      process(state, payload){
        const todo = Object.assign({
          id: generateTodoID()
        }, payload)
        return [...state, todo]
      }
    }
  }
})

const store = createStore(mpreducers.reducer);
const actions = mpreducers.wrap(store);

actions.user.setName("Nicholas");
actions.user.setSurname("Cage");

actions.todos.add("First todo");
actions.todos.add("Second todo");
```

In this case you don't need to provide initial state for `processor`, instead you providing state for each state chunk itself.

# Organizing reducers

With processor it's very simple to organize your code using separate files for each of your state chunks:

`user_reducer.js`

```javascript
module.exports.state = {
  name: "Mike",
  surname: "Shinoda"
}

module.exports.setName = {
  type: "SET_NAME",
  process (state, name) => { ...state, name }
}

module.exports.setSurname = {
  type: "SET_SURNAME",
  process (state, surname) => { ...state, surname }
}
```

`todos_reducer.js`

```javascript
module.exports.state = []

module.exports.add = {
  type: "ADD_TODO",
  process(state, payload){
    const todo = Object.assign({
      id: generateTodoID()
    }, payload)
    return [...state, todo]
  }
}
```

`app.js`

```javascript
import { createStore }        from 'redux';
import { multi as processor } from 'redux-processor';

const mpreducers = processor({
  user: require('reducers/user_reducer.js'),
  todos: require('reducers/todos_reducer.js')
})

const store = createStore(mpreducers.reducer);
const actions = mpreducers.wrap(store);

actions.user.setName("Nicholas");
actions.user.setSurname("Cage");

actions.todos.add("First todo");
actions.todos.add("Second todo");
```

# Contribution

Feel free to fork and create PRs.

# License

MIT
