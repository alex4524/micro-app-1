/* eslint-disable promise/param-names */
import { commonStartEffect, releaseAllEffect, ports } from './common/initial'
import { appInstanceMap } from '../create_app'
import microApp from '..'
import { defer } from '../libs/utils'

describe('micro_app_element', () => {
  let appCon: Element
  beforeAll(() => {
    commonStartEffect(ports.micro_app_element)
    appCon = document.querySelector('#app-container')!

    microApp.start({
      preFetchApps: [
        {
          name: 'test-app1',
          url: `http://127.0.0.1:${ports.micro_app_element}/common`,
        },
        {
          name: 'test-app12',
          url: `http://127.0.0.1:${ports.micro_app_element}/common`,
        },
      ]
    })
  })

  afterAll(() => {
    return releaseAllEffect()
  })

  // 正常渲染
  test('render app2 as usual', async () => {
    const microappElement2 = document.createElement('micro-app')
    microappElement2.setAttribute('name', 'test-app2')
    microappElement2.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/ssr-render/`)
    microappElement2.setAttribute('baseurl', '/baseurl')

    appCon.appendChild(microappElement2)

    await new Promise((reslove) => {
      microappElement2.addEventListener('mounted', () => {
        expect(appInstanceMap.size).toBe(3)
        reslove(true)
      }, false)
    })
  })

  // 当新的app与旧的app name相同而url不同时，且旧app为预加载，则删除旧app的缓存，使用新app覆盖
  test('app3 has same name with prefetch app1 but the url is different', () => {
    const microappElement3 = document.createElement('micro-app')
    microappElement3.setAttribute('name', 'test-app1')
    microappElement3.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/ssr-render/`)

    appCon.appendChild(microappElement3)

    expect(console.warn).toHaveBeenCalled()
  })

  // name冲突
  test('app4 has same name with app2 but the url is different', () => {
    const microappElement4 = document.createElement('micro-app')
    microappElement4.setAttribute('name', 'test-app2')
    microappElement4.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/common/`)

    appCon.appendChild(microappElement4)

    expect(console.error).toHaveBeenCalledWith('[micro-app] app test-app2: an app named test-app2 already exists')
  })

  // 非法url
  test('it should log error when url is invalid', () => {
    const microappElement5 = document.createElement('micro-app')
    microappElement5.setAttribute('name', 'test-app2')
    microappElement5.setAttribute('url', 'abc')

    appCon.appendChild(microappElement5)

    expect(console.error).toBeCalledTimes(2)
  })

  // 修改name或url失败
  test('it should deal with an error when change name or url failed', async () => {
    const microappElement6 = document.createElement('micro-app')
    microappElement6.setAttribute('name', 'test-app6')
    microappElement6.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/common/`)

    microappElement6.setAttribute('name', 'test-app2')

    await new Promise((reslove) => {
      defer(() => {
        expect(console.error).toBeCalledWith('[micro-app] app test-app6: an app named test-app2 already exists')
        expect(microappElement6.getAttribute('name')).toBe('test-app6')
        reslove(true)
      })
    })

    microappElement6.setAttribute('name', 'test-app2')
    microappElement6.setAttribute('url', 'abc')

    await new Promise((reslove) => {
      defer(() => {
        expect(console.error).toBeCalledTimes(3)
        expect(microappElement6.getAttribute('name')).toBe('test-app6')
        reslove(true)
      })
    })
  })

  // 重复定义相同名称元素抛出警告
  test('it should log warn when customElement already exists', () => {
    microApp.start()
    expect(console.warn).toBeCalledWith('[micro-app] element micro-app is already defined')
  })

  // 覆盖修改name/url属性的一些特殊分支
  test('coverage special branch when change attribute name/url', async () => {
    const microappElement7 = document.createElement('micro-app')
    microappElement7.setAttribute('name', 'test-app7')
    microappElement7.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/common/`)

    appCon.appendChild(microappElement7)
    await new Promise((reslove) => {
      microappElement7.addEventListener('mounted', () => {
        reslove(true)
      }, false)
    })

    microappElement7.setAttribute('name', 'new-name') // 设置新name
    microappElement7.setAttribute('name', 'test-app7') // 之后立即恢复之前的值，因为回调是异步处理的，所以会发现属性name和实例名称name是一致的，以此来覆盖某个分支

    await new Promise((reslove) => {
      defer(() => {
        expect(microappElement7.getAttribute('name')).toBe('test-app7')
        microappElement7.setAttribute('name', 'new-name')
        reslove(true)
      })
    })

    const microappElement8 = document.createElement('micro-app')
    microappElement8.setAttribute('name', 'test-app8')
    microappElement8.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/common/`)

    appCon.appendChild(microappElement8)
    await new Promise((reslove) => {
      microappElement8.addEventListener('mounted', () => {
        reslove(true)
      }, false)
    })

    microappElement8.setAttribute('url', 'abc') // 无效的url

    await new Promise((reslove) => {
      defer(() => {
        expect(microappElement8.getAttribute('url')).toBe('abc')
        // @ts-ignore
        expect(microappElement8.appUrl).toBe(`http://127.0.0.1:${ports.micro_app_element}/common/`)
        reslove(true)
      })
    })

    appInstanceMap.delete('test-app8')
    appCon.removeChild(microappElement8)
  })

  // 重新渲染带有shadowDom和baseurl属性应用 -- 分支覆盖
  test('coverage branch of remount app with shadowDom & baseurl', async () => {
    const microappElement10 = document.createElement('micro-app')
    microappElement10.setAttribute('name', 'test-app10')
    microappElement10.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/common/`)
    microappElement10.setAttribute('shadowDom', 'true')
    microappElement10.setAttribute('baseurl', '/baseurl')

    appCon.appendChild(microappElement10)
    let mountCount = 0
    await new Promise((reslove) => {
      microappElement10.addEventListener('mounted', () => {
        mountCount++
        reslove(true)
      }, false)
    })

    appCon.removeChild(microappElement10)

    appCon.appendChild(microappElement10)

    await new Promise((reslove) => {
      setTimeout(() => {
        expect(mountCount).toBe(2) // 渲染2次
        reslove(true)
      }, 200)
    })

    // 分支覆盖
    const microappElement11 = document.createElement('micro-app')
    microappElement11.setAttribute('name', 'test-app11')
    microappElement11.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/common/`)

    appCon.appendChild(microappElement11)
    await new Promise((reslove) => {
      microappElement11.addEventListener('mounted', () => {
        reslove(true)
      }, false)
    })

    appCon.removeChild(microappElement11)

    appCon.appendChild(microappElement11)
  })

  // 修改name或url成功，且修改后的应用为预加载或已经卸载的应用，此时直接从缓存中重新挂载
  test('change name or url to an exist prefetch/unmount app ', async () => {
    const microappElement13 = document.createElement('micro-app')
    microappElement13.setAttribute('name', 'test-app13')
    microappElement13.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/dynamic/`)

    appCon.appendChild(microappElement13)
    await new Promise((reslove) => {
      function handleMounted () {
        microappElement13.removeEventListener('mounted', handleMounted)
        // test-app12# 会格式化为 test-app12
        microappElement13.setAttribute('name', 'test-app12#')
        defer(() => {
          expect(microappElement13.getAttribute('name')).toBe('test-app12')
        })
        microappElement13.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/common`)
        reslove(true)
      }
      microappElement13.addEventListener('mounted', handleMounted, false)
    })

    await new Promise((reslove) => {
      defer(() => {
        expect(appInstanceMap.get('test-app12')?.isPrefetch).toBeFalsy()
        reslove(true)
      })
    })
  })

  // getBaseRouteCompatible 分支覆盖
  test('coverage branch of getBaseRouteCompatible', async () => {
    const microappElement14 = document.createElement('micro-app')
    microappElement14.setAttribute('name', 'test-app14')
    microappElement14.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/common/`)
    microappElement14.setAttribute('baseroute', '/path')

    appCon.appendChild(microappElement14)
    await new Promise((reslove) => {
      microappElement14.addEventListener('mounted', () => {
        reslove(true)
      }, false)
    })
  })

  // 先插入micro-app元素，后设置name、url属性
  test('set name & url after connectedCallback', async () => {
    const microappElement15 = document.createElement('micro-app')
    appCon.appendChild(microappElement15)

    microappElement15.setAttribute('name', 'test-app15')
    microappElement15.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/common/`)

    await new Promise((reslove) => {
      microappElement15.addEventListener('mounted', () => {
        reslove(true)
      }, false)
    })
  })

  // 当新的app与旧的app name相同而url不同时，且旧app已经卸载，则删除旧app的缓存，使用新app覆盖
  test('overwrite unmount app when name conflicts', async () => {
    const microAppElement16 = document.createElement('micro-app')
    microAppElement16.setAttribute('name', 'test-app16')
    microAppElement16.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/common`)

    appCon.appendChild(microAppElement16)

    await new Promise((reslove) => {
      microAppElement16.addEventListener('mounted', () => {
        appCon.removeChild(microAppElement16)
        reslove(true)
      })
    })

    const microAppElement17 = document.createElement('micro-app')
    // name相同，url不同
    microAppElement17.setAttribute('name', 'test-app16')
    microAppElement17.setAttribute('url', `http://127.0.0.1:${ports.micro_app_element}/dynamic/`)

    appCon.appendChild(microAppElement17)

    await new Promise((reslove) => {
      microAppElement17.addEventListener('mounted', () => {
        expect(appInstanceMap.get('test-app16')!.url).toBe(`http://127.0.0.1:${ports.micro_app_element}/dynamic/`)
        reslove(true)
      })
    })
  })

  // 测试一些带有特殊符号的name
  test('test name with special characters', async () => {
    // scene1: 格式化后name为空
    const microAppElement18 = document.createElement('micro-app')
    microAppElement18.setAttribute('name', '123$')
    expect(console.error).toBeCalledWith('[micro-app] Invalid attribute name 123$')

    // scene2: 前后name不一致，重新赋值
    const microAppElement19 = document.createElement('micro-app')
    microAppElement19.setAttribute('name', 'test-app19$')
    expect(microAppElement19.getAttribute('name')).toBe('test-app19')
  })
})
