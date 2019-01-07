const isObject = (obj) => {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

const isArray = (obj) => {
  return Object.prototype.toString.call(obj) === '[object Array]'
}

const merge = (obj1, obj2) => {
  if (isObject(obj1) && isObject(obj2)) {
    return Object.assign({}, obj1, obj2)
  } else if (isArray(obj1) && isArray(obj2)) {
    return [].concat(...obj1, ...obj2)
  } else {
    return obj2
  }
}

module.exports = {
  isObject,
  isArray,
  merge,
}
