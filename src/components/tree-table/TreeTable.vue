<template>
  <div class="tree-table">
    <ag-grid-vue
      v-show="isGridReady"
      ref="agGrid"
      class="ag-theme-alpine"
      theme="legacy"
      :column-defs="columnDefs"
      :row-data="rowData"
      :default-col-def="defaultColDef"
      :tree-data="true"
      :get-data-path="getDataPath"
      :auto-group-column-def="autoGroupColumnDef"
      :group-default-expanded="-1"
      :row-selection="'multiple'"
      :row-multi-select-with-click="true"
      :suppress-row-click-selection="false"
      @grid-ready="onGridReady"
      @selection-changed="onSelectionChanged"
      style="height: 500px; width: 100%"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import type {
  AutoGroupColumnDef,
  CellClassParams,
  ColDef,
  GridApi,
  GridReadyEvent,
  IRowNode,
  SelectionChangedEvent,
  ValueGetterParams,
} from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import type { ITreeItem } from '@/types/common'
import { TreeStore } from '@/models/TreeStore'

const props = defineProps<{
  items: ITreeItem[]
}>()

const treeStore = reactive(new TreeStore(props.items))
const selectedIds = ref<(string | number)[]>([])
const gridApi = ref<GridApi | null>(null)
const isGridReady = ref(false)
const rowNumberMap = ref<Map<string | number, number>>(new Map())

watch(
  () => props.items,
  (newItems) => {
    const newStore = new TreeStore(newItems)
    Object.assign(treeStore, newStore)
    updateRowData()
    nextTick(() => {
      if (gridApi.value) {
        gridApi.value.expandAll()
        gridApi.value.refreshCells()
      }
    })
  },
  { deep: true },
)

const getItemsInOrder = (): ITreeItem[] => {
  const result: ITreeItem[] = []

  const allItems = treeStore.getAll()
  const rootItems = allItems.filter((item) => item.parent === null || item.parent === undefined)

  const traverse = (itemId: string | number) => {
    const item = treeStore.getItem(itemId)
    if (!item) return

    result.push(item)

    const children = treeStore.getChildren(itemId)
    for (const child of children) {
      traverse(child.id)
    }
  }

  rootItems.sort((a, b) => String(a.id).localeCompare(String(b.id)))

  for (const root of rootItems) {
    traverse(root.id)
  }

  return result
}

const columnDefs: ColDef<ITreeItem>[] = [
  {
    colId: 'rowNumber',
    width: 80,
    headerName: '№ п/п',
    resizable: false,
    valueGetter: (params: ValueGetterParams<ITreeItem>) => {
      if (!params.data) return ''
      const id = params.data.id
      return rowNumberMap.value.get(id) ?? ''
    },
  },
  {
    field: 'label',
    headerName: 'Наименование',
    resizable: false,
    flex: 2,
    cellClassRules: {
      'font-medium': (params: CellClassParams<ITreeItem>) => {
        if (!params.data) return false
        const data = params.data
        const children = treeStore.getChildren(data.id)
        return children && children.length > 0
      },
    },
  },
]

const defaultColDef: ColDef<ITreeItem> = {
  sortable: false,
  filter: false,
  menuTabs: [],
  suppressHeaderMenuButton: true,
}

const autoGroupColumnDef: AutoGroupColumnDef<ITreeItem> = {
  headerName: 'Категория',
  width: 300,
  menuTabs: [],
  suppressHeaderMenuButton: true,
  resizable: false,
  cellRenderer: 'agGroupCellRenderer',
  cellRendererParams: {
    suppressCount: true,
  },
  cellClassRules: {
    'font-medium': (params: CellClassParams<ITreeItem>) => {
      if (!params.data) return false
      const data = params.data
      const children = treeStore.getChildren(data.id)
      return children && children.length > 0
    },
  },
  valueGetter: (params: ValueGetterParams<ITreeItem>) => {
    if (!params.data) return ''
    const data = params.data
    const children = treeStore.getChildren(data.id)
    return children && children.length > 0 ? 'Группа' : 'Элемент'
  },
}

const getDataPath = (data: ITreeItem): string[] => {
  if (!data) return []

  const path: string[] = []
  const currentId = data.id
  const parents = treeStore.getAllParents(currentId)

  const reversedParents = [...parents].reverse()

  for (const parent of reversedParents) {
    path.push(parent.label)
  }

  return path
}

const rowData = ref<ITreeItem[]>([])

const updateRowData = () => {
  rowData.value = getItemsInOrder()
}

const updateRowNumbers = () => {
  const newMap = new Map<string | number, number>()

  if (gridApi.value) {
    let index = 1
    gridApi.value.forEachNodeAfterFilterAndSort((node) => {
      if (node.data?.id !== undefined) {
        newMap.set(node.data.id, index++)
      }
    })
  }

  rowNumberMap.value = newMap
}

