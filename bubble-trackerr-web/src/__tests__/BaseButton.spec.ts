import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '@/components/ui/BaseButton.vue'

describe('BaseButton', () => {
  it('renders slot content', () => {
    const wrapper = mount(BaseButton, {
      slots: { default: 'Click Me' }
    })
    expect(wrapper.text()).toBe('Click Me')
  })

  it('shows loading state', () => {
    const wrapper = mount(BaseButton, {
      props: { loading: true },
      slots: { default: 'Save' }
    })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('emits click event', async () => {
    const wrapper = mount(BaseButton, {
      slots: { default: 'Click' }
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(BaseButton, {
      props: { disabled: true },
      slots: { default: 'Click' }
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('renders with primary variant by default', () => {
    const wrapper = mount(BaseButton, {
      slots: { default: 'OK' }
    })
    const button = wrapper.find('button')
    expect(button.classes()).toContain('bg-blue-600')
    expect(button.classes()).toContain('text-white')
  })

  it('renders with secondary variant', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'secondary' },
      slots: { default: 'Cancel' }
    })
    const button = wrapper.find('button')
    expect(button.classes()).toContain('bg-gray-800')
  })

  it('renders with ghost variant', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'ghost' },
      slots: { default: 'Ghost' }
    })
    const button = wrapper.find('button')
    expect(button.classes()).toContain('bg-transparent')
  })

  it('renders with danger variant', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'danger' },
      slots: { default: 'Delete' }
    })
    const button = wrapper.find('button')
    expect(button.classes()).toContain('bg-red-600')
  })

  it('shows spinner when loading', () => {
    const wrapper = mount(BaseButton, {
      props: { loading: true },
      slots: { default: 'Loading' }
    })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('applies sm size classes', () => {
    const wrapper = mount(BaseButton, {
      props: { size: 'sm' },
      slots: { default: 'Small' }
    })
    const button = wrapper.find('button')
    expect(button.classes()).toContain('px-3')
    expect(button.classes()).toContain('py-1.5')
  })

  it('applies lg size classes', () => {
    const wrapper = mount(BaseButton, {
      props: { size: 'lg' },
      slots: { default: 'Large' }
    })
    const button = wrapper.find('button')
    expect(button.classes()).toContain('px-6')
    expect(button.classes()).toContain('py-3')
  })

  it('does not emit click while loading', async () => {
    const wrapper = mount(BaseButton, {
      props: { loading: true },
      slots: { default: 'Saving' }
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })
})
