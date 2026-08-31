import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onStoreChange) {
	const mql = window.matchMedia(MOBILE_QUERY)
	mql.addEventListener("change", onStoreChange)
	return () => mql.removeEventListener("change", onStoreChange)
}

function getSnapshot() {
	return window.innerWidth < MOBILE_BREAKPOINT
}

// Server/prerender snapshot: assume desktop, matching the previous
// `useState(undefined)` -> `!!undefined` === false initial value.
function getServerSnapshot() {
	return false
}

export function useIsMobile() {
	return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
