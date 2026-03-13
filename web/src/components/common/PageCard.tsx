import type { ReactNode } from 'react'
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material'

type PageCardProps = {
  title: string
  children: ReactNode
}

export function PageCard({ title, children }: PageCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">{title}</Typography>
          <Divider />
          {children}
        </Stack>
      </CardContent>
    </Card>
  )
}
