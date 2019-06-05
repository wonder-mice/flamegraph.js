import {State} from './State'
import {StateUpdater} from './StateUpdater'

export class NodeView {
  constructor (causalDomain) {
    this.state = new State('NodeView::State')
    this.causalDomain = causalDomain || this.state

    const element = this.element = document.createElement('div')
    element.style.position = 'relative'
    element.style.overflow = 'hidden'

    this.layoutWidth = 0
    this.layoutWidthState = new State('StructureView::LayoutWidth', (state) => { this.updateLayoutWidth(state) })
    const stateUpdater = StateUpdater.updater(this.causalDomain)
    const layoutWidthChanged = (width) => {
      if (width !== this.layoutWidth) {
        this.layoutWidthState.invalidate()
        stateUpdater.update(1000, 100)
      }
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => { layoutWidthChanged(entries[0].contentRect.width) })
      this.resizeObserver.observe(this.element)
    } else {
      window.addEventListener('resize', () => { layoutWidthChanged(this.element.getBoundingClientRect().width) })
    }
  }
  setResized () {
    this.layoutWidthState.invalidate()
  }
  updateLayoutWidth (state) {
    const width = this.element.getBoundingClientRect().width
    if (this.layoutWidth !== width) {
      this.layoutWidth = width
    } else {
      state.cancel()
    }
  }
}