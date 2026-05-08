import { Shipment } from "../types";
import { supabase } from "./supabase";
import { mapShipmentRow } from "./shipmentUtils";

// All Gemini API calls now go through /api/gemini serverless function.
// The API key never reaches the client bundle.

const GEMINI_API_ENDPOINT = '/api/gemini';

export const getTrackingInsight = async (shipmentId: string, status: string) => {
  try {
    const response = await fetch(GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'tracking-insight',
        payload: { shipmentId, status }
      })
    });

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    return data.text || "Your package is on its way and everything is looking good.";
  } catch {
    return "Your package is on its way and everything is looking good. We'll let you know as soon as it gets closer!";
  }
};

export const fetchRealShipment = async (id: string): Promise<Shipment | null> => {
  const { data, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('tracking_number', id.toUpperCase())
    .single();

  if (error || !data) return null;

  return mapShipmentRow(data);
};

export const generateMockShipment = (id: string): Shipment => {
  // Keeping this for fallback or internal testing if needed
  const statuses: Shipment['status'][] = ['pending', 'quoted', 'confirmed', 'in-transit', 'out-for-delivery', 'delivered'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    id: id.toUpperCase(),
    status: status,
    origin: "London Distribution Center",
    destination: "New York Hub",
    estimatedArrival: "Oct 24, 2024",
    currentLocation: status === 'delivered' ? "Home Address" : "Local Sorting Office",
    weight: "2.4 kg",
    dimensions: "35x25x10 cm",
    serviceType: "Express International",
    items: [],
    sender: { name: "Logistics Coordinator", street: "44 Industrial Way", city: "London", country: "UK" },
    recipient: { name: "Alex Mercer", street: "882 Innovation Drive", city: "New York", country: "USA" },
    history: []
  };
};

export const chatWithSupport = async (message: string, history: { role: 'user' | 'assistant', content: string }[]) => {
  try {
    const response = await fetch(GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'chat',
        payload: { message, history }
      })
    });

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    return data.text || "I'm sorry, I'm having a little trouble connecting.";
  } catch {
    return "I'm sorry, the AI assistant is currently unavailable. Please contact support@perfectexpress.co for assistance.";
  }
};
