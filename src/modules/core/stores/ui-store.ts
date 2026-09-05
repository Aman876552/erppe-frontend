import { create } from "zustand"

interface UiStore {
  isSidebarCollapsed: boolean
  isMobileMenuOpen: boolean
  activeNotificationsCount: number
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
  setNotificationsCount: (count: number) => void
}

export const useUiStore = create<UiStore>((set) => ({
  isSidebarCollapsed: false,
  isMobileMenuOpen: false,
  activeNotificationsCount: 4,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  setNotificationsCount: (count) => set({ activeNotificationsCount: count }),
}))
