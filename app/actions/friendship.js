// app/actions/friendship.js
// Server Actions for friendship-related operations (DEPRECATED - use app/actions/friends.js instead)
// This file is kept for backward compatibility but delegates to app/actions/friends.js

'use server'

// Import real functions from friends.js (which handles auth internally)
export {
  sendFriendRequestAction,
  acceptFriendRequestAction,
  declineFriendRequestAction as denyFriendRequestAction,
  cancelFriendRequestAction,
  removeFriendAction,
  blockUserAction,
  unblockUserAction,
  getFriendsAction,
  getFriendRequestsAction,
  getSentRequestsAction,
  getFriendshipStatusAction as checkFriendshipStatusAction,
  getPeopleYouMetAction
} from '@/app/actions/friends'

