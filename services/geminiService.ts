import { GoogleGenAI, Content } from "@google/genai";
import { Shipment } from "../types";
import { supabase } from "./supabase";

// Lazy initialization to prevent app crash if API key is missing
let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI | null => {
  if (ai) return ai;
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
    return ai;
  }
  console.warn("VITE_GEMINI_API_KEY not set. AI features will use fallback messages.");
  return null;
};

export const getTrackingInsight = async (shipmentId: string, status: string) => {
  const client = getAI();
  if (!client) {
    return "Your package is on its way and everything is looking good. We'll let you know as soon as it gets closer!";
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Provide a friendly shipping update for order ${shipmentId}. Current status is: ${status}. Use simple, reassuring language. Let the customer know their package is being handled with care.`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching Gemini insight:", error);
    return "Your package is on its way and everything is looking good. We'll let you know as soon as it gets closer!";
  }
};

export const fetchRealShipment = async (id: string): Promise<Shipment | null> => {
  const { data, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('tracking_number', id.toUpperCase())
    .single();

  if (error || !data) {
    console.error("Error fetching shipment:", error);
    return null;
  }

  // Extract from JSONB or fallback to empty object
  const senderInfo = data.sender_info || {};
  const receiverInfo = data.receiver_info || {};
  const parcelDetails = data.parcel_details || {};

  // Map database format to UI format
  return {
    id: data.tracking_number,
    status: data.status,
    origin: senderInfo.address || 'Unknown',
    destination: receiverInfo.address || 'Unknown',
    estimatedArrival: data.estimated_delivery ? new Date(data.estimated_delivery).toLocaleDateString() : 'TBD',
    currentLocation: data.current_location || 'Pending',
    weight: parcelDetails.weight ? (parcelDetails.weight + " kg") : (data.weight ? (data.weight + " kg") : '0 kg'),
    dimensions: data.dimensions || 'N/A',
    serviceType: data.service_type || 'Standard',
    history: data.history || [],
    items: data.items || [{ description: parcelDetails.description || 'Shipment Items', quantity: 1, value: data.price || '0', sku: 'GENERIC' }],
    sender: {
      name: senderInfo.name || 'Unknown',
      street: senderInfo.address || 'Unknown',
      city: '',
      country: ''
    },
    recipient: {
      name: receiverInfo.name || 'Unknown',
      street: receiverInfo.address || 'Unknown',
      city: '',
      country: ''
    },
    price: data.price,
    paymentStatus: data.payment_status
  };
};

export const generateMockShipment = (id: string): Shipment => {
  // Keeping this for fallback or internal testing if needed
  const statuses: Shipment['status'][] = ['in-transit', 'out-for-delivery', 'pending', 'delivered'];
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
  const client = getAI();
  if (!client) {
    return "I'm sorry, the AI assistant is currently unavailable. Please contact support@perfectexpress.co for assistance.";
  }

  try {
    const formattedHistory: Content[] = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: formattedHistory,
      config: {
        systemInstruction: `You are the friendly Customer Support Assistant for PerfectExpress shipping. Be warm and helpful.`,
      },
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Support chat error:", error);
    return "I'm sorry, I'm having a little trouble connecting.";
  }
};
