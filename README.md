# route event
[![tests](https://img.shields.io/github/actions/workflow/status/bicycle-codes/route-event/nodejs.yml?style=flat-square)](https://github.com/bicycle-codes/route-event/actions/workflows/nodejs.yml)
[![types](https://img.shields.io/npm/types/route-event?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![install size](https://flat.badgen.net/packagephobia/install/route-event?cache-control=no-cache)](https://packagephobia.com/result?p=route-event)
[![GZip size](https://img.shields.io/bundlephobia/minzip/route-event?style=flat-square&label=GZip%20size)](https://bundlephobia.com/package/route-event)
[![dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen.svg?style=flat-square)](package.json)
[![license](https://img.shields.io/badge/license-Big_Time-blue?style=flat-square)](LICENSE)


Simple route event for the browser. This will handle URL changes client-side, so
that navigating will not cause a page reload.

Call a function with a path whenever someone clicks a link that is local to the
server. Also, use the [history API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
to handle back/forward button clicks.


<details><summary><h2>Contents</h2></summary>

<!-- toc -->

- [install](#install)
- [Modules](#modules)
  * [CJS](#cjs)
  * [ESM](#esm)
  * [pre-bundled](#pre-bundled)
- [Example](#example)
- [Don't emit a route event when the page first loads](#dont-emit-a-route-event-when-the-page-first-loads)
- [Pass in an element to listen to, and handle events with a router](#pass-in-an-element-to-listen-to-and-handle-events-with-a-router)
- [Use a function to check clicks](#use-a-function-to-check-clicks)
- [focus](#focus)
  * [See also](#see-also)
- [scroll position](#scroll-position)
- [API](#api)
  * [Listener](#listener)
  * [Route](#route)
  * [setRoute](#setroute)
  * [`setRoute.push`](#setroutepush)

<!-- tocstop -->

</details>


## install

```sh
npm i -S route-event
```

## Modules

### CJS
```js
var Route = require('route-event').default
```

### ESM
```js
import Route from 'route-event'
```

### pre-bundled

This package exposes minified JS files too. Copy them to a location that is
accessible to your web server, then link to them in HTML.

#### copy
```sh
cp ./node_modules/route-event/dist/index.min.js ./public/route-event.min.js
```

#### HTML

```html
<script type="module" src="./route-event.min.js"></script>
```

## Example

Listen for click events on `document.body`. If the event is triggered by using
the browser's back/forward button, then `{ popstate }` will be true.

```js
import Route from 'route-event'
const onRoute = Route()  // by default listen on document.body

// listen for click events on docuement.body.
// If the href is local to the server, then call `onRoute`
var stopListening = onRoute(function onRoute (path, data) {
  console.log(path)
  // => '/example/path?abc=123'
  console.log(data)
  // => { scrollX: 0, scrollY: 0, popstate: false }

  const withoutQueryString = path.split(/[?#]/).shift()
  // '/example/path'

  // set focus
  // see https://gomakethings.com/shifting-focus-on-route-change-with-react-router/
  // and https://www.gatsbyjs.com/blog/2019-07-11-user-testing-accessible-client-routing/
  document.querySelector('h1')?.focus()

  // handle scroll state like a web browser
  // (restore scroll position on back/forward)
  if (data.popstate) {
      return window.scrollTo(data.scrollX, data.scrollY)
  }

  // if this was a link click (not back button), then scroll to top
  window.scrollTo(0, 0)
})

// programmatically change the location and call the onRoute cb
routeEvent.setRoute('/some/path')

// change the route, but don't call the callbacks
routeEvent.setRoute.push('/abc')

// ...sometime in the future...
// unsubscribe from route events

stopListening()
```

## Don't emit a route event when the page first loads

By default this will dispatch a route event when the page first loads. Pass
in `{ init: false }` to disabled this.

```js
import Route from 'route-event'

const onRoute = Route({ init: false })
```

Any subsequent clicks will trigger an event, but nothing will happen
on first page load.

## Pass in an element to listen to, and handle events with a router

```js
import Route from 'route-event'
import Router from '@substrate-system/routes'

const router = Router()
const routeEvent = Route({
  el: document.getElementById('example')
})

router.addRoute('/', function () {
  console.log('root')
})

routeEvent(function onChange (path, ev) {
  var m = router.match(path)
  m.action()

  // handle hash links
  if (path.includes('#')) {
      // assuming link is like '#link'
      const pathParts = path.split('#')  // hash
      state.route.value = pathParts.shift()!.split('?').shift()!  // query string
      return setTimeout(() => {  // wait for veiw to render
          document.getElementById(pathParts.pop()!)?.scrollIntoView()
      }, 1)
  }

  // handle scroll state like a web browser
  if (ev.popstate) {
      return window.scrollTo(ev.scrollX, ev.scrollY)
  }
  window.scrollTo(0, 0)
})
```

## Use a function to check clicks

Pass in a function to check if we should handle the link locally, or like
a normal link.

```js
import Route from 'route-event'

const onRoute = Route({
    handleLink: (href) => href === '/abc'
})

onRoute(newPath => {
    console.log(newPath !== 'def')  // true
})

// does not call our client-side handler function
document.querySelector('#def')?.click()
```

## focus

See [a post about focus in SPAs](https://gomakethings.com/shifting-focus-on-route-change-with-react-router/).

> in user testing, [Marcy Sutton found](https://www.gatsbyjs.com/blog/2019-07-11-user-testing-accessible-client-routing/)
> that the generally most well received approach was to shift focus to the `h1`
> heading on each route change.

**Note** in the example, we set focus to the `h1` element on any route change.

```js
onRouteChange(() => {
  const h1 = document.querySelector('h1')
  const tabIndex = h1?.getAttribute('tabindex')
  h1?.setAttribute('tabindex', tabIndex ?? '-1')
  h1?.focus()
})
```

This package includes some CSS to help with focus also. Import the CSS
as normal.

```js
import 'route-event/css'
```



### See also

* [What we learned from user testing of accessible client-side routing techniques with Fable Tech Labs](https://www.gatsbyjs.com/blog/2019-07-11-user-testing-accessible-client-routing/)

> Without page refreshes, screen reader users may not be informed that the page
> has changed.

> a user’s keyboard focus point may be kept in the same place as where they
> clicked, which isn’t intuitive.

#### solutions

1. Dynamically set focus to an HTML wrapper element on page change, to both
   move focus to the new content and make an announcement in assistive technology.

   This pattern often uses tabindex="-1" on a DIV or other block-level element
   to allow focus to be placed on an otherwise non-interactive element.
2. Dynamically set focus to a h1-h6 heading element instead of a wrapper to move
   focus to new content and make a shorter screen reader announcement.
   This also typically requires tabindex="-1"
3. Dynamically set focus to an interactive element like a button. The name of
   the button matters a lot here.
4. Leave focus where it is and make an ARIA Live Region announcement instead.
5. Reset focus to the top of the application (i.e. a parent wrapper element) to
   mimic a traditional browser refresh and announce new content in
   assistive technology.
6. Turn on focus outlines for keyboard and screen reader users while suppressing
   them for the mouse using CSS :focus-visible and polyfill or the What
   Input library.
7. Any combination of the above

## scroll position

The browser will restore your previous scroll position when you use the back
button, but on a new page it will start scrolled to 0, 0.


## API

### Listener
Event listeners are functions that take an `href` and an object with previous
scroll position and `popstate` -- a boolean indicating if this was a link
click or back / forward button (`true` means it was back/forward button).

```ts
interface Listener {
  (href:string, data:{
    scrollX:number,
    scrollY:number,
    popstate:boolean
  }):void;
}
```

### Route
Create an instance of the event listener. Optionally take an element to listen
to. Return a function that takes a callback that will receive route events.
The returned function also has a property `setRoute` that will prgrammatically
change the URL and call any route listeners.

```js
import Route from 'route-event'
```

```ts
function Route (opts:{ el?:HTMLElement } = {}):{
    (cb:Listener):void;
    setRoute:ReturnType<typeof singlePage>
}
```

### setRoute
A property on the returned function so you can programmatically set the URL.

```ts
function setRoute (href:string):void
```

```js
import Route from '@substrate-system/route-event'

const routeEvent = Route()
routeEvent.setRoute('/example')
```

### `setRoute.push`
Change the route, but don't call the callbacks.

```ts
import Route from '@substrate-system/route-event'

const routeEvent = Route()
routeEvent.setRoute.push = function (href:string):void {
```
