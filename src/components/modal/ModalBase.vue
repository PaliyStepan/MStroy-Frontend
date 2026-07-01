<template>
  <VueFinalModal
      class="modal"
      content-class="modal-content"
      overlay-class="modal-overlay"
      v-model="model"
  >
    <div class="modal__inner">
      <button type="button" class="modal__close" @click="closeModal">
        <img :src="closeIcon" alt="Закрыть"/>
      </button>

      <div class="modal__title">{{ title }}</div>

      <div v-if="description" class="modal__text">{{ description }}</div>

      <slot name="content"/>

      <div class="modal__actions">
        <VButton color="gray" @click="closeModal" class="modal__button">
          {{ cancelText || 'Отмена' }}
        </VButton>

        <VButton
            :color="confirmButtonColor || 'blue'"
            @click="handleConfirm"
            :disabled="confirmDisabled"
            class="modal__button"
        >
          {{ confirmText || 'ОК' }}
        </VButton>
      </div>
    </div>
  </VueFinalModal>
</template>

<script setup lang="ts">
import {VueFinalModal} from 'vue-final-modal'
import {VButton} from '@/components'
import closeIcon from '@/assets/images/close.svg'

const model = defineModel<boolean>({default: false})

defineProps<{
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  confirmButtonColor?: 'blue' | 'red' | 'gray' | 'orange'
  confirmDisabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
}>()

const closeModal = () => {
  model.value = false
}

const handleConfirm = () => {
  emit('confirm')
  closeModal()
}
</script>

<style scoped lang="scss">
.modal {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  :global(.modal-content) {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100%;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  &__inner {
    position: relative;
    width: 100%;
    background-color: $color-white;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  &__close {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    cursor: pointer;
    z-index: 1;
    transition: opacity $default-transition;

    &:hover {
      opacity: 0.5;
    }
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    color: $color-black;
    margin-bottom: 16px;
  }

  &__text {
    font-size: 14px;
    color: $color-gray;
    margin-bottom: 16px;
  }

  &__actions {
    width: 100%;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 20px;
  }

  &__button {
    flex: 1 0 0;
  }
}
</style>
