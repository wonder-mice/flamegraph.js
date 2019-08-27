import {NodeContext, nodeMaskFocus} from './Node'
import {nodeFlagFocused, nodeFlagDescendantFocused} from './NodeTreeRenderer'

// FIXME: Maybe merge it with NodeLayout
export class NodeLayoutResult {
  constructor () {
    this.nodes = null
    this.height = 0
    this.rowHeight = 0
    this.context = new NodeContext()
    this.revision = 0
  }
}

export class NodeLayout {
  constructor () {
    this.totalWidth = 0
    this.nodeWidthMin = 3
    this.rowHeight = 18
    this.hasDelta = false
  }
  layout (rootNode, focusNode, revision) {
    let node
    let totalHeight = 0
    const nodes = []
    const totalWidth = this.totalWidth
    const nodeWidthMin = this.nodeWidthMin
    const rowHeight = this.rowHeight
    const hasDelta = this.hasDelta
    const queue = []
    let maxDelta = 0
    const stemNodes = []
    focusNode = focusNode || rootNode
    node = focusNode
    do { stemNodes.push(node) } while ((node = node.parent))
    for (let i = stemNodes.length; i--;) {
      node = stemNodes[i]
      node.width = totalWidth
      node.x = 0
      node.y = totalHeight
      node.mark &= 0b0111
      node.flags = (node.flags & ~nodeMaskFocus) | (i ? nodeFlagDescendantFocused : nodeFlagFocused)
      node.rev = revision
      nodes.push(node)
      totalHeight += rowHeight
    }
    queue.push(focusNode)
    maxDelta = Math.abs(node.delta)

    // Layout branches.
    while ((node = queue.pop())) {
      const children = node.children
      if (!children) {
        continue
      }
      const n = children.length
      if (!n) {
        continue
      }
      const childrenY = node.y + rowHeight
      let subtotal = Math.abs(node.self)
      for (let i = n; i--;) {
        subtotal += Math.abs(children[i].total)
      }
      const ratio = 0 < subtotal ? node.width / subtotal : 0
      for (let i = 0, childX = node.x; i < n; ++i) {
        const child = children[i]
        const childWidth = Math.floor(Math.abs(child.total) * ratio)
        if (childWidth < nodeWidthMin) {
          if (child.mark & 0b0011) {
            node.mark |= 0b1000
          }
          continue
        }
        child.width = childWidth
        child.x = childX
        child.y = childrenY
        childX += childWidth
        queue.push(child)
        if (hasDelta) {
          const delta = Math.abs(child.delta)
          if (maxDelta < delta) {
            maxDelta = delta
          }
        }
        child.mark &= 0b0111
        child.flags &= ~nodeMaskFocus
        child.rev = revision
        nodes.push(child)
      }
      if (totalHeight < childrenY) {
        totalHeight = childrenY
      }
    }
    const result = new NodeLayoutResult()
    result.nodes = nodes
    result.height = totalHeight + rowHeight
    result.rowHeight = rowHeight
    result.context.hasDelta = hasDelta
    result.context.maxDelta = maxDelta
    result.revision = revision
    return result
  }
}
