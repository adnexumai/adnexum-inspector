import { create } from "zustand";

interface UIState {
    sidebarCollapsed: boolean;
    commandOpen: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setCommandOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarCollapsed: false,
    commandOpen: false,
    toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    setCommandOpen: (open) => set({ commandOpen: open }),
}));
