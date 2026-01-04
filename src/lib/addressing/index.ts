/**
 * Addressing System Exports
 * Main entry point for the addressing system
 */

export type {
  AddressType,
  ParsedAddress,
  Address,
  VisibilityResult,
  DeliveryResult,
  ContextModifier,
} from './types';

export { CONTEXT_MODIFIERS } from './types';

export {
  parseAddress,
  createAddress,
  isPublicAddress,
  isFollowersAddress,
  extractContextIds,
  extractUserIds,
  addressTargetsUser,
  addressTargetsContext,
  combineAddresses,
} from './parser';

// Visibility checker
export {
  canSeeActivity,
  canSeeActivityWithReason,
  filterVisibleActivities,
  anyAddressVisible,
  batchCheckFollowing,
  batchCheckMembership,
} from './visibility';

// Delivery service
export {
  deliverActivity,
  deliverActivityWithMentions,
  resolveRecipients,
  previewDelivery,
  deleteDelivery,
  markAsRead,
  markAllAsRead,
  batchDeliverActivities,
  updateDeliveryPriority,
} from './delivery';
