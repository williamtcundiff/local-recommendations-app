'use client';

import { useState, useEffect } from 'react';
import { TabType } from '@/app/page';

interface Preferences {
  cuisine: string;
  price: string;
  radius: number;
  eventType: string;
  latitude: string;
  longitude: string;
}

interface PreferencesFormProps {
  preferences: Preferences;
  setPreferences: (preferences: Preferences) => void;
  activeTab: TabType;
}

export default function PreferencesForm({ preferences, setPreferences, activeTab }: PreferencesFormProps) {
  const [locationStatus, setLocationStatus] = useState<'loading' | 'error' | 'success'>('loading');

  useEffect(() => {
    // Get user's location when component mounts
    if (navigator.geolocation) {
      setLocationStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPreferences({
            ...preferences,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
          setLocationStatus('success');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationStatus('error');
        }
      );
    } else {
      setLocationStatus('error');
    }
  }, []);

  // Reset preferences when tab changes
  useEffect(() => {
    setPreferences({
      ...preferences,
      cuisine: '',
      price: '',
      eventType: '',
    });
  }, [activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'restaurants':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cuisine Type
                <select
                  value={preferences.cuisine}
                  onChange={(e) => setPreferences({ ...preferences, cuisine: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  <option value="italian">Italian</option>
                  <option value="japanese">Japanese</option>
                  <option value="mexican">Mexican</option>
                  <option value="american">American</option>
                  <option value="chinese">Chinese</option>
                  <option value="indian">Indian</option>
                  <option value="thai">Thai</option>
                  <option value="mediterranean">Mediterranean</option>
                </select>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price Range
                <select
                  value={preferences.price}
                  onChange={(e) => setPreferences({ ...preferences, price: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  <option value="1">$</option>
                  <option value="2">$$</option>
                  <option value="3">$$$</option>
                  <option value="4">$$$$</option>
                </select>
              </label>
            </div>
          </>
        );
      case 'events':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Event Type
              <select
                value={preferences.eventType}
                onChange={(e) => setPreferences({ ...preferences, eventType: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Any</option>
                <option value="music">Music</option>
                <option value="sports">Sports</option>
                <option value="arts">Arts & Theater</option>
                <option value="family">Family</option>
                <option value="food-and-drink">Food & Drink</option>
                <option value="festival">Festivals</option>
                <option value="networking">Networking</option>
              </select>
            </label>
          </div>
        );
      case 'activities':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Activity Type
              <select
                value={preferences.eventType}
                onChange={(e) => setPreferences({ ...preferences, eventType: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Any</option>
                <option value="tourist_attraction">Tourist Attractions</option>
                <option value="park">Parks</option>
                <option value="museum">Museums</option>
                <option value="amusement_park">Amusement Parks</option>
                <option value="shopping_mall">Shopping</option>
                <option value="spa">Spas</option>
                <option value="movie_theater">Movie Theaters</option>
              </select>
            </label>
          </div>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-semibold mb-4">Filter Options</h2>
      
      {/* Location Status */}
      {locationStatus === 'loading' && (
        <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded">
          Getting your location...
        </div>
      )}
      {locationStatus === 'error' && (
        <div className="mb-4 p-2 bg-red-50 text-red-700 rounded">
          Unable to get your location. Please allow location access and refresh the page.
        </div>
      )}
      {locationStatus === 'success' && (
        <div className="mb-4 p-2 bg-green-50 text-green-700 rounded">
          Location found! Showing recommendations within 30 minutes drive.
        </div>
      )}

      <form className="space-y-4">
        {renderTabContent()}
      </form>
    </div>
  );
}
