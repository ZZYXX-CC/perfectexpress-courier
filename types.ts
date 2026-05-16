
export interface Shipment {
  id: string;
  status: string;
  price?: number;
  paymentStatus?: 'paid' | 'unpaid';
  origin: string;
  destination: string;
  estimatedArrival: string;
  estimatedDelivery?: string;
  currentLocation: string;
  locationDetail?: string;
  weight: string;
  dimensions: string;
  serviceType: string;
  history: ShipmentEvent[];
  items: ShipmentItem[];
  sender: AddressInfo;
  recipient: AddressInfo;
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt?: string;
}

export interface ShipmentItem {
  description: string;
  quantity: number;
  value: string;
  sku: string;
}

export interface AddressInfo {
  name: string;
  company?: string;
  street: string;
  city: string;
  country: string;
  email?: string;
}

export interface ShipmentEvent {
  date: string;
  time: string;
  location: string;
  description: string;
  status?: string;
  timestamp?: string;
  note?: string;
}

export interface QuoteRequest {
  origin: string;
  destination: string;
  weight: number;
  serviceType: 'Standard' | 'Express' | 'Luxury';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface User {
  name: string;
  email: string;
  role: 'Client' | 'Admin';
}
