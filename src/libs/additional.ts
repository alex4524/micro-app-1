import { appInstanceMap } from '../create_app'
import { elementInstanceMap } from '../micro_app_element'
import { releasePatches } from '../source/patch'
import { isShadowRoot } from '../libs/utils'

function unmountNestedApp (): void {
  replaseUnmountOfNestedApp()

  appInstanceMap.forEach(app => {
    let element = app.container
    if (element) {
      isShadowRoot(element) && (element = (element as ShadowRoot).host as HTMLElement)
      // @ts-ignore
      element.disconnectedCallback()
    }
  })

  !window.__MICRO_APP_UMD_MODE__ && appInstanceMap.clear()

  if (elementInstanceMap.size) {
    elementInstanceMap.clear()
    releasePatches()
  }
}

// if micro-app run in micro application, delete all next generation application when unmount event received
export function listenUmountOfNestedApp (): void {
  if (window.__MICRO_APP_ENVIRONMENT__) {
    window.addEventListener('unmount', unmountNestedApp, false)
  }
}

// release listener
export function replaseUnmountOfNestedApp (): void {
  if (window.__MICRO_APP_ENVIRONMENT__) {
    window.removeEventListener('unmount', unmountNestedApp, false)
  }
}
