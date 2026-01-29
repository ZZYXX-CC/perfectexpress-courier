
export interface Shipment {
  id: string;
  status: 'In Transit' | 'Delivered' | 'Pending' | 'Out for Delivery';
  origin: string;
  destination: string;
  estimatedArrival: string;
  currentLocation: string;
  weight: string;
  dimensions: string;
  serviceType: string;
  history: ShipmentEvent[];
  items: ShipmentItem[];
  sender: AddressInfo;
  recipient: AddressInfo;
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
}

export interface ShipmentEvent {
  date: string;
  time: string;
  location: string;
  description: string;
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
