import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VehicleRegistry from './pages/VehicleRegistry';
import Drivers from './pages/Drivers';
import TripDispatcher from './pages/TripDispatcher';
import Maintenance from './pages/Maintenance';
import FuelExpenses from './pages/FuelExpenses';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vehicles"
            element={
              <ProtectedRoute>
                <Layout>
                  <VehicleRegistry />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/drivers"
            element={
              <ProtectedRoute>
                <Layout>
                  <Drivers />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <Layout>
                  <TripDispatcher />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/maintenance"
            element={
              <ProtectedRoute>
                <Layout>
                  <Maintenance />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/fuel-expenses"
            element={
              <ProtectedRoute>
                <Layout>
                  <FuelExpenses />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default / Fallback redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}


export default App;
