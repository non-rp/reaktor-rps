import { Link } from '@mui/material'

type UserProfileLinkProps = {
  id: number
  name: string
  onNavigate: (path: string) => void
}

export function UserProfileLink({ id, name, onNavigate }: UserProfileLinkProps) {
  const href = `/users/${id}`

  return (
    <Link
      href={href}
      onClick={(event) => {
        event.preventDefault()
        onNavigate(href)
      }}
      underline="hover"
    >
      {name}
    </Link>
  )
}
