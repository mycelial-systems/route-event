export interface RouteEventData {
    scrollX:number;
    scrollY:number;
    popstate:boolean;
}

class Page {
    current:string|null = null
    hasPushState:boolean|typeof window.history.pushState = false
    scroll = {}
    cb:((href:string, data:RouteEventData)=>void)|null = null
    handleAnchor:boolean|((newPath:string)=>boolean) = true

    constructor (
        cb:(href:string, data:RouteEventData) => void,
        opts:{
            pushState?: typeof history.pushState
            handleAnchor?:boolean|((newPath:string)=>boolean)
        } = { pushState: undefined }
    ) {
        this.hasPushState = (opts.pushState !== undefined ?
            opts.pushState :
            (window.history && window.history.pushState)
        )

        if (opts.handleAnchor !== undefined) {
            this.handleAnchor = opts.handleAnchor
        }

        this.cb = cb
    }

    show (href:string, opts = { popstate: false }) {
        href = href.replace(/^\/+/, '/')

        this.saveScroll()
        this.current = href

        const scroll = this.scroll[href]
        this.pushHref(href)

        // when not handling the anchor, route to the base path and let the
        // browser handle the hash natively
        const routePath = (this.shouldHandleAnchor(href) ?
            href :
            stripHash(href))

        this.cb && this.cb(routePath, {
            popstate: opts.popstate,
            scrollX: (scroll && scroll[0]) || 0,
            scrollY: (scroll && scroll[1]) || 0
        })
    }

    shouldHandleAnchor (href:string):boolean {
        if (!href.includes('#')) return true
        return (typeof this.handleAnchor === 'function' ?
            this.handleAnchor(href) :
            this.handleAnchor)
    }

    saveScroll () {
        if (this.scroll && this.current) {
            this.scroll[this.current] = [window.scrollX, window.scrollY]
        }
    };

    pushHref (href:string) {
        this.current = href
        const mismatched = getPath() !== href

        if (mismatched && this.shouldHandleAnchor(href)) {
            window.history.pushState(null, '', href)
        }
    }

    push (href:string) {
        href = href.replace(/^\/+/, '/')
        this.saveScroll()
        this.pushHref(href)
    }
}

function getPath () {
    return window.location.pathname
        + (window.location.search || '')
        + (window.location.hash || '')
}

function stripHash (href:string):string {
    const i = href.indexOf('#')
    const base = i === -1 ? href : href.slice(0, i)
    return base || '/'
}

export default singlePage

export interface PushFunction {
    (href:string):void;
    push:(href:string) => void;
    show:(href:string) => void;
    page:InstanceType<typeof Page>;
}

export function singlePage (
    cb:((href:string, data:RouteEventData)=>void),
    opts?:{
        pushState?:typeof history.pushState;
        handleAnchor?:boolean|((newPath:string)=>boolean);
        init?:boolean  // default true
    }
):PushFunction {
    const page = new Page(cb, opts)
    window.addEventListener('popstate', onpopstate)

    const init = opts?.init === undefined ? true : opts.init

    function onpopstate () {
        const href = getPath()
        page.show(href, { popstate: true })
    }

    if (init) {
        setTimeout(onpopstate, 0)  // trigger an event right away, on page load
    }

    const setRoute:PushFunction = function (href:string) {
        return page.show(href)
    }
    setRoute.push = function (href:string) {
        return page.push(href)
    }
    setRoute.show = function (href) { return page.show(href) }
    setRoute.page = page

    return setRoute
}
