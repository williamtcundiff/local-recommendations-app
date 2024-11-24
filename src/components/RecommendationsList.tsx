'use client';

import { useState, useEffect } from 'react';

interface Preferences {
  cuisine: string;
  price: string;
  radius: number;
  eventType: string;
}

interface RecommendationsListProps {
  preferences: Preferences;
}

interface Recommendation {
  id: string;
  name: string;
  type: 'restaurant' | 'event';
  rating: number;
  price?: string;
  image_url?: string;
  url: string;
  location: {
    address1: string;
    city: string;
  };
}

export default function RecommendationsList({ preferences }: RecommendationsListProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError('');
      
      try {
        // We'll implement this API route later
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preferences),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        setRecommendations(data);
      } catch (err) {
        setError('Failed to load recommendations. Please try again.');
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have some preferences set
    if (preferences.cuisine || preferences.eventType) {
      fetchRecommendations();
    }
  }, [preferences]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Select your preferences to see recommendations
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {recommendations.map((item) => (
        <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
            <p className="text-gray-600 text-sm mb-2">
              {item.location.address1}, {item.location.city}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-yellow-400 mr-1">★</span>
                <span className="text-sm text-gray-600">{item.rating}</span>
              </div>
              {item.price && (
                <span className="text-green-600 text-sm">{item.price}</span>
              )}
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 transition-colors"
            >
              View Details
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
