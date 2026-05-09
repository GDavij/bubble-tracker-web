<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const ui = useUiStore()

interface NavItem {
  id: string
  label: string
  icon: string
  route: string
  badge?: string | number
  children?: Array<{ id: string; label: string; route: string }>
}

const navItems = computed<NavItem[]>(() => [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', route: '/dashboard' },
  { id: 'graph', label: 'Social Graph', icon: 'share', route: '/graph' },
  { id: 'people', label: 'People', icon: 'users', route: '/people' },
  { id: 'relationships', label: 'Relationships', icon: 'link', route: '/relationships' },
  { id: 'analyze', label: 'Analyze', icon: 'search', route: '/analyze' },
  { id: 'chat', label: 'Chat', icon: 'message', route: '/chat' },
  { id: 'timeline', label: 'Timeline', icon: 'clock', route: '/timeline' },
  { id: 'memories', label: 'Memories', icon: 'bookmark', route: '/memories' },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'chart',
    route: '/analytics',
    children: [
      { id: 'roles', label: 'Roles', route: '/analytics/roles' },
      { id: 'profiles', label: 'Profiles', route: '/analytics/profiles' },
      { id: 'snapshot', label: 'Snapshot', route: '/analytics/snapshot' },
    ],
  },
])

function isNavActive(item: NavItem): boolean {
  if (route.path === item.route) return true
  if (item.children) {
    return item.children.some((child) => route.path.startsWith(child.route))
  }
  return false
}

function iconPath(icon: string): string {
  const icons: Record<string, string> = {
    grid: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z',
    share:
      'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z',
    users:
      'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
    search:
      'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    message:
      'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
    clock:
      'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
    bookmark:
      'M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z',
    chart: 'M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z',
    settings:
      'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
    collapse: 'M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z',
    expand: 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z',
    user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  }
  return (icons[icon] ?? icons.grid)!
}
</script>

<template>
  <aside
    :class="[
      'fixed top-0 left-0 z-50 h-full bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300',
      !ui.sidebarExpanded ? 'w-16' : 'w-60',
      ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <!-- Logo / Brand -->
    <RouterLink
      to="/dashboard"
      class="flex items-center gap-3 px-4 h-16 border-b border-gray-800 flex-shrink-0 hover:bg-gray-800/50 transition-colors"
      @click="ui.setSidebarOpen(false)"
    >
      <span class="text-2xl flex-shrink-0">◉</span>
      <span
        v-if="ui.sidebarExpanded"
        class="text-lg font-bold text-white whitespace-nowrap"
      >
        BubbleTracker
      </span>
    </RouterLink>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-2">
      <ul class="space-y-0.5 px-2">
        <li v-for="item in navItems" :key="item.id">
          <RouterLink
            :to="item.route"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group',
              isNavActive(item)
                ? 'bg-blue-600/15 text-blue-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200',
            ]"
            @click="ui.setSidebarOpen(false)"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path :d="iconPath(item.icon)" />
            </svg>
            <span
        v-if="ui.sidebarExpanded"
              class="text-sm font-medium whitespace-nowrap"
            >
              {{ item.label }}
            </span>
          </RouterLink>

          <!-- Children (Analytics sub-items) -->
          <ul v-if="item.children && ui.sidebarExpanded" class="mt-0.5 ml-8 space-y-0.5">
            <li v-for="child in item.children" :key="child.id">
              <RouterLink
                :to="child.route"
                :class="[
                  'flex items-center px-3 py-2 rounded-lg text-sm transition-colors',
                  route.path === child.route
                    ? 'text-blue-400'
                    : 'text-gray-500 hover:text-gray-300',
                ]"
      @click="ui.setSidebarOpen(false)"
              >
                {{ child.label }}
              </RouterLink>
            </li>
          </ul>
        </li>
      </ul>
    </nav>

    <!-- Bottom section -->
    <div class="border-t border-gray-800 p-2 flex-shrink-0">
      <!-- Settings -->
      <RouterLink
        to="/settings"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
        @click="ui.setSidebarOpen(false)"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path :d="iconPath('settings')" />
        </svg>
        <span v-if="ui.sidebarExpanded" class="text-sm font-medium whitespace-nowrap">
          Settings
        </span>
      </RouterLink>

      <!-- User -->
      <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg">
        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path :d="iconPath('user')" />
          </svg>
        </div>
        <div v-if="ui.sidebarExpanded" class="min-w-0 flex-1">
          <div class="text-sm font-medium text-gray-300 truncate">User</div>
        </div>
      </div>
    </div>

    <!-- Collapse toggle (desktop only) -->
    <button
      class="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-gray-800 border border-gray-700 items-center justify-center text-gray-400 hover:text-white transition-colors"
      @click="ui.toggleSidebar"
    >
      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path :d="!ui.sidebarExpanded ? iconPath('expand') : iconPath('collapse')" />
      </svg>
    </button>
  </aside>
</template>
