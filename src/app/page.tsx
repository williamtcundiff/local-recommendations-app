'use client';

import { useState } from 'react';
import PreferencesForm from '@/components/PreferencesForm';
import RecommendationsList from '@/components/RecommendationsList';
import TabNavigation from '@/components/TabNavigation';

export type TabType = 'restaurants' | 'events' | 'activities';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('restaurants');
  const [preferences, setPreferences] = useState({
    cuisine: '',
    price: '',
    radius: 48000, // 30 minute drive (approximately 30 miles or 48 kilometers)
    eventType: '',
    latitude: '',
    longitude: '',
  });

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Chewsy
        </h1>
        
        <TabNavigation 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        
        <PreferencesForm 
          preferences={preferences}
          setPreferences={setPreferences}
          activeTab={activeTab}
        />
        
        {preferences.latitude && preferences.longitude && (
          <RecommendationsList 
            preferences={preferences}
            activeTab={activeTab}
          />
        )}
      </div>
    </main>
  );
}
