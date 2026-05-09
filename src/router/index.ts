import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    component: () => import('@/components/layout/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { title: 'Sign In', guest: true },
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: { title: 'Create Account', guest: true },
      },
      {
        path: '',
        redirect: '/auth/login',
      },
    ],
  },

  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: 'Dashboard', icon: '📊' },
      },
      {
        path: 'graph',
        name: 'graph',
        component: () => import('@/views/graph/SocialGraphView.vue'),
        meta: { title: 'Social Graph', icon: '🕸️' },
      },
      {
        path: 'people',
        name: 'people',
        component: () => import('@/views/people/PeopleListView.vue'),
        meta: { title: 'People', icon: '👥' },
      },
      {
        path: 'people/:id',
        name: 'person-detail',
        component: () => import('@/views/people/PersonDetailView.vue'),
        meta: { title: 'Person Detail' },
      },
      {
        path: 'relationships',
        name: 'relationships',
        component: () => import('@/views/relationships/RelationshipsListView.vue'),
        meta: { title: 'Relationships', icon: '🔗' },
      },
      {
        path: 'relationships/:id',
        name: 'relationship-health',
        component: () => import('@/views/relationships/RelationshipHealthView.vue'),
        meta: { title: 'Relationship Health' },
      },
      {
        path: 'analyze',
        name: 'analyze',
        component: () => import('@/views/analysis/AnalysisView.vue'),
        meta: { title: 'Analyze', icon: '✍️' },
      },
      {
        path: 'chat',
        name: 'chat',
        component: () => import('@/views/chat/ChatView.vue'),
        meta: { title: 'Chat', icon: '💬' },
      },
      {
        path: 'timeline',
        name: 'timeline',
        component: () => import('@/views/timeline/EmotionalTimelineView.vue'),
        meta: { title: 'Timeline', icon: '📈' },
      },
      {
        path: 'memories',
        name: 'memories',
        component: () => import('@/views/memories/MemoriesSearchView.vue'),
        meta: { title: 'Memories', icon: '🔍' },
      },
      {
        path: 'analytics',
        name: 'analytics',
        component: () => import('@/views/analytics/AnalyticsView.vue'),
        meta: { title: 'Analytics', icon: '📋' },
      },
      {
        path: 'analytics/roles',
        name: 'analytics-roles',
        component: () => import('@/views/analytics/RolesView.vue'),
        meta: { title: 'Role Classifications' },
      },
      {
        path: 'analytics/profiles',
        name: 'analytics-profiles',
        component: () => import('@/views/analytics/ProfilesView.vue'),
        meta: { title: 'Aggregated Profiles' },
      },
      {
        path: 'analytics/snapshot',
        name: 'analytics-snapshot',
        component: () => import('@/views/analytics/GraphSnapshotView.vue'),
        meta: { title: 'Graph Snapshot' },
      },
    ],
  },

  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.initializeAuth()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
