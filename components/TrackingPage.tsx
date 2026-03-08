import React, { useState, useEffect, useCallback } from 'react';
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

  const loadShipment = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    loadShipment();
  }, [loadShipment]);

  useEffect(() => {
    if (!id) return;

    const trackingNumber = id.toUpperCase();
    const channel = supabase
      .channel(`realtime_shipment_${trackingNumber}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments', filter: `tracking_number=eq.${trackingNumber}` },
        () => {
          loadShipment();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, loadShipment]);

  if (loading) {
    return (
      <section className="pt-32 pb-24 bg-bgMain min-h-screen">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mx-auto bg-bgSurface border border-borderColor rounded-sm p-10 text-center shadow-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-5 border border-red-600/30 rounded-full bg-red-600/5">
              <iconify-icon icon="solar:refresh-linear" width="28" class="text-red-600 animate-spin"></iconify-icon>
            </div>
            <p className="metadata-label text-red-600 mb-2">Live Tracking</p>
            <h2 className="text-2xl md:text-3xl font-black heading-font uppercase tracking-tighter text-textMain mb-2">
              Fetching Shipment Intel
            </h2>
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
          <div className="text-center max-w-xl mx-auto bg-bgSurface border border-borderColor rounded-sm p-10 shadow-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-6 border border-borderColor rounded-full bg-bgMain/70">
              <iconify-icon icon="solar:box-linear" width="30" class="text-textMuted opacity-70"></iconify-icon>
            </div>
            <p className="metadata-label text-red-600 mb-2">Tracking Exception</p>
            <h2 className="text-2xl md:text-3xl font-black heading-font uppercase tracking-tighter text-textMain mb-4">
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
