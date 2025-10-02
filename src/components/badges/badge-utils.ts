import { Role, AccountStatus } from '@prisma/client'

export function getRoleBadgeColor(role: Role) {
  const colors = {
    ADMIN: 'bg-red-100 text-red-800',
    MODERATOR: 'bg-purple-100 text-purple-800',
    DEVELOPER: 'bg-blue-100 text-blue-800',
    USER: 'bg-gray-100 text-gray-800'
  }
  return colors[role] || colors.USER
}

export function getStatusBadgeColor(status: AccountStatus) {
  const colors = {
    BANNED: 'bg-red-100 text-red-800',
    SUSPENDED: 'bg-yellow-100 text-yellow-800',
    ACTIVE: ''
  }
  return colors[status] || ''
}