import { createTheme } from '@mui/material/styles';

const commonTypography = {
  fontFamily: '"Rajdhani", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  h1: {
    fontWeight: 800,
    letterSpacing: '0.02em',
    textTransform: 'uppercase'
  },
  h2: {
    fontWeight: 700,
    letterSpacing: '0.02em',
    textTransform: 'uppercase'
  },
  h3: {
    fontWeight: 700,
    letterSpacing: '0.01em'
  },
  h4: {
    fontWeight: 700,
    letterSpacing: '0.01em'
  },
  h5: {
    fontWeight: 600
  },
  h6: {
    fontWeight: 600
  },
  button: {
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  }
};

const commonShape = {
  borderRadius: 10
};

// 1. DARK THEME (100% exact colors preserved as requested)
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#080a0f',
      paper: '#10141e',
      card: '#151b29',
      subtle: '#1b2234'
    },
    primary: {
      main: '#00f0ff',
      light: '#5ef5ff',
      dark: '#00b8c4',
      contrastText: '#040711'
    },
    secondary: {
      main: '#8b5cf6',
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#ffffff'
    },
    accent: {
      main: '#ec4899',
      yellow: '#eab308',
      emerald: '#10b981'
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#94a3b8',
      disabled: '#64748b'
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    action: {
      hover: 'rgba(0, 240, 255, 0.06)',
      selected: 'rgba(0, 240, 255, 0.12)'
    }
  },
  typography: commonTypography,
  shape: commonShape,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#080a0f',
          color: '#f3f4f6',
          scrollbarColor: '#242e44 transparent',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
            height: 8
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 4,
            backgroundColor: '#242e44'
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            backgroundColor: 'transparent'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          fontWeight: 700,
          transition: 'all 0.2s ease-in-out',
          boxShadow: 'none'
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00f0ff 0%, #00a8ff 100%)',
          color: '#040711',
          '&:hover': {
            background: 'linear-gradient(135deg, #5ef5ff 0%, #00f0ff 100%)',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
            transform: 'translateY(-1px)'
          }
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
            transform: 'translateY(-1px)'
          }
        },
        outlinedPrimary: {
          borderColor: 'rgba(0, 240, 255, 0.4)',
          '&:hover': {
            borderColor: '#00f0ff',
            backgroundColor: 'rgba(0, 240, 255, 0.08)',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#10141e',
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          transition: 'all 0.25s ease-in-out',
          '&:hover': {
            borderColor: 'rgba(0, 240, 255, 0.25)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: 'inherit'
        },
        h1: { color: '#ffffff' },
        h2: { color: '#ffffff' },
        h3: { color: '#ffffff' },
        h4: { color: '#ffffff' },
        h5: { color: '#ffffff' },
        h6: { color: '#ffffff' }
      }
    }
  }
});

// 2. LIGHT THEME (High-contrast, crisp esports aesthetic)
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
      card: '#f1f5f9',
      subtle: '#e2e8f0'
    },
    primary: {
      main: '#0284c7',
      light: '#38bdf8',
      dark: '#0369a1',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#7c3aed',
      light: '#8b5cf6',
      dark: '#6d28d9',
      contrastText: '#ffffff'
    },
    accent: {
      main: '#db2777',
      yellow: '#d97706',
      emerald: '#059669'
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      disabled: '#94a3b8'
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    action: {
      hover: 'rgba(2, 132, 199, 0.06)',
      selected: 'rgba(2, 132, 199, 0.12)'
    }
  },
  typography: commonTypography,
  shape: commonShape,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f8fafc',
          color: '#0f172a',
          scrollbarColor: '#cbd5e1 transparent',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
            height: 8
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 4,
            backgroundColor: '#cbd5e1'
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            backgroundColor: 'transparent'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          fontWeight: 700,
          transition: 'all 0.2s ease-in-out',
          boxShadow: 'none'
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
            boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',
            transform: 'translateY(-1px)'
          }
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)',
            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.35)',
            transform: 'translateY(-1px)'
          }
        },
        outlinedPrimary: {
          borderColor: '#0284c7',
          color: '#0284c7',
          '&:hover': {
            borderColor: '#0369a1',
            backgroundColor: 'rgba(2, 132, 199, 0.08)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          backgroundImage: 'none',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 12,
          transition: 'all 0.25s ease-in-out',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          '&:hover': {
            borderColor: 'rgba(2, 132, 199, 0.35)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: 'inherit'
        },
        h1: { color: '#0f172a' },
        h2: { color: '#0f172a' },
        h3: { color: '#0f172a' },
        h4: { color: '#0f172a' },
        h5: { color: '#0f172a' },
        h6: { color: '#0f172a' }
      }
    }
  }
});

// Backward compatibility
export const gamingTheme = darkTheme;

export const getGamingTheme = (mode = 'dark') => {
  return mode === 'light' ? lightTheme : darkTheme;
};
