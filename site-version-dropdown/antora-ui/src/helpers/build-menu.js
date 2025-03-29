'use strict'

const cache = {}

module.exports = (collection, currentComponent, currentVersion, orderSpec) => {
  if (currentComponent === undefined || currentVersion === undefined || orderSpec === undefined) return
  const returnPre = [
    '<div class="component-versions-wrapper">',
    '<div class="component-versions-label">Версия</div>',
    '<div class="component-versions">'
  ]
  const ret1 = '<div class="version-menu">'
  const ret2 = '</div>'
  const returnPost = [
    '</div>',
    '</div>'
  ]

  if (!cache.siteData) {
    cache.siteData = []
    for (const [component, componentValue] of Object.entries(collection)) {
      componentValue.versions.forEach( (version) => {
        cache.siteData.push({component: component, version: version.version, displayVersion: version.displayVersion, url: version.url})
      })
    }

    const byVersions = cache.siteData.reduce( (acc, el) => {
      if (!acc.has(el.version)) { acc.set(el.version, []) }
      acc.set(el.version, acc.get(el.version).concat(el))
      return acc
    }, new Map())
    cache.byVersions = byVersions
  }

  for (const [version, componentsList] of cache.byVersions) {
    componentsList.sort( (a, b) => {
      if (orderSpec.indexOf(a.component) >=  0 && orderSpec.indexOf(b.component) == -1) return -1;
      if (orderSpec.indexOf(a.component) == -1 && orderSpec.indexOf(b.component) >=  0) return 1;

      if (orderSpec.indexOf(a.component) > orderSpec.indexOf(b.component)) return 1;
      if (orderSpec.indexOf(a.component) < orderSpec.indexOf(b.component)) return -1;
      if (orderSpec.indexOf(a.component) === orderSpec.indexOf(b.component)) return 0;
    })
  }

  const byVersions = cache.byVersions

  const versionsOrder = [...byVersions.keys()].sort().reverse()
  const currentVersionIndex = versionsOrder.indexOf(currentVersion); versionsOrder.splice(currentVersionIndex,1)

  const _ret = byVersions.get(currentVersion)[0]
  let _result
  if (byVersions.size > 1) {
    _result = returnPre.concat(`<button class="version-menu-toggle" title="Перейти к другой версии">${_ret.displayVersion}</button>`)
  } else {
    _result = returnPre.concat(`<button class="version-menu-toggle" disabled>${_ret.displayVersion}</button>`)
  }

  _result = _result.concat(ret1)
  versionsOrder.forEach( (v) => {
    const t = byVersions.get(v)[0]
    _result = _result.concat(`<a class="version" href="${t.url}">${t.displayVersion}</a>`)
  })
  _result = _result.concat(ret2)

  _result = _result.concat(returnPost)
  return _result.join('')

}

