import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#38bdf8', light: '#7dd3fc', dark: '#0284c7' },
    secondary: { main: '#22d3ee' },
    background: { default: '#07111f', paper: '#0d1b2d' },
    text: { primary: '#f8fafc', secondary: '#a7b7cc' },
    divider: 'rgba(125, 211, 252, 0.14)',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Segoe UI", "Trebuchet MS", system-ui, sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: 'none', backgroundColor: '#091525', borderBottom: '1px solid rgba(125,211,252,.14)' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: 'none', borderColor: 'rgba(125,211,252,.14)' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
