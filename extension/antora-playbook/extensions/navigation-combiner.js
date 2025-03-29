var assert = require('assert')

module.exports.register = function({ config }) {
  this
    .on('contentAggregated', ({ playbook, siteAsciiDocConfig, siteCatalog, contentAggregate }) => {
      playbook.env.SITE_VERSIONS_MENU = 'true'

      const versions = contentAggregate
      .reduce( (acc, componentVersion) => {
        acc = acc.concat(componentVersion.version)
        return acc
      }, []).filter(unique)

      const components = contentAggregate
      .reduce( (acc, component) => {
        acc = acc.concat(component.name)
        return acc
      }, []).filter(unique)

      for (const comp of config.faux) {
        if (!components.includes(comp)) continue;
        const proto = contentAggregate.find( (el) => {
          return el.name == comp && (el.version == config.latestVersion || el.version == 'master' || el.version == '')
        })
        assert(proto !== undefined, 'Prototype of component "' + comp + '" not found?')
        Object.freeze(proto)
        const removalIndex = contentAggregate.indexOf(proto)
        contentAggregate.splice(removalIndex, 1)

        versions.forEach( (v) => {
            if (contentAggregate.find( (el) => {
              return el.name == comp && el.version == v
            }) === undefined) {
              console.log(`Copying prototype of '${proto.version}@${proto.name}' to '${v}@${proto.name}'`)
              const _f = clone(proto, proto.version, v)
              contentAggregate.push(_f)
            }
        })
      }
    })
    .on('navigationBuilt', ({ playbook, siteAsciiDocConfig, siteCatalog, uiCatalog, contentCatalog, navigationCatalog }) => {
      const order = config.order
      const navigationSymbol = Object.getOwnPropertySymbols(navigationCatalog).find( (s) => s.description === "sets" )
      const navigationObject = navigationCatalog[navigationSymbol];
      const byVersion = Object.entries(navigationObject)
      .reduce( (acc, pair) => {
        const [key, value] = pair
        const [version, component] = key.split('@')
        const componentVersion = contentCatalog.getComponentVersion(component, version)
        const componentRoot = {
          content: componentVersion.title,
          url: componentVersion.url,
          urlType: 'internal',
          version: version,
          component: component,
          root: true,
          order: 0,
          items: [],
        }
        if (
          !acc[version]
        ) {
          acc[version] = []
        }
        value.forEach( (el) => {
          if (el.content) componentRoot.items = componentRoot.items.concat(el);
          if (!el.content) componentRoot.items = componentRoot.items.concat(el.items);
        })
        acc[version] = acc[version].concat(componentRoot)
        return acc
      }, {})

      Object.entries(navigationObject)
        .forEach( (pair) => {
          const [key, value] = pair
          const [version, component] = key.split('@')
          navigationObject[key] = buildMenu(byVersion[version], order, [], true)
      })
  })
  .on('beforePublish', ({playbook}) => {
    delete playbook.env.SITE_VERSIONS_MENU
  })
}

function buildMenu(components, order, fl, collect) {
  let result = []
  const foundList = fl ? fl : []
  order.forEach( (el) => {
    if (typeof(el) == 'object' && el.title && el.order) {
      const items = buildMenu(components, el.order, foundList, false).filter( (el) => el !== undefined )
      if (items.length) {
        const componentGroup = { content: el.title, items: items }
        result.push(componentGroup)
      }
    }
    if (typeof(el) == 'string') {
      const found = components.find( (c) => c.component == el )
      if (found !== undefined) {
        result.push( found )
        foundList.push(found.component)
      }
    }
  })
  if (collect) {
    const notInConfig = components.filter( (el) => !foundList.includes(el.component) )
    result = result.concat( notInConfig )
  }
  return result
}

function unique(value, index, array) {
  return array.indexOf(value) === index && value != '' && value != 'master';
}

const isObject = (value) => {
  return !!(value && typeof value === "object" && !Array.isArray(value));
}
const isArray = (value) => {
  return !!(value && Array.isArray(value));
}

function clone(object, preversion, postversion) {

  if (object == null) return null
  let returnValue = undefined

  if (isObject(object)) {
    returnValue = {}
    for (const [key, value] of Object.entries(object)) {
      if (key == 'files') {
        returnValue[key] = value.map( (file) => new file.constructor(Object.assign({}, file, { contents: Buffer.from(file.contents), src: clone(file.src, preversion, postversion) })))
      } else {
        returnValue[key] = clone(value, preversion, postversion)
      }
    }
  }

  if (isArray(object)) {
    returnValue = object.map( (el) => clone(el, preversion, postversion))
  }

  if (!isObject(object) && !isArray(object)) {
    if (typeof object == 'string' && object == preversion) {
      returnValue = postversion
    } else {
      returnValue = object.constructor(object)
    }
  }

  return returnValue
}
