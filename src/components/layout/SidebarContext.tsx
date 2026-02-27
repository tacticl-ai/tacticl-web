import { createContext, useContext } from 'react';

interface SidebarContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

export const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggleCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);
