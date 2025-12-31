// components/FraternityInviteModal.js
// Modal for admins to add members to a fraternity

'use client'

import { useState } from 'react'
import { searchUserByEmailAction } from '@/app/actions/profile'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

export default function FraternityInviteModal({
  isOpen,
  onClose,
  fraternityId,
  onAddMember,
  loading = false
}) {
  const [email, setEmail] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [foundUser, setFoundUser] = useState(null)
  const [selectedRole, setSelectedRole] = useState('member')
  const [error, setError] = useState(null)
  const [searchError, setSearchError] = useState(null)

  if (!isOpen) return null

  const handleSearch = async (e) => {
    e.preventDefault()
    setSearchError(null)
    setFoundUser(null)
    setError(null)

    if (!email.trim() || !email.includes('@')) {
      setSearchError('Please enter a valid email address')
      return
    }

    setSearchLoading(true)

    try {
      const { data, error: searchErr } = await searchUserByEmailAction(email.trim())

      if (searchErr) {
        setSearchError(searchErr.message || 'User not found')
        setFoundUser(null)
      } else if (data) {
        setFoundUser(data)
        setSearchError(null)
      } else {
        setSearchError('User not found')
        setFoundUser(null)
      }
    } catch (err) {
      setSearchError(err.message || 'Failed to search user')
      setFoundUser(null)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!foundUser?.id) {
      setError('Please search for a user first')
      return
    }

    setError(null)

    try {
      await onAddMember(foundUser.id, selectedRole)
      // Reset form on success
      setEmail('')
      setFoundUser(null)
      setSelectedRole('member')
      setError(null)
      setSearchError(null)
    } catch (err) {
      setError(err.message || 'Failed to add member')
    }
  }

  const handleClose = () => {
    setEmail('')
    setFoundUser(null)
    setSelectedRole('member')
    setError(null)
    setSearchError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-heading2 text-neutral-black mb-2">
              Add Member
            </h2>
            <p className="text-bodySmall text-gray-medium">
              Search for a user by email to add them to this fraternity
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
                Email Address
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setSearchError(null)
                    setFoundUser(null)
                  }}
                  placeholder="user@example.edu"
                  error={searchError}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={searchLoading}
                >
                  {searchLoading ? '...' : 'Search'}
                </Button>
              </div>
              {searchError && (
                <p className="text-bodySmall text-error mt-1">{searchError}</p>
              )}
            </div>
          </form>

          {/* Found User Preview */}
          {foundUser && (
            <div className="border border-gray-border rounded-md p-4 bg-gray-light">
              <div className="flex items-start gap-3 mb-4">
                <Avatar
                  src={foundUser.profile_pic || null}
                  alt={foundUser.name || 'User'}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-heading3 text-neutral-black mb-1">
                    {foundUser.name || 'Unknown User'}
                  </h3>
                  <p className="text-bodySmall text-gray-medium truncate">
                    {foundUser.email}
                  </p>
                  {foundUser.year && (
                    <p className="text-caption text-gray-medium mt-1">
                      Year {foundUser.year}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {foundUser.email_verified && (
                      <Badge variant="status" status="active">
                        Verified
                      </Badge>
                    )}
                    {!foundUser.email_verified && (
                      <Badge variant="tag">
                        Not Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-bodySmall font-semibold mb-2 text-neutral-black">
                  Role
                </label>
                <div className="space-y-2">
                  {['admin', 'member', 'pledge'].map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-3 p-3 border border-gray-border rounded-md cursor-pointer hover:bg-white transition-colors"
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={selectedRole === role}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-4 h-4 text-primary-ui focus:ring-primary-ui"
                      />
                      <span className="text-bodySmall text-neutral-black capitalize">
                        {role}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Warning if user not verified */}
              {!foundUser.email_verified && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning rounded-md">
                  <p className="text-bodySmall text-gray-dark">
                    This user does not have a verified email. They may not count toward verification requirements.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-error text-error rounded-md">
              <p className="text-bodySmall">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleClose}
              variant="secondary"
              size="large"
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              variant="primary"
              size="large"
              className="flex-1"
              disabled={!foundUser || loading}
            >
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
