import type { ITreeItem } from '@/types/common'

export class TreeStore {
  private items: ITreeItem[]
  private itemsMap: Map<string | number, ITreeItem>
  private childrenMap: Map<string | number, (string | number)[]>

  constructor(items: ITreeItem[]) {
    this.items = [...items]
    this.itemsMap = new Map()
    this.childrenMap = new Map()
    this.buildMaps()
  }

  private buildMaps(): void {
    this.itemsMap.clear()
    this.childrenMap.clear()

    for (const item of this.items) {
      this.itemsMap.set(item.id, item)
    }

    for (const item of this.items) {
      if (item.parent !== null && item.parent !== undefined) {
        if (!this.childrenMap.has(item.parent)) {
          this.childrenMap.set(item.parent, [])
        }
        this.childrenMap.get(item.parent)!.push(item.id)
      }
    }
  }

  getAll(): ITreeItem[] {
    return this.items
  }

  getItem(id: string | number): ITreeItem | undefined {
    return this.itemsMap.get(id)
  }

  getChildren(id: string | number): ITreeItem[] {
    const childIds = this.childrenMap.get(id)
    if (!childIds) return []
    return childIds
      .map((childId) => this.itemsMap.get(childId))
      .filter((item): item is ITreeItem => item !== undefined)
  }

  getAllChildren(id: string | number): ITreeItem[] {
    const traverse = (nodeId: string | number): ITreeItem[] => {
      const children = this.childrenMap.get(nodeId) || []
      return children.reduce<ITreeItem[]>((acc, childId) => {
        const child = this.itemsMap.get(childId)
        if (child) {
          acc.push(child, ...traverse(childId))
        }
        return acc
      }, [])
    }

    return traverse(id)
  }

  getAllParents(id: string | number): ITreeItem[] {
    const result: ITreeItem[] = []
    let currentId: string | number | null = id

    while (currentId !== null && currentId !== undefined) {
      const item = this.itemsMap.get(currentId)
      if (!item) break
      result.push(item)
      currentId = item.parent
    }

    return result
  }

  addItem(item: ITreeItem): void {
    if (this.itemsMap.has(item.id)) return

    const parentId = item.parent
    if (parentId && !this.itemsMap.has(parentId)) return

    this.items.push(item)
    this.itemsMap.set(item.id, item)

    if (parentId) {
      const children = this.childrenMap.get(parentId)
      if (children) {
        children.push(item.id)
      } else {
        this.childrenMap.set(parentId, [item.id])
      }
    }
  }

  removeItem(id: string | number): void {
    const item = this.itemsMap.get(id)
    if (!item) return

    const descendants = this.getAllChildren(id)
    const idsToRemove = new Set([id, ...descendants.map((d) => d.id)])

    this.items = this.items.filter((item) => !idsToRemove.has(item.id))

    idsToRemove.forEach((idToRemove) => {
      this.itemsMap.delete(idToRemove)
      this.childrenMap.delete(idToRemove)
    })

    this.childrenMap.forEach((childIds, parentId) => {
      const filtered = childIds.filter((childId) => !idsToRemove.has(childId))
      if (filtered.length) {
        this.childrenMap.set(parentId, filtered)
      } else {
        this.childrenMap.delete(parentId)
      }
    })
  }

  updateItem(updatedItem: ITreeItem): void {
    const existingItem = this.itemsMap.get(updatedItem.id)
    if (!existingItem) return

    if (updatedItem.parent !== null && updatedItem.parent !== undefined) {
      if (updatedItem.parent !== existingItem.parent) {
        if (this.isCircular(updatedItem.id, updatedItem.parent)) return
        if (!this.itemsMap.has(updatedItem.parent)) return
      }
    }

    const index = this.items.findIndex((item) => item.id === updatedItem.id)
    if (index !== -1) {
      this.items[index] = { ...updatedItem }
    }

    this.itemsMap.set(updatedItem.id, { ...updatedItem })
    this.buildMaps()
  }

  private isCircular(itemId: string | number, newParentId: string | number): boolean {
    const parent = this.itemsMap.get(newParentId)
    if (!parent) return false
    if (parent.id === itemId) return true
    if (parent.parent === null) return false
    return this.isCircular(itemId, parent.parent)
  }
}
