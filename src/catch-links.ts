/**
 * Callback on any link click that is local to the server.
 *
 * @param {HTMLElement} root The root element to listen on.
 * @param {(href:string)=>void} cb The function to call on link click.
 */
export function CatchLinks (
    root:HTMLElement,
    cb:(href:string) => void,
    opts:{
        handleAnchor?:boolean|((href:string)=>boolean),
        handleLink?:(href:string, anchor:HTMLAnchorElement)=>boolean,
    } = {},
):()=>void {
    root.addEventListener('click', onClick)

    function onClick (ev:MouseEvent) {
        // if command click, do nothing
        if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.defaultPrevented) {
            return true
        }

        let anchor:null|HTMLAnchorElement = null
        for (
            let n = (ev.target as HTMLElement|null);
            n && n.parentNode;
            n = n.parentElement
        ) {
            if (n!.nodeName === 'A') {
                anchor = n as HTMLAnchorElement
                break
            }
        }

        // if not a link click, do nothing
        if (!anchor) return true

        const url = new URL(anchor.getAttribute('href')!, location.origin)
        const urlPath = url.pathname + url.search

        // if not local, do nothing
        if (url.host !== location.host) return true

        // if we were given a function to check, call it
        if (opts.handleLink) {
            if (!opts.handleLink(urlPath, anchor)) return
        }

        const handleAnchor = opts.handleAnchor === undefined ? true : opts.handleAnchor

        // else, handle the click
        if (url.href.includes('#')) {
            if (typeof handleAnchor === 'function') {
                // do we want to handle this?
                const handle = handleAnchor(url.href)
                if (handle) {
                    ev.preventDefault()
                    cb(resolve(location.pathname, urlPath || '') +
                        (url.hash || ''))
                    return false
                }
            } else {
                if (handleAnchor) {
                    ev.preventDefault()
                    cb(resolve(location.pathname, urlPath || '') +
                        (url.hash || ''))
                    return false
                }
            }
        } else {
            ev.preventDefault()
            cb(resolve(location.pathname, urlPath || '') + (url.hash || ''))
            return false
        }
    }

    return function unlisten () {
        root.removeEventListener('click', onClick)
    }
}

CatchLinks.resolve = resolve

export default CatchLinks

/**
 * Resolve a local link to a full local path.
 *
 * @param {string} from
 * @param {string} to
 */
export function resolve (from:string, to:string):string {
    const isRelative = (to.charAt(0) !== '/')
    if (!isRelative) return to

    const fromArr = from.split('/')
        .map(path => path.replaceAll('/', ''))
        .filter(Boolean)
    const toArr = to.split('/').map(path => path.replaceAll('/', ''))

    const str = fromArr.concat(toArr).join('/')
    return str.charAt(0) === '/' ? str : '/' + str
}
