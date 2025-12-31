// app/fraternities/[id]/members/page.js
// Member management page for fraternity

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  getMembersAction,
  checkIsAdminAction,
  addMemberAction,
  removeMemberAction,
  updateMemberRoleAction
} from '@/app/actions/fraternity'
import FraternityInviteModal from '@/components/FraternityInviteModal'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

export default function FraternityMembersPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const fraternityId = params.id

  const [members, setMembers] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch members and admin status
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !user?.id || !fraternityId) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Check admin status
        const { data: adminData, error: adminError } = await checkIsAdminAction(fraternityId)
        if (adminError) {
          setError(adminError.message || 'Failed to check admin status')
        } else {
          setIsAdmin(adminData?.isAdmin || false)
        }

        // Fetch members
        const { data: membersData, error: membersError } = await getMembersAction(fraternityId)

        if (membersError) {
          setError(membersError.message || 'Failed to load members')
          setMembers([])
        } else {
          setMembers(membersData || [])
        }
      } catch (err) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [fraternityId, user?.id, authLoading])

  const handleAddMember = async (userId, role) => {
    setActionLoading(true)
    setError(null)

    try {
      const { data, error: addError } = await addMemberAction(fraternityId, userId, role)

      if (addError) {
        setError(addError.message || 'Failed to add member')
        setActionLoading(false)
        return
      }

      // Refresh members list
      const { data: membersData, error: membersError } = await getMembersAction(fraternityId)
      if (!membersError && membersData) {
        setMembers(membersData)
      }

      setShowInviteModal(false)
      setActionLoading(false)
    } catch (err) {
      setError(err.message || 'Failed to add member')
      setActionLoading(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return
    }

    setActionLoading(true)
    setError(null)

    try {
      const { data, error: removeError } = await removeMemberAction(fraternityId, userId)

      if (removeError) {
        setError(removeError.message || 'Failed to remove member')
        setActionLoading(false)
        return
      }

      // Refresh members list
      const { data: membersData, error: membersError } = await getMembersAction(fraternityId)
      if (!membersError && membersData) {
        setMembers(membersData)
      }

      setActionLoading(false)
    } catch (err) {
      setError(err.message || 'Failed to remove member')
      setActionLoading(false)
    }
  }

  const handleUpdateRole = async (userId, newRole) => {
    setActionLoading(true)
    setError(null)

    try {
      const { data, error: updateError } = await updateMemberRoleAction(fraternityId, userId, newRole)

      if (updateError) {
        setError(updateError.message || 'Failed to update role')
        setActionLoading(false)
        return
      }

      // Refresh members list
      const { data: membersData, error: membersError } = await getMembersAction(fraternityId)
      if (!membersError && membersData) {
        setMembers(membersData)
      }

      setActionLoading(false)
    } catch (err) {
      setError(err.message || 'Failed to update role')
      setActionLoading(false)
    }
  }

  // Show loading state
  if (authLoading || loading) {
    return (
      <main className="min-h-screen w-screen bg-white flex items-center justify-center px-6">
        <Card className="text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto mb-4"></div>
          <p className="text-bodySmall text-gray-medium">Loading...</p>
        </Card>
      </main>
    )
  }

  // If not logged in, redirect
  if (!user) {
    router.push('/')
    return null
  }

  // If error loading members, show error (unless it's a permission error - we'll show different message)
  if (error && !members.length) {
    const isPermissionError = error.includes('Only group members') || error.includes('permission')
    
    return (
      <main className="min-h-screen w-screen bg-white flex items-center justify-center px-6">
        <Card className="text-center max-w-md w-full">
          <p className="text-bodySmall text-error mb-4">
            {isPermissionError 
              ? 'You must be a member of this fraternity to view members'
              : error}
          </p>
          <Button
            onClick={() => router.push(`/fraternities/${fraternityId}`)}
            variant="primary"
            size="large"
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </Card>
      </main>
    )
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'status'
      case 'member':
        return 'tag'
      case 'pledge':
        return 'count'
      default:
        return 'tag'
    }
  }

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <main className="min-h-screen w-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              onClick={() => router.push(`/fraternities/${fraternityId}`)}
              variant="text"
              size="medium"
              className="mb-2"
            >
              ← Back to Dashboard
            </Button>
            <h1 className="text-heading1 text-neutral-black mb-2">
              Members
            </h1>
            <p className="text-bodySmall text-gray-medium">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowInviteModal(true)}
              variant="primary"
              size="medium"
            >
              Add Member
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-4 border-2 border-error">
            <p className="text-bodySmall text-error">{error}</p>
          </Card>
        )}

        {/* Members List */}
        <div className="space-y-3">
          {members.map((member) => (
            <Card key={member.id} className="p-4">
              <div className="flex items-start gap-4">
                <Avatar
                  src={member.user?.profile_pic || null}
                  alt={member.user?.name || 'Member'}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-heading3 text-neutral-black truncate">
                      {member.user?.name || 'Unknown User'}
                    </h3>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </div>
                  {member.user?.email && (
                    <p className="text-bodySmall text-gray-medium truncate mb-1">
                      {member.user.email}
                    </p>
                  )}
                  {member.user?.year && (
                    <p className="text-caption text-gray-medium">
                      Year {member.user.year} • Joined {formatJoinDate(member.joined_at)}
                    </p>
                  )}
                </div>

                {/* Admin Actions */}
                {isAdmin && member.user?.id !== user.id && (
                  <div className="flex flex-col gap-2">
                    {member.role !== 'admin' && (
                      <Button
                        onClick={() => handleUpdateRole(member.user.id, 'admin')}
                        variant="text"
                        size="small"
                        disabled={actionLoading}
                        className="text-xs"
                      >
                        Promote
                      </Button>
                    )}
                    {member.role === 'admin' && (
                      <Button
                        onClick={() => handleUpdateRole(member.user.id, 'member')}
                        variant="text"
                        size="small"
                        disabled={actionLoading}
                        className="text-xs"
                      >
                        Demote
                      </Button>
                    )}
                    <Button
                      onClick={() => handleRemoveMember(member.user.id)}
                      variant="text"
                      size="small"
                      disabled={actionLoading}
                      className="text-xs text-error"
                    >
                      Remove
                    </Button>
                  </div>
                )}

                {/* Self-removal */}
                {!isAdmin && member.user?.id === user.id && (
                  <Button
                    onClick={() => handleRemoveMember(member.user.id)}
                    variant="text"
                    size="small"
                    disabled={actionLoading}
                    className="text-xs text-error"
                  >
                    Leave
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {members.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-bodySmall text-gray-medium">No members found</p>
            </Card>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <FraternityInviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          fraternityId={fraternityId}
          onAddMember={handleAddMember}
          loading={actionLoading}
        />
      )}
    </main>
  )
}
