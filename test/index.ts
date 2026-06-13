import { test } from '@substrate-system/tapzero'
import { click, dom } from '@substrate-system/dom'
import Route from '../src/index.js'
import { singlePage } from '../src/single-page.js'

let unlisten
test('route event, with root call', t => {
    t.plan(1)
    const onRoute = Route()

    return new Promise<void>((resolve) => {
        unlisten = onRoute((newPath) => {
            t.equal(newPath, '/', "should first call with '/' (root path)," +
                " because we didn't pass init: false")
            unlisten()
            resolve()
        })
    })
})

test('stop listening', t => {
    t.plan(1)
    const local = document.getElementById('local-link')
    unlisten()
    dom.click(local!)
    dom.click('#root')

    t.ok(1, 'should not callback after calling "unlisten"')
})

test('Use a function to check links', t => {
    t.plan(1)
    const onRoute = Route({
        handleLink: (href) => href === '/abc'
    })

    onRoute(newPath => {
        t.ok(newPath !== 'def')
    })

    click('#def')
    click('#abc')
})

test('handleAnchor:false routes a hash URL to the base path', t => {
    t.plan(1)
    const onRoute = Route({ handleAnchor: false, init: false })
    const stop = onRoute(newPath => {
        t.equal(newPath, '/',
            'should strip the hash and route to the base path')
    })
    onRoute.setRoute('/#pricing')
    stop()
})

test('singlePage honors a boolean handleAnchor:false', t => {
    t.plan(1)
    const setRoute = singlePage(newPath => {
        t.equal(newPath, '/', 'should route the hash URL to the base path')
    }, { handleAnchor: false, init: false })
    setRoute('/#pricing')
})

test('default handleAnchor passes the hash through to the callback', t => {
    t.plan(1)
    const onRoute = Route({ init: false })
    const stop = onRoute(newPath => {
        t.equal(newPath, '/#pricing',
            'should pass the full hash path through by default')
    })
    onRoute.setRoute('/#pricing')
    stop()
})
