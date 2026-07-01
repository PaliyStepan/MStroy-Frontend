export interface ITreeItem {
  id: string | number
  parent: string | number | null
  label: string
}

export interface IButtonConfig {
  label: string
  color?: 'blue' | 'red' | 'gray' | 'orange'
  size?: 'sm' | 'md' | 'lg'
  disabled: boolean
  action: () => void
}
