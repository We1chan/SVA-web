import { mount, createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import RTSPPlayer from '@/components/RTSPPlayer/index.vue'
import flvjs from 'flv.js'

jest.mock('flv.js', () => ({
  isSupported: jest.fn(() => true),
  createPlayer: jest.fn(() => ({
    attachMediaElement: jest.fn(),
    load: jest.fn(),
    play: jest.fn()
  }))
}))

const localVue = createLocalVue()
localVue.use(ElementUI)

describe('RTSPPlayer', () => {
  beforeEach(() => {
    jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('does not use a hard-coded RTSP gateway when the API has not returned a browser-playable URL', async () => {
    const warning = jest.fn()
    const wrapper = mount(RTSPPlayer, {
      localVue,
      propsData: {
        rtspUrl: 'rtsp://camera.example/live',
        viewProof: false,
        title: '实时预览'
      },
      mocks: { $message: { warning } }
    })

    wrapper.vm.initFLVPlayer()

    expect(flvjs.createPlayer).not.toHaveBeenCalled()
    expect(warning).toHaveBeenCalledWith('未获取到浏览器可播放的视频地址，请刷新设备状态后重试')
    wrapper.destroy()
  })

  it('uses the slightly expanded layout when GB28181 controls need more room', () => {
    const wrapper = mount(RTSPPlayer, {
      localVue,
      propsData: {
        rtspUrl: '',
        viewProof: false,
        title: '国标预览',
        expanded: true
      }
    })

    expect(wrapper.classes()).toContain('box-card--expanded')
    wrapper.destroy()
  })

  it('applies digital zoom and viewport movement only to the preview video', () => {
    const wrapper = mount(RTSPPlayer, {
      localVue,
      propsData: {
        rtspUrl: '',
        viewProof: false,
        title: '国标预览',
        viewportZoom: 1.2,
        viewportX: 1,
        viewportY: -1
      }
    })

    expect(wrapper.vm.viewportStyle.transform).toBe('translate(-10%, 10%) scale(1.2)')
    expect(wrapper.find('video').attributes('style')).toContain('scale(1.2)')
    wrapper.destroy()
  })
})
