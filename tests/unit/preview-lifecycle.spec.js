/** Preview sessions must not reuse failed buffers or keep hidden streams alive. */
import { shallowMount } from '@vue/test-utils'
import Player from '@/components/RTSPPlayer/index.vue'
import { createLiveFlvPlayer, destroyLiveFlvPlayer } from '@/utils/live-flv-player'

jest.mock('flv.js', () => ({ isSupported: () => true }))
jest.mock('@/utils/live-flv-player', () => ({
  createLiveFlvPlayer: jest.fn(() => ({})),
  destroyLiveFlvPlayer: jest.fn()
}))

describe('preview player lifecycle', () => {
  let wrapper
  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(Player, {
      propsData: { rtspUrl: '', viewProof: false, title: 'Preview' },
      stubs: ['el-card', 'el-button', 'el-row', 'el-col']
    })
  })
  afterEach(() => { wrapper.destroy() })
  async function settle() {
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
  }

  it('initializes only once when URL and visibility change together', async () => {
    await wrapper.setProps({ rtspUrl: '/live/first.live.flv', viewProof: true })
    await settle()
    expect(createLiveFlvPlayer).toHaveBeenCalledTimes(1)
  })

  it('destroys on close and creates a fresh player when the same URL is reopened', async () => {
    await wrapper.setProps({ rtspUrl: '/live/first.live.flv', viewProof: true })
    await settle()
    const first = wrapper.vm.flvPlayer
    wrapper.vm.closeProof()
    expect(destroyLiveFlvPlayer).toHaveBeenCalledWith(first, wrapper.vm.$refs.flvVideo)
    expect(wrapper.vm.flvPlayer).toBeNull()
    await wrapper.setProps({ viewProof: false })
    await wrapper.setProps({ viewProof: true })
    await settle()
    expect(createLiveFlvPlayer).toHaveBeenCalledTimes(2)
    expect(wrapper.vm.flvPlayer).not.toBe(first)
  })

  it('does not start hidden URLs and tears down playback when the parent hides it', async () => {
    await wrapper.setProps({ rtspUrl: '/live/first.live.flv' })
    await settle()
    expect(createLiveFlvPlayer).not.toHaveBeenCalled()
    await wrapper.setProps({ viewProof: true })
    await settle()
    await wrapper.setProps({ viewProof: false })
    expect(wrapper.vm.flvPlayer).toBeNull()
    await wrapper.setProps({ rtspUrl: '/live/second.live.flv' })
    await settle()
    expect(createLiveFlvPlayer).toHaveBeenCalledTimes(1)
  })

  it('replaces the player when switching between different visible sources', async () => {
    await wrapper.setProps({ rtspUrl: '/live/first.live.flv', viewProof: true })
    await settle()
    const first = wrapper.vm.flvPlayer
    await wrapper.setProps({ rtspUrl: '/live/second.live.flv' })
    await settle()
    expect(destroyLiveFlvPlayer).toHaveBeenCalledWith(first, wrapper.vm.$refs.flvVideo)
    expect(createLiveFlvPlayer).toHaveBeenCalledTimes(2)
  })
})
