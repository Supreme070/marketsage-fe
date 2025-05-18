/**
 * Notification Utilities
 * 
 * Helper functions to generate notifications for various events in the system
 */

import { createNotification, NotificationType, NotificationCategory } from './notification-service';

/**
 * Generate a notification for a completed campaign
 */
export async function notifyCampaignCompleted(
  userId: string,
  campaignId: string,
  campaignName: string,
  campaignType: 'email' | 'sms' | 'whatsapp'
) {
  const title = `${campaignType.toUpperCase()} Campaign Completed`;
  const message = `Your campaign "${campaignName}" has completed successfully.`;
  const link = `/${campaignType}/campaigns/${campaignId}`;
  
  return createNotification({
    userId,
    title,
    message,
    type: 'success',
    category: 'campaigns',
    link
  });
}

/**
 * Generate a notification for a campaign with low performance
 */
export async function notifyCampaignLowPerformance(
  userId: string,
  campaignId: string,
  campaignName: string,
  metric: string,
  value: number
) {
  const title = `Low ${metric} Rate`;
  const message = `Your campaign "${campaignName}" has a ${metric} rate of ${value}%, which is below average.`;
  const link = `/email/campaigns/${campaignId}`;
  
  return createNotification({
    userId,
    title,
    message,
    type: 'warning',
    category: 'campaigns',
    link
  });
}

/**
 * Generate a notification for new contacts
 */
export async function notifyContactsImported(
  userId: string,
  count: number,
  listName?: string
) {
  const title = 'Contacts Imported';
  const message = listName 
    ? `${count} new contacts were imported to "${listName}".`
    : `${count} new contacts were imported.`;
  
  return createNotification({
    userId,
    title,
    message,
    type: 'success',
    category: 'contacts',
    link: '/contacts'
  });
}

/**
 * Generate a notification for a journey milestone
 */
export async function notifyJourneyMilestone(
  userId: string,
  journeyId: string,
  journeyName: string,
  count: number,
  milestone: string
) {
  const title = 'Journey Milestone';
  const message = `${count} contacts have ${milestone} in the "${journeyName}" journey.`;
  const link = `/journeys/${journeyId}`;
  
  return createNotification({
    userId,
    title,
    message,
    type: 'info',
    category: 'journeys',
    link
  });
}

/**
 * Generate a notification for a workflow error
 */
export async function notifyWorkflowError(
  userId: string,
  workflowId: string,
  workflowName: string,
  errorMessage: string
) {
  const title = 'Workflow Error';
  const message = `Your workflow "${workflowName}" has encountered an error: ${errorMessage}`;
  const link = `/workflows/${workflowId}`;
  
  return createNotification({
    userId,
    title,
    message,
    type: 'error',
    category: 'workflows',
    link
  });
}

/**
 * Generate a notification for a system event
 */
export async function notifySystemEvent(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'info',
  link?: string
) {
  return createNotification({
    userId,
    title,
    message,
    type,
    category: 'system',
    link
  });
}

/**
 * Generate a notification for a segment update
 */
export async function notifySegmentUpdate(
  userId: string,
  segmentId: string,
  segmentName: string,
  changeType: 'growth' | 'decline',
  percentage: number
) {
  const title = 'Segment Update';
  const message = changeType === 'growth'
    ? `Your "${segmentName}" segment grew by ${percentage}% since last month.`
    : `Your "${segmentName}" segment decreased by ${percentage}% since last month.`;
  const link = `/segments/${segmentId}`;
  
  return createNotification({
    userId,
    title,
    message,
    type: changeType === 'growth' ? 'success' : 'warning',
    category: 'segments',
    link
  });
} 