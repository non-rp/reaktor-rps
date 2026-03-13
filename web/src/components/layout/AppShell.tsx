import type { ReactNode } from 'react'
import { Box, Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import type { StaticRouteKey } from '../../routing'
import Header from './Header'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#d81b60',
    },
    secondary: {
      main: '#880e4f',
    },
    background: {
      default: '#f8fafc',
    },
  },
  shape: {
    borderRadius: 8,
  },
})

type AppShellProps = {
  activeStaticKey: StaticRouteKey | null
  onNavigate: (path: string) => void
  children: ReactNode
}

export function AppShell({ activeStaticKey, onNavigate, children }: AppShellProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header onNavigate={onNavigate} activeStaticKey={activeStaticKey} />
      <Box py={3}>
        <Container maxWidth="lg">{children}</Container>
      </Box>
    </ThemeProvider>
  )
}
