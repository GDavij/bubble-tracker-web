import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarExpanded = ref(true)
  const sidebarOpen = ref(true)
  const activeRoute = ref('dashboard')

  function toggleSidebar() {
    if (sidebarOpen.value) {
      sidebarExpanded.value = !sidebarExpanded.value
    } else {
      sidebarOpen.value = true
      sidebarExpanded.value = true
    }
  }

  function setSidebarOpen(open: boolean) {
    sidebarOpen.value = open
    if (open) {
      sidebarExpanded.value = true
    }
  }

  function setActiveRoute(route: string) {
    activeRoute.value = route
  }

  return {
    sidebarExpanded,
    sidebarOpen,
    activeRoute,
    toggleSidebar,
    setSidebarOpen,
    setActiveRoute,
  }
})
