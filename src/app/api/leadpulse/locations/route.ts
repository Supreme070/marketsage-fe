import { NextResponse } from 'next/server';

type VisitorLocation = {
  id: string;
  city: string;
  country: string;
  isActive: boolean;
  lastActive: string;
  visitCount: number;
  latitude: number;
  longitude: number;
};

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';

    // In a real implementation, we would fetch this data from a database
    // For now, we'll return mock data
    const mockLocations: VisitorLocation[] = [
      {
        id: 'loc_1',
        city: 'New York',
        country: 'USA',
        isActive: true,
        lastActive: 'just now',
        visitCount: 145,
        latitude: 40.7128,
        longitude: -74.0060
      },
      {
        id: 'loc_2',
        city: 'London',
        country: 'UK',
        isActive: true,
        lastActive: '2 mins ago',
        visitCount: 87,
        latitude: 51.5074,
        longitude: -0.1278
      },
      {
        id: 'loc_3',
        city: 'Lagos',
        country: 'Nigeria',
        isActive: true,
        lastActive: '5 mins ago',
        visitCount: 62,
        latitude: 6.5244,
        longitude: 3.3792
      },
      {
        id: 'loc_4',
        city: 'Tokyo',
        country: 'Japan',
        isActive: false,
        lastActive: '15 mins ago',
        visitCount: 43,
        latitude: 35.6762,
        longitude: 139.6503
      },
      {
        id: 'loc_5',
        city: 'Sydney',
        country: 'Australia',
        isActive: false,
        lastActive: '32 mins ago',
        visitCount: 28,
        latitude: -33.8688,
        longitude: 151.2093
      },
      {
        id: 'loc_6',
        city: 'Cairo',
        country: 'Egypt',
        isActive: true,
        lastActive: '7 mins ago',
        visitCount: 35,
        latitude: 30.0444,
        longitude: 31.2357
      },
      {
        id: 'loc_7',
        city: 'Rio de Janeiro',
        country: 'Brazil',
        isActive: false,
        lastActive: '45 mins ago',
        visitCount: 19,
        latitude: -22.9068,
        longitude: -43.1729
      },
      {
        id: 'loc_8',
        city: 'Delhi',
        country: 'India',
        isActive: true,
        lastActive: '3 mins ago',
        visitCount: 54,
        latitude: 28.7041,
        longitude: 77.1025
      },
      {
        id: 'loc_9',
        city: 'Abuja',
        country: 'Nigeria',
        isActive: true,
        lastActive: '1 min ago',
        visitCount: 41,
        latitude: 9.0765,
        longitude: 7.3986
      },
      {
        id: 'loc_10',
        city: 'Accra',
        country: 'Ghana',
        isActive: false,
        lastActive: '25 mins ago',
        visitCount: 27,
        latitude: 5.6037,
        longitude: -0.1870
      }
    ];

    // Filter based on time range (in a real implementation)
    // Currently just returning all mock data
    return NextResponse.json({ 
      locations: mockLocations,
      totalActive: mockLocations.filter(loc => loc.isActive).length,
      totalVisitors: mockLocations.reduce((sum, loc) => sum + loc.visitCount, 0)
    });
  } catch (error) {
    console.error('Error fetching visitor locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor locations' },
      { status: 500 }
    );
  }
} 