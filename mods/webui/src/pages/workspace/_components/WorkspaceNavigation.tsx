import Link from 'next/link'
import { useRouter } from 'next/router'

interface WorkspaceNavigationProps {
  workspaceId: string
}

export default function WorkspaceNavigation({ workspaceId }: WorkspaceNavigationProps) {
  const router = useRouter()
  const currentPath = router.pathname

  const navigation = [
    { name: 'Overview', href: `/workspaces/${workspaceId}/overview` },
    { name: 'Applications', href: `/workspaces/${workspaceId}/applications` },
    { name: 'SIP Network', href: `/workspaces/${workspaceId}/sip-network` },
    { name: 'Storage', href: `/workspaces/${workspaceId}/storage` },
    { name: 'Secrets', href: `/workspaces/${workspaceId}/secrets` },
    { name: 'API Keys', href: `/workspaces/${workspaceId}/api-keys` },
    { name: 'Monitoring', href: `/workspaces/${workspaceId}/monitoring` },
  ]

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = currentPath === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              block px-4 py-2 rounded-md
              ${isActive 
                ? 'bg-gray-200 text-gray-900' 
                : 'text-gray-600 hover:bg-gray-50'}
            `}
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
} 