import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { SidebarContext } from './SidebarContext';

const STORAGE_KEY = 'tacticl-sidebar-collapsed';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Toolbar />
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </SidebarContext.Provider>
  );
}