watch(
  () => treeStore.getAll(),
  () => {
    updateRowData()
    nextTick(() => {
      if (gridApi.value) {
        gridApi.value.expandAll()
        gridApi.value.refreshCells()
        updateRowNumbers()
        gridApi.value.refreshCells({ columns: ['rowNumber'] })
      }
    })
  },
  { deep: true },
)

updateRowData()

const onSelectionChanged = (params: SelectionChangedEvent<ITreeItem>) => {
  const selectedNodes = params.api.getSelectedNodes()
  selectedIds.value = selectedNodes
    .map((node: IRowNode<ITreeItem>) => node.data?.id)
    .filter((id): id is string | number => id !== undefined)
}

const refreshRowNumbers = () => {
  updateRowNumbers()
  if (gridApi.value) {
    gridApi.value.refreshCells({ columns: ['rowNumber'] })
  }
}

const onGridReady = (params: GridReadyEvent<ITreeItem>) => {
  gridApi.value = params.api

  if (rowData.value.length === 0) {
    isGridReady.value = true
    return
  }

  const allColumns = params.api.getAllGridColumns()
  const categoryCol = allColumns.find((col) => col.getColDef().headerName === 'Категория')

  if (categoryCol) {
    params.api.moveColumns([categoryCol.getColId()], 1)
    isGridReady.value = true

    nextTick(() => {
      params.api.expandAll()
      params.api.refreshCells()
      updateRowNumbers()
      params.api.refreshCells({ columns: ['rowNumber'] })
    })
  } else {
    isGridReady.value = true
  }

  params.api.addEventListener('modelUpdated', refreshRowNumbers)
  params.api.addEventListener('sortChanged', refreshRowNumbers)
  params.api.addEventListener('filterChanged', refreshRowNumbers)
}

const addNewItem = (label: string) => {
  const parentId: string | number | null =
    selectedIds.value.length > 0 ? (selectedIds.value[0] ?? null) : null

  const newId = Date.now().toString(36)
  const newItem: ITreeItem = {
    id: newId,
    parent: parentId,
    label: label,
  }

  treeStore.addItem(newItem)
  updateRowData()
  if (gridApi.value) {
    gridApi.value.deselectAll()
    selectedIds.value = []
  }
  nextTick(() => {
    if (gridApi.value) {
      gridApi.value.expandAll()
      gridApi.value.refreshCells()
      updateRowNumbers()
      gridApi.value.refreshCells({ columns: ['rowNumber'] })
    }
  })
}

const removeSelectedItems = () => {
  if (selectedIds.value.length === 0) return

  const idsToRemove = [...selectedIds.value]
  for (const id of idsToRemove) {
    treeStore.removeItem(id)
  }
  selectedIds.value = []
  updateRowData()

  const api = gridApi.value
  if (api) {
    api.deselectAll()
    nextTick(() => {
      updateRowNumbers()
      api.refreshCells({ columns: ['rowNumber'] })
    })
  }
}

const editSelectedItem = (label: string) => {
  if (selectedIds.value.length !== 1) return

  const id = selectedIds.value[0]
  if (id === undefined) return

  const item = treeStore.getItem(id)
  if (!item) return

  const updatedItem = { ...item, label: label }
  treeStore.updateItem(updatedItem)
  updateRowData()
  if (gridApi.value) {
    gridApi.value.deselectAll()
    selectedIds.value = []
  }
}

defineExpose({
  addNewItem,
  removeSelectedItems,
  editSelectedItem,
  getSelectedIds: () => selectedIds.value,
  getStore: () => treeStore,
  getGridApi: () => gridApi.value,
  refresh: updateRowData,
  deselectAll: () => {
    if (gridApi.value) {
      gridApi.value.deselectAll()
      selectedIds.value = []
    }
  },
})
</script>

<style scoped lang="scss">
.tree-table {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-top: 20px;
  padding-bottom: 20px;
}

:deep(.ag-root-wrapper) {
  border: none;
}

:deep(.ag-header-cell-menu-button) {
  display: none !important;
}

:deep(.ag-header-cell) {
  --ag-header-menu-button-display: none;
}

:deep(.ag-header-cell-text),
:deep(.font-medium) {
  font-weight: 600;
}

:deep(.ag-grid-scrolling-cells),
:deep(.ag-header-row) {
  background-color: $color-white;

  &:after {
    display: none !important;
    background-color: $color-white;
  }
}

:deep(.ag-header-cell) {
  border-right: 1px solid #babfc7;
}

:deep(.ag-cell) {
  border: none !important;
}
</style>
