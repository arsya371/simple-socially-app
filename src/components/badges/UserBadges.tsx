'use client'

import { CheckCircle } from 'lucide-react'
import { Role, AccountStatus } from '@prisma/client'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

const formatEnumValue = (value: string) => {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

const getRoleBadgeColor = (role: Role) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800'
    case 'MODERATOR':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusBadgeColor = (status: AccountStatus) => {
  switch (status) {
    case 'SUSPENDED':
      return 'bg-red-100 text-red-800'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

interface UserBadgesProps {
  role: Role
  status: AccountStatus
  isVerified?: boolean
}

export function UserBadges({ role, status, isVerified }: UserBadgesProps) {
  const formattedRole = formatEnumValue(role)
  const formattedStatus = formatEnumValue(status)

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        {isVerified && (
          <Tooltip>
            <TooltipTrigger asChild>
              <CheckCircle className="w-4 h-4 text-blue-500 fill-current" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Verified Account</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(role)}`}>
              {formattedRole}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Role: {formattedRole}</p>
          </TooltipContent>
        </Tooltip>

        {status !== 'ACTIVE' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeColor(status)}`}>
                {formattedStatus}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Account {formattedStatus}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}