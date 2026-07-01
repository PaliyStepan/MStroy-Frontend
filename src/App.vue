<template>
  <div class="container">
    <div class="buttons">
      <VButton
          v-for="button in buttons"
          :key="button.label"
          size="sm"
          :color="button.color || 'blue'"
          :disabled="button.disabled"
          @click="button.action"
      >
        {{ button.label }}
      </VButton>

      <span v-if="selectedCount" class="buttons__total">Выбрано: {{ selectedCount }}</span>
    </div>

    <TreeTable ref="treeTableRef" :items="treeItems"/>

    <ModalBase
        v-model="showModal"
        :title="modalTitle"
        :description="modalDescription"
        :confirm-text="modalConfirmText"
        :confirm-button-color="modalConfirmColor"
        :confirm-disabled="modalConfirmDisabled"
        @confirm="handleModalConfirm"
    >
      <template #content>
        <input
            v-if="modalType === 'add' || modalType === 'edit'"
            v-model="modalInputValue"
            type="text"
            class="input"
            :placeholder="modalPlaceholder"
            @keyup.enter="handleModalConfirm"
        />
      </template>
    </ModalBase>
  </div>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue'
import {TreeTable, VButton, ModalBase} from '@/components/index.ts'
import type {IButtonConfig, ITreeItem} from '@/types/common.ts'

const treeItems: ITreeItem[] = [
  {id: 1, parent: null, label: 'Айтем 1'},
  {id: '91064cee', parent: 1, label: 'Айтем 2'},
  {id: 3, parent: 1, label: 'Айтем 3'},
  {id: 4, parent: '91064cee', label: 'Айтем 4'},
  {id: 5, parent: '91064cee', label: 'Айтем 5'},
  {id: 6, parent: '91064cee', label: 'Айтем 6'},
  {id: 7, parent: 4, label: 'Айтем 7'},
  {id: 8, parent: 4, label: 'Айтем 8'},
]

const treeTableRef = ref<InstanceType<typeof TreeTable>>()

const selectedCount = computed(() => {
  const ids = treeTableRef.value?.getSelectedIds()
  return ids ? ids.length : 0
})

const showModal = ref(false)
const modalType = ref<'add' | 'edit' | 'delete'>('add')
const modalInputValue = ref('')

const firstSelectedId = computed(() => {
  const ids = treeTableRef.value?.getSelectedIds()
  return ids?.[0] || null
})

const modalTitle = computed(() => {
  if (modalType.value === 'add') return 'Добавить элемент'
  if (modalType.value === 'edit') return 'Редактировать элемент'
  return 'Удаление'
})

const modalDescription = computed(() => {
  if (modalType.value === 'add') {
    const id = firstSelectedId.value
    if (!id) return 'Новый элемент будет добавлен в корень дерева'
    const parentItem = treeTableRef.value?.getStore()?.getItem(id)
    return parentItem ? `Новый элемент будет добавлен как дочерний для "${parentItem.label}"` : 'Новый элемент будет добавлен в корень дерева'
  }

  if (modalType.value === 'edit') {
    const id = firstSelectedId.value
    if (!id) return ''
    const item = treeTableRef.value?.getStore()?.getItem(id)
    return item ? `Редактирование элемента "${item.label}"` : ''
  }

  const count = selectedCount.value
  if (!count) return ''
  let items = ''
  if (count === 1) items = 'элемент'
  else if (count >= 2 && count <= 4) items = 'элемента'
  else items = 'элементов'
  return `Вы уверены, что хотите удалить ${count} ${items} и все дочерние элементы?`
})

const modalConfirmText = computed(() => {
  if (modalType.value === 'add') return 'Добавить'
  if (modalType.value === 'edit') return 'Сохранить'
  return 'Удалить'
})

const modalConfirmColor = computed(() => {
  if (modalType.value === 'delete') return 'red'
  return 'blue'
})

const modalConfirmDisabled = computed(() => {
  if (modalType.value === 'add') return !modalInputValue.value
  if (modalType.value === 'edit') return !modalInputValue.value
  return false
})

const modalPlaceholder = computed(() => {
  if (modalType.value === 'add') return 'Введите название'
  if (modalType.value === 'edit') return 'Введите новое название'
  return ''
})

const buttons = computed<IButtonConfig[]>(() => [
  {
    label: 'Добавить',
    disabled: false,
    action: () => {
      modalType.value = 'add'
      modalInputValue.value = ''
      showModal.value = true
    }
  },
  {
    label: 'Удалить',
    color: 'red',
    disabled: !selectedCount.value,
    action: () => {
      if (!selectedCount.value) return
      modalType.value = 'delete'
      showModal.value = true
    }
  },
  {
    label: 'Редактировать',
    color: 'gray',
    disabled: selectedCount.value !== 1,
    action: () => {
      if (selectedCount.value !== 1) return

      const id = firstSelectedId.value
      if (!id) return

      const item = treeTableRef.value?.getStore()?.getItem(id)
      if (!item) return

      modalType.value = 'edit'
      modalInputValue.value = item.label
      showModal.value = true
    }
  },
  {
    label: 'Сбросить',
    color: 'orange',
    disabled: !selectedCount.value,
    action: () => {
      treeTableRef.value?.deselectAll()
    }
  }
])

const handleModalConfirm = () => {
  if (modalType.value === 'add') {
    const name = modalInputValue.value.trim()
    if (!name) return
    treeTableRef.value?.addNewItem(name)
  } else if (modalType.value === 'edit') {
    const name = modalInputValue.value.trim()
    if (!name) return
    treeTableRef.value?.editSelectedItem(name)
  } else if (modalType.value === 'delete') {
    treeTableRef.value?.removeSelectedItems()
  }

  showModal.value = false
  modalInputValue.value = ''
}
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 40px;

  &__total {
    font-size: 16px;
  }
}

.input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  margin-bottom: 16px;
}
</style>
