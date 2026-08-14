import { test } from '@substrate-system/tapzero'
import { click, dom } from '@substrate-system/dom'
import Route from '../src/index.js'
import { CatchLinks } from '../src/catch-links.js'
import { singlePage } from '../src/single-page.js'

// The test runner serves this page with a query string, eg `/?timeout=5000`.
// `getPath` includes `location.search`, so start every run from a clean '/'.
history.replaceState(null, '', '/')

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

test('a fragment-only href keeps the current path', async t => {
    const calls = await clickFrom('/about', 'hash-only')
    t.deepEqual(calls, ['/about#the-more-marker'],
        'should resolve "#hash" against the document URL, not the origin')
})

test('a path + fragment href is unchanged', async t => {
    const calls = await clickFrom('/about', 'hash-absolute')
    t.deepEqual(calls, ['/about#the-more-marker'],
        'should pass an absolute path through untouched')
})

test('a search-only href keeps the current path', async t => {
    const calls = await clickFrom('/about', 'search-only')
    t.deepEqual(calls, ['/about?q=1'],
        'should resolve "?q=1" against the document URL')
})

test('a relative href resolves against a directory path', async t => {
    const calls = await clickFrom('/docs/', 'relative-segment')
    t.deepEqual(calls, ['/docs/contact'],
        'should resolve a bare segment relative to the directory')
})

test('a relative href resolves against a file path', async t => {
    const calls = await clickFrom('/docs/intro', 'relative-segment')
    t.deepEqual(calls, ['/docs/contact'],
        'should replace the last segment of a non-directory path')
})

test('an anchor with no href is ignored', async t => {
    const calls = await clickFrom('/about', 'no-href')
    t.deepEqual(calls, [], 'should not route an anchor that has no href')
})

test('handleAnchor is called with a path, not an absolute URL', async t => {
    const seen:string[] = []
    const calls = await clickFrom('/about', 'hash-only', {
        handleAnchor: (href) => {
            seen.push(href)
            return true
        }
    })

    t.deepEqual(seen, ['/about#the-more-marker'],
        'should pass the same path shape that singlePage passes')
    t.deepEqual(calls, ['/about#the-more-marker'],
        'should route the link when handleAnchor returns true')
})

test('handleLink is called with the path, minus the hash', async t => {
    const seen:string[] = []
    await clickFrom('/about', 'hash-only', {
        handleLink: (href) => {
            seen.push(href)
            return false
        }
    })

    t.deepEqual(seen, ['/about'],
        'should pass the resolved path without the hash')
})

/**
 * Click a link with the document sitting at `path`, and return every href
 * that `CatchLinks` passed to its callback.
 *
 * The fixture is served from '/', so we need `pushState` to put the document
 * on a non-root path. That is the only way to tell whether hrefs resolve
 * against the document URL or against the origin.
 */
async function clickFrom (
    path:string,
    id:string,
    opts?:Parameters<typeof CatchLinks>[2]
):Promise<string[]> {
    const previous = location.pathname + location.search + location.hash
    const calls:string[] = []
    const root = document.getElementById('link-root')!
    const stop = CatchLinks(root, href => calls.push(href), opts)

    history.pushState(null, '', path)
    try {
        await click(document.getElementById(id)!)
    } finally {
        stop()
        history.pushState(null, '', previous)
    }

    return calls
}

test('all done', () => {
    // @ts-expect-error tests
    window.testsFinished = true
})
