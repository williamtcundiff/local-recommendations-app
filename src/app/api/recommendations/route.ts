import { NextResponse } from 'next/server';
import { TabType } from '@/app/page';

// API Keys from environment variables
const YELP_API_KEY = process.env.YELP_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const EVENTBRITE_API_KEY = process.env.EVENTBRITE_API_KEY;

async function getRestaurants(cuisine: string, price: string, radius: number, latitude: string, longitude: string) {
  console.log('Fetching restaurants with params:', { cuisine, price, radius, latitude, longitude });
  
  const params = new URLSearchParams({
    term: `${cuisine} restaurants`,
    latitude,
    longitude,
    radius: radius.toString(),
    price: price || '1,2,3,4',
    sort_by: 'rating',
    limit: '50', // Increased limit to get more high-rated options
  });

  try {
    const response = await fetch(`https://api.yelp.com/v3/businesses/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Yelp API error:', errorText);
      throw new Error(`Yelp API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Yelp API response:', data);
    
    // Filter for restaurants with rating >= 4.0
    return data.businesses
      .filter((business: any) => business.rating >= 4.0)
      .map((business: any) => ({
        id: business.id,
        name: business.name,
        type: 'restaurant',
        rating: business.rating,
        price: business.price,
        image_url: business.image_url,
        url: business.url,
        location: {
          address1: business.location.address1,
          city: business.location.city,
        },
      }));
  } catch (error) {
    console.error('Error in getRestaurants:', error);
    throw error;
  }
}

async function getEvents(eventType: string, radius: number, latitude: string, longitude: string) {
  console.log('Fetching events with params:', { eventType, radius, latitude, longitude });
  
  const eventbriteParams = new URLSearchParams({
    'location.latitude': latitude,
    'location.longitude': longitude,
    'location.within': `${radius/1000}km`,
    expand: 'venue',
    categories: eventType,
  });

  try {
    const eventbriteResponse = await fetch(
      `https://www.eventbriteapi.com/v3/events/search?${eventbriteParams}`,
      {
        headers: {
          'Authorization': `Bearer ${EVENTBRITE_API_KEY}`,
        },
        cache: 'no-store',
      }
    );

    if (!eventbriteResponse.ok) {
      const errorText = await eventbriteResponse.text();
      console.error('Eventbrite API error:', errorText);
      throw new Error(`Eventbrite API error: ${eventbriteResponse.status} ${errorText}`);
    }

    const eventbriteData = await eventbriteResponse.json();
    console.log('Eventbrite API response:', eventbriteData);
    
    // Filter out unwanted event types
    return eventbriteData.events
      .filter((event: any) => {
        const name = event.name.text.toLowerCase();
        return !name.includes('pub crawl') &&
               !name.includes('bar crawl') &&
               !name.includes('drag brunch');
      })
      .map((event: any) => ({
        id: event.id,
        name: event.name.text,
        type: 'event',
        rating: null,
        image_url: event.logo?.url,
        url: event.url,
        location: {
          address1: event.venue?.address?.address_1 || 'Location TBA',
          city: event.venue?.address?.city || '',
        },
        start_date: event.start.local,
        end_date: event.end.local,
      }));
  } catch (error) {
    console.error('Error in getEvents:', error);
    throw error;
  }
}

async function getPlaces(type: string, radius: number, latitude: string, longitude: string) {
  console.log('Fetching places with params:', { type, radius, latitude, longitude });
  
  const params = new URLSearchParams({
    location: `${latitude},${longitude}`,
    radius: radius.toString(),
    type: type.toLowerCase(),
    key: GOOGLE_PLACES_API_KEY!,
  });

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API error:', errorText);
      throw new Error(`Google Places API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Google Places API response:', data);
    
    return data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      type: 'place',
      rating: place.rating,
      price: place.price_level ? '$'.repeat(place.price_level) : null,
      image_url: place.photos?.[0]?.photo_reference 
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
        : null,
      url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      location: {
        address1: place.vicinity,
        city: '',
      },
    }));
  } catch (error) {
    console.error('Error in getPlaces:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { cuisine, price, radius, eventType, latitude, longitude, activeTab } = await request.json();
    console.log('Received request:', { cuisine, price, radius, eventType, latitude, longitude, activeTab });
    
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    let results: any[] = [];

    // Only fetch data based on the active tab
    switch (activeTab as TabType) {
      case 'restaurants':
        if (cuisine) {
          results = await getRestaurants(cuisine, price, radius, latitude, longitude);
        }
        break;
      case 'events':
        if (eventType) {
          results = await getEvents(eventType, radius, latitude, longitude);
        }
        break;
      case 'activities':
        if (eventType) {
          results = await getPlaces(eventType, radius, latitude, longitude);
        }
        break;
    }

    // Sort results by rating (if available)
    const sortedResults = results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    console.log('Returning results:', sortedResults.slice(0, 20));
    
    return NextResponse.json(sortedResults.slice(0, 20));
  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
