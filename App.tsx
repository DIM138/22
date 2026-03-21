import React, { useState } from 'react';
import Layout from './components/Layout';
import LogoGenerator from './components/LogoGenerator';
import Showcase from './components/Showcase';
import Payment from './components/Payment';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [activeTab, setActiveTab] = useState('generator');

  const renderContent = () => {
    switch (activeTab) {
      case 'generator':
        return <LogoGenerator />;
      case 'showcase':
        return <Showcase />;
      case 'payment':
        return <Payment />;
      default:
        return <LogoGenerator />;
    }
  };

  return (
    <ErrorBoundary>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </ErrorBoundary>
  );
}
