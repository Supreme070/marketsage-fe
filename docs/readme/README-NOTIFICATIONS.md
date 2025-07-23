# MarketSage Notification System

This document explains the notification system implementation for MarketSage and how to set it up.

## Overview

The notification system provides real-time notifications to users about various events in the system, such as completed campaigns, imported contacts, journey milestones, workflow errors, and system events.

## Components

1. **Database Model**: A `Notification` model in the Prisma schema
2. **Notification Service**: A service for managing notifications
3. **API Routes**: Endpoints for fetching and managing notifications
4. **Context Provider**: A React context for managing notification state
5. **UI Components**: Updated header and notifications page components
6. **Utility Functions**: Helper functions for generating notifications

## Setup Instructions

### 1. Create the Database Migration

Run the following command to create and apply the migration for the Notification model:

```bash
npm run create-notification-migration
```

This will create a migration file in the `prisma/migrations` directory and apply it to the database.

### 2. Generate Prisma Client

After applying the migration, generate the Prisma client:

```bash
npm run db:generate
```

### 3. Seed Sample Notifications

To seed sample notifications for testing:

```bash
npm run seed-notifications
```

### 4. Restart the Application

Restart your application to ensure all changes take effect:

```bash
npm run dev
```

## Using the Notification System

### Generating Notifications

You can use the utility functions in `src/lib/notification-utils.ts` to generate notifications for various events:

```typescript
import { notifyCampaignCompleted } from '@/lib/notification-utils';

// Example: Generate a notification when a campaign completes
await notifyCampaignCompleted(
  userId,
  campaignId,
  campaignName,
  'email'
);
```

### Available Notification Utilities

- `notifyCampaignCompleted`: For completed campaigns
- `notifyCampaignLowPerformance`: For campaigns with low performance
- `notifyContactsImported`: For imported contacts
- `notifyJourneyMilestone`: For journey milestones
- `notifyWorkflowError`: For workflow errors
- `notifySystemEvent`: For system events
- `notifySegmentUpdate`: For segment updates

### Accessing Notifications in Components

You can use the `useNotifications` hook to access notifications in your components:

```typescript
import { useNotifications } from '@/context/notification-context';

function MyComponent() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  // Use notification data and functions
}
```

## API Endpoints

- `GET /api/notifications`: Get notifications for the current user
- `POST /api/notifications/read`: Mark all notifications as read
- `POST /api/notifications/[id]/read`: Mark a specific notification as read

## Docker Setup

The Docker setup has been updated to include the notification migration and seeding. When you run:

```bash
docker-compose up -d
```

The notification system will be set up automatically.

## Troubleshooting

If you encounter any issues with the notification system:

1. Check that the migration was applied correctly:
   ```bash
   npx prisma migrate status
   ```

2. Verify that the Prisma client was generated:
   ```bash
   ls -la node_modules/.prisma/client
   ```

3. Check for errors in the console or server logs.

4. If notifications are not appearing, try refreshing the page or checking the network requests in the browser developer tools. 