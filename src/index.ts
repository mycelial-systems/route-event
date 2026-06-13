import { CatchLinks } from './catch-links.js'
import { type PushFunction, singlePage } from './single-page.js'

export interface Listener {
    (href:string, data:{ scrollX:number, scrollY:number, popstate:boolean }):void;
}

/**
 * Routes
 * @param {} opts
 * @returns A function that takes a callback for route change events, and has
 * a property to set the route.
 */
export function Route (opts:{
    el?:HTMLElement;
    handleAnchor?:boolean|((href:string)=>boolean),
    handleLink?:(href:string)=>boolean,
    init?:boolean
} = {}):{
    (cb:Listener):()=>void;
    setRoute:PushFunction;
} {
    let listeners:Listener[] = []
    const init = opts.init
    const el = opts.el || document?.body
    if (!el) throw new Error('Not document')

    const listen = function listen (cb:Listener) {
        listeners.push(cb)

        return function unlisten () {
            listeners = listeners.filter(listener => {
                return listener !== cb
            })
        }
    }

    const setRoute = singlePage((href, eventData) => {
        listeners.forEach(function (cb) {
            cb(href, eventData)
        })
    }, { init, handleAnchor: opts.handleAnchor })

    CatchLinks(el, setRoute, {
        handleAnchor: opts.handleAnchor,
        handleLink: opts.handleLink
    })

    const _setRoute:PushFunction = function (href:string) {
        setRoute(href)
    }

    _setRoute.push = function (href:string):void {
        setRoute.push(href)
    }

    _setRoute.show = function (href) {
        setRoute.show(href)
    }

    _setRoute.page = setRoute.page

    listen.setRoute = _setRoute

    return listen
}

export default Route
