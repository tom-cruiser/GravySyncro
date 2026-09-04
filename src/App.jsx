import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Terms from './pages/Terms';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Profile from './pages/Profile';
import Support from './pages/Support';
import Billing from './pages/Billing';
import Invoices from './pages/Invoices';
import AdminDashboard from './pages/AdminDashboard';
import Workspaces from './pages/Workspaces';
import { logout, setAuthUser } from './features/auth/authSlice';
import ToastContainer from './components/ToastContainer';
import SubscriptionGateModal from './components/SubscriptionGateModal';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(state => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'Admin') return <Navigate to="/workspaces" />;
  return children;
};

function App() {
  const dispatch = useDispatch();
  const { token, isAuthenticated, user } = useSelector(state => state.auth);

  useEffect(() => {
    const hydrateCurrentUser = async () => {
      if (!isAuthenticated || !token) return;
      if (user?._id || user?.id) return;

      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const currentUser = response.data?.data?.user;
        if (currentUser) {
          dispatch(setAuthUser(currentUser));
          return;
        }

        dispatch(logout());
      } catch (error) {
        dispatch(logout());
      }
    };

    hydrateCurrentUser();
  }, [dispatch, isAuthenticated, token, user]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/workspaces" /> : <Landing />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms" element={<Terms />} />

        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="documents" element={<Documents />} />
          <Route path="workspaces" element={<Workspaces />} />
          <Route path="profile" element={<Profile />} />
          <Route path="support" element={<Support />} />
          <Route path="billing" element={<Billing />} />
          <Route path="billing/invoices" element={<Invoices />} />
          <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ToastContainer />
      <SubscriptionGateModal />
    </Router>
  );
}

export default App;
