/* eslint-disable promise/param-names */
import * as Utils from '../../libs/utils'
import { rewriteConsole, releaseConsole } from '../common/initial'

beforeAll(() => {
  rewriteConsole()
})

afterAll(() => {
  releaseConsole()
})

test('uitls ==> logError & logWarn', () => {
  Utils.logError('msg')
  expect(console.error).toHaveBeenLastCalledWith('[micro-app] msg')
  Utils.logError(new Error('123'), 'appName', 111)
  expect(console.error).toHaveBeenLastCalledWith('[micro-app] app appName:', expect.any(Error), 111)

  Utils.logWarn('msg')
  expect(console.warn).toHaveBeenLastCalledWith('[micro-app] msg')
  Utils.logWarn(new Error('123'), 'appName', 111)
  expect(console.warn).toHaveBeenLastCalledWith('[micro-app] app appName:', expect.any(Error), 111)
})

test('call function in micro task', () => {
  const mockFn = jest.fn()
  Utils.defer(mockFn)
  Promise.resolve().then(() => {
    expect(mockFn).toHaveBeenCalled()
  })
})

test('uitls ==> formatAppURL', () => {
  expect(Utils.formatAppURL('http://localhost:3000/path-a')).toBe('http://localhost:3000/path-a/')
  expect(Utils.formatAppURL('//localhost:3000/path-a/')).toBe('http://localhost:3000/path-a/')
  expect(Utils.formatAppURL('http://localhost:3000/path-a/index.html')).toBe('http://localhost:3000/path-a/index.html')
  expect(Utils.formatAppURL(null)).toBe('')
  expect(Utils.formatAppURL('')).toBe('')
  expect(Utils.formatAppURL('htt://abc')).toBe('')
  expect(Utils.formatAppURL('abc')).toBe('')
  expect(console.error).toBeCalledWith('[micro-app]', expect.anything())
})

test('uitls ==> getEffectivePath', () => {
  expect(Utils.getEffectivePath('http://abc/index.html')).toBe('http://abc/')
  expect(Utils.getEffectivePath('http://abc/index.node')).toBe('http://abc/')
  expect(Utils.getEffectivePath('http://abc/index.php')).toBe('http://abc/')
  expect(Utils.getEffectivePath('http://abc')).toBe('http://abc/')
  expect(Utils.getEffectivePath('http://abc/?a=1#page1')).toBe('http://abc/')
})

test('uitls ==> CompletionPath', () => {
  expect(Utils.CompletionPath('http://abc/img.png', 'http://localhost:3000/')).toBe('http://abc/img.png')
  expect(Utils.CompletionPath('/img.png', 'http://localhost:3000/path/')).toBe('http://localhost:3000/img.png')
})

test('uitls ==> getLinkFileDir', () => {
  expect(Utils.getLinkFileDir('https://localhost:3000/path/css/filename.css')).toBe('https://localhost:3000/path/css/')
})

test('uitls ==> promiseStream', async () => {
  const successFn = jest.fn()
  const errorFn = jest.fn()
  const finallyCb = jest.fn()
  const promiseList: Array<Promise<string> | string> = []
  promiseList.push(new Promise((reslove) => {
    setTimeout(() => {
      reslove('1')
    }, 200)
  }))

  promiseList.push(new Promise((reslove) => {
    setTimeout(() => {
      reslove('2')
    }, 100)
  }))

  const e = new Error('3')
  promiseList.push(new Promise((_, reject) => {
    setTimeout(() => {
      reject(e)
    }, 300)
  }))

  promiseList.push('4')

  Utils.promiseStream<string>(promiseList, successFn, errorFn, finallyCb)
  expect(successFn).toHaveBeenCalledWith({ data: '4', index: 3 })
  setTimeout(() => {
    expect(successFn).toHaveBeenCalledWith({ data: '2', index: 1 })
  }, 150)
  setTimeout(() => {
    expect(successFn).toHaveBeenCalledWith({ data: '1', index: 0 })
  }, 250)

  await new Promise((reslove) => {
    setTimeout(() => {
      expect(errorFn).toHaveBeenCalledWith({ error: e, index: 2 })
      expect(finallyCb).toHaveBeenCalled()
      reslove(true)
    }, 350)
  })
})

test('check if browser support module script', () => {
  expect(Utils.isSupportModuleScript()).toBeFalsy()
})

test('create random string', () => {
  expect(Utils.createNonceSrc()).not.toHaveLength(21)
})

test('the fastest remove array duplication method', () => {
  expect(Utils.unique([1, 2, 2, 3, 4, 3, 5]).join('')).toBe('12345')
})

test('polyfill for requestIdleCallback', async () => {
  // 浏览器自带api
  const mockFn = jest.fn()
  Utils.requestIdleCallback(mockFn)
  expect(mockFn).not.toBeCalled()
  await new Promise((reslove) => {
    setTimeout(() => {
      expect(mockFn).toBeCalled()
      reslove(true)
    }, 100)
  })

  Object.defineProperty(window, 'requestIdleCallback', {
    value: undefined,
    writable: true,
    configurable: true,
  })

  // polyfill
  const mockFn2 = jest.fn()
  Utils.requestIdleCallback((param: any) => {
    mockFn2()
    expect(param.didTimeout).toBeFalsy()
    expect(param.timeRemaining()).toBeLessThan(51)
  })
  expect(mockFn2).not.toBeCalled()
  await new Promise((reslove) => {
    setTimeout(() => {
      expect(mockFn2).toBeCalled()
      reslove(true)
    }, 100)
  })
})

test('mark the active appname', () => {
  Utils.setCurrentAppName('appname')
  expect(Utils.getCurrentAppName()).toBe('appname')
  Utils.removeDomScope()
  expect(Utils.getCurrentAppName()).toBe(null)
})

test('get result whether in safari', () => {
  expect(Utils.isSafari()).toBeFalsy()

  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15',
    writable: true,
    configurable: true,
  })

  expect(Utils.isSafari()).toBeTruthy()
})

test('get result whether target is function', () => {
  expect(Utils.isFunction(() => {})).toBeTruthy()
})

test('get element that not marked by micro-app', () => {
  // @ts-ignore
  expect(Utils.pureCreateElement('div').__MICRO_APP_NAME__).toBeUndefined()
})

test('coverage of isNull function', () => {
  expect(Utils.isNull(null)).toBeTruthy()
})

test('coverage of isInvalidQuerySelectorKey', () => {
  // @ts-ignore
  window.__TEST__ = false
  expect(Utils.isInvalidQuerySelectorKey('a&bc')).toBeTruthy()
  // @ts-ignore
  window.__TEST__ = true
})

test('coverage of formatAppName', () => {
  expect(Utils.formatAppName(null)).toBe('')
  expect(Utils.formatAppName('')).toBe('')
})
