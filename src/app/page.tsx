'use client';

import { useState } from 'react';
import PreferencesForm from '@/components/PreferencesForm';
import RecommendationsList from '@/components/RecommendationsList';

export default function Home() {
  const [preferences, setPreferences] = useState({
    cuisine: '',
    price: '',
    radius: 5000,
    eventType: '',
    latitude: '',
    longitude: '',
  });

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Local Recommendations
        </h1>
        
        <PreferencesForm 
          preferences={preferences}
          setPreferences={setPreferences}
        />
        
        {preferences.latitude && preferences.longitude && (
          <RecommendationsList 
            preferences={preferences}
          />
        )}
      </div>
    </main>
  );
}
