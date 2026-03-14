import { Link } from '@mui/material'

type UserProfileLinkProps = {
  id: number | null
  name: string
  onNavigate: (path: string) => void
}

export function UserProfileLink({ id, name, onNavigate }: UserProfileLinkProps) {
  if (id === null) {
    return <>{name}</>
  }

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
