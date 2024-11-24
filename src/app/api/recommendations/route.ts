import { NextResponse } from 'next/server';

// API Keys from environment variables
const YELP_API_KEY = process.env.YELP_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const EVENTBRITE_API_KEY = process.env.EVENTBRITE_API_KEY;

async function getRestaurants(cuisine: string, price: string, radius: number, latitude: string, longitude: string) {
  const params = new URLSearchParams({
    term: cuisine || 'restaurants',
    latitude,
    longitude,
    radius: radius.toString(),
    price: price || '1,2,3,4',
    sort_by: 'rating',
    limit: '10',
  });

  const response = await fetch(`https://api.yelp.com/v3/businesses/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${YELP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch from Yelp API');
  }

  const data = await response.json();
  return data.businesses.map((business: any) => ({
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
}

async function getEvents(eventType: string, radius: number, latitude: string, longitude: string) {
  // Eventbrite API
  const eventbriteParams = new URLSearchParams({
    'location.latitude': latitude,
    'location.longitude': longitude,
    'location.within': `${radius/1000}km`,
    expand: 'venue',
    categories: eventType,
  });

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
    throw new Error('Failed to fetch from Eventbrite API');
  }

  const eventbriteData = await eventbriteResponse.json();
  return eventbriteData.events.map((event: any) => ({
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
}

async function getPlaces(type: string, radius: number, latitude: string, longitude: string) {
  const params = new URLSearchParams({
    location: `${latitude},${longitude}`,
    radius: radius.toString(),
    type: type,
    key: GOOGLE_PLACES_API_KEY!,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch from Google Places API');
  }

  const data = await response.json();
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
}

export async function POST(request: Request) {
  try {
    const preferences = await request.json();
    const { cuisine, price, radius, eventType, latitude, longitude } = preferences;

    // Fetch data from all APIs in parallel
    const [restaurants, events, places] = await Promise.all([
      cuisine ? getRestaurants(cuisine, price, radius, latitude, longitude) : [],
      eventType ? getEvents(eventType, radius, latitude, longitude) : [],
      eventType ? getPlaces(eventType, radius, latitude, longitude) : [],
    ]);

    // Combine and sort results
    const allRecommendations = [
      ...restaurants,
      ...events,
      ...places,
    ].sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return NextResponse.json(allRecommendations.slice(0, 20)); // Return top 20 results
  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
