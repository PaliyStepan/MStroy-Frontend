import { createApp } from 'vue'
import App from './App.vue'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import './assets/styles/global.scss'

import { ModuleRegistry } from 'ag-grid-community'
import {
  AllCommunityModule,
  ClientSideRowModelApiModule,
  ValidationModule,
} from 'ag-grid-community'
import { AllEnterpriseModule } from 'ag-grid-enterprise'

ModuleRegistry.registerModules([
  AllCommunityModule,
  AllEnterpriseModule,
  ClientSideRowModelApiModule,
  ValidationModule,
])

import { AgGridVue } from 'ag-grid-vue3'

import { createVfm } from 'vue-final-modal'
import 'vue-final-modal/style.css'

const app = createApp(App)
const vfm = createVfm()

app.use(vfm)
app.component('AgGridVue', AgGridVue)
app.mount('#app')
