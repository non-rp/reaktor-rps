import { AppBar, Button, Stack, Toolbar, Typography } from '@mui/material'
import { routes, type StaticRouteKey } from '../../routing'

type HeaderProps = {
  activeStaticKey: StaticRouteKey | null
  onNavigate: (path: string) => void
}

export default function Header({ activeStaticKey, onNavigate }: HeaderProps) {
  return (
    <AppBar position="sticky">
      <Toolbar sx={{ gap: 2, alignItems: 'center', py: 1 }}>
        <Typography variant="h6" sx={{ flexShrink: 0 }}>
          RPS Stats
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {(Object.keys(routes) as StaticRouteKey[]).map((key) => (
            <Button
              key={key}
              color="inherit"
              variant={activeStaticKey === key ? 'outlined' : 'text'}
              onClick={() => onNavigate(routes[key].path)}
              sx={{
                borderColor: 'rgba(255,255,255,0.7)',
              }}
            >
              {routes[key].label}
            </Button>
          ))}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
