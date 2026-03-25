import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4ade80',
      light: '#86efac',
      dark: '#2d7a4d',
    },
    secondary: {
      main: '#818cf8',
      light: '#a5b4fc',
      dark: '#6366f1',
    },
    background: {
      default: '#0d0d15',
      paper: '#1a1a2e',
    },
    success: {
      main: '#4ade80',
    },
    warning: {
      main: '#f59e0b',
    },
    error: {
      main: '#f87171',
    },
    info: {
      main: '#38bdf8',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#999999',
    },
    divider: 'rgba(255,255,255,0.06)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, color: '#999999' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0d0d15',
          scrollbarColor: '#333 #0d0d15',
          '&::-webkit-scrollbar': { width: 8 },
          '&::-webkit-scrollbar-track': { background: '#0d0d15' },
          '&::-webkit-scrollbar-thumb': { background: '#333', borderRadius: 4 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#12121e',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        },
        head: {
          fontWeight: 600,
          color: '#999999',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
