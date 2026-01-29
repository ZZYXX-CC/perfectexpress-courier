import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ShipmentDetails from './ShipmentDetails';
import { fetchRealShipment } from '../services/geminiService';
import { Shipment } from '../types';
import { supabase } from '../services/supabase';

interface TrackingPageProps {
  user: { name: string; email: string; role: 'Client' | 'Admin' } | null;
}

const TrackingPage: React.FC<TrackingPageProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadShipment = async () => {
      if (!id) {
        setError('No tracking number provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fetchedShipment = await fetchRealShipment(id);
        if (fetchedShipment) {
          setShipment(fetchedShipment);
        } else {
          setError('Shipment not found');
        }
      } catch (err) {
        console.error('Error loading shipment:', err);
        setError('Failed to load shipment details');
      } finally {
        setLoading(false);
      }
    };

    loadShipment();
  }, [id]);

  if (loading) {
    return (
      <section className="pt-32 pb-24 bg-bgMain min-h-screen">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="inline-block animate-spin mb-4">
              <iconify-icon icon="solar:refresh-linear" width="32" class="text-red-600"></iconify-icon>
            </div>
            <p className="text-textMuted text-sm font-medium">Loading shipment details...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !shipment) {
    return (
      <section className="pt-32 pb-24 bg-bgMain min-h-screen">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-md mx-auto">
            <iconify-icon icon="solar:box-linear" width="64" class="text-textMuted mb-6 opacity-50"></iconify-icon>
            <h2 className="text-2xl font-black heading-font uppercase tracking-tighter text-textMain mb-4">
              Shipment Not Found
            </h2>
            <p className="text-textMuted text-sm mb-8">{error || 'The tracking number you entered does not exist.'}</p>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/tracking')}
              className="px-6 py-3 bg-red-600 text-white hover:bg-red-700 rounded-sm font-black uppercase tracking-widest text-[10px] transition-all"
            >
              Back to {user ? 'Dashboard' : 'Tracking'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      key="shipment_details"
    >
      <ShipmentDetails
        shipment={shipment}
        onBack={() => navigate(user ? '/dashboard' : '/tracking')}
      />
    </motion.div>
  );
};

export default TrackingPage;
