<template>
  <Component
    :is="componentData.is"
    v-bind="componentData.bind"
    class="v-button"
    :class="classes"
    type="button"
    :title="title"
  >
    <span v-if="$slots.leftAddon" class="v-button__addon v-button__addon--left">
      <slot name="leftAddon" />
    </span>

    <span v-if="$slots.default" class="v-button__text">
      <slot />
    </span>

    <span v-if="$slots.rightAddon" class="v-button__addon v-button__addon--right">
      <slot name="rightAddon" />
    </span>
  </Component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

export interface VButtonProps {
  size?: 'md' | 'sm'
  to?: string | null
  target?: string | null
  block?: boolean
  disabled?: boolean
  active?: boolean
  color?: 'blue' | 'red' | 'gray' | 'orange'
  icon?: boolean
  iconLeft?: boolean
  outlined?: boolean
  exact?: boolean
  rounded?: boolean
  type?: 'filled' | 'underline'
  title?: string
}

const props = withDefaults(defineProps<VButtonProps>(), {
  to: null,
  target: '_self',
  block: false,
  rounded: false,
  disabled: false,
  active: false,
  color: 'blue',
  size: 'md',
  icon: false,
  outlined: false,
  type: 'filled',
})

defineSlots<{
  default(): unknown
  mobile(): unknown
  leftAddon(): unknown
  rightAddon(): unknown
}>()

const classes = computed(() => [
  `v-button--${props.size}`,
  `v-button--${props.color}`,
  `v-button--${props.type}`,
  {
    'is-disabled': props.disabled,
  },
])

const componentData = computed(() => {
  if (props.to) {
    return {
      is: RouterLink,
      bind: {
        to: props.to,
        target: props.target,
        exact: props.exact,
      },
    }
  }
  return {
    is: 'button',
    bind: {},
  }
})
</script>

<style scoped lang="scss">
.v-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: $color-white;
  cursor: pointer;
  font-weight: 400;
  outline: none;
  border-radius: 6px;
  box-shadow: none;
  transition:
    background-color $default-transition,
    color $default-transition,
    border $default-transition,
    opacity $default-transition;

  $block: &;

  &__text {
    display: inline-flex;
    user-select: none;
    white-space: nowrap;
  }

  // colors

  &--blue {
    background-color: $color-blue;

    &:hover {
      @media (hover: hover) {
        background-color: lighten($color-blue, 10%);
      }
    }
  }

  &--red {
    background-color: $color-red;

    &:hover {
      @media (hover: hover) {
        background-color: lighten($color-red, 10%);
      }
    }
  }

  &--gray {
    background-color: $color-gray;
    &:hover {
      @media (hover: hover) {
        background-color: lighten($color-gray, 10%);
      }
    }
  }

  &--orange {
    background-color: $color-orange;
    &:hover {
      @media (hover: hover) {
        background-color: lighten($color-orange, 10%);
      }
    }
  }

  //sizes

  &--sm {
    height: 32px;
    padding-right: 15px;
    padding-left: 15px;
    font-size: 14px;
    line-height: 100%;
  }

  &--md {
    height: 40px;
    padding-right: 15px;
    padding-left: 15px;
    font-size: 16px;
    line-height: 100%;
  }

  // states

  &.is-disabled {
    opacity: 0.3;
    pointer-events: none;
  }
}
</style>
