import React from 'react';
import './styles.css';
import Layout from './Layout';

const Settings: React.FC = () => {
  return (
    <Layout showHeader={true}>
        <div>
            <h1>Future Settings</h1>
        <div>
            <h4>Table settings w remove options</h4>
        </div>
        </div>
    </Layout>
  );
};

export default Settings;