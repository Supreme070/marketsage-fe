import { NextResponse } from 'next/server';

export async function GET() {
  // Return mock notifications data in the expected format
  const mockNotifications = [
    {
      id: '1',
      title: 'Welcome to MarketSage',
      message: 'Your account has been successfully created',
      type: 'info',
      read: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: '2', 
      title: 'Dashboard Updated',
      message: 'New analytics data is available',
      type: 'success',
      read: false,
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    }
  ];

  return NextResponse.json({
    success: true,
    data: mockNotifications,
    message: 'Notifications retrieved successfully',
  });
}
