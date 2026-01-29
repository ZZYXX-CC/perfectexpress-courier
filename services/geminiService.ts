import { GoogleGenAI, Content } from "@google/genai";
import { Shipment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTrackingInsight = async (shipmentId: string, status: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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

export const generateMockShipment = (id: string): Shipment => {
  const statuses: Shipment['status'][] = ['In Transit', 'Out for Delivery', 'Pending', 'Delivered'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  const isIntl = Math.random() > 0.5;

  return {
    id: id.toUpperCase(),
    status: status,
    origin: isIntl ? "London Distribution Center" : "Los Angeles Gateway",
    destination: isIntl ? "New York Hub" : "Seattle Fulfillment",
    estimatedArrival: "Oct 24, 2024",
    currentLocation: status === 'Delivered' ? "Home Address" : "Local Sorting Office",
    weight: "2.4 kg",
    dimensions: "35x25x10 cm",
    serviceType: "Express International",
    items: [
      { description: "High-Performance Mechanical Parts", quantity: 2, value: "$450.00", sku: "MCH-992-X" },
      { description: "Documentation Bundle", quantity: 1, value: "$0.00", sku: "DOC-STD" }
    ],
    sender: {
      name: "Logistics Coordinator",
      company: "TechFlow Supply Ltd.",
      street: "44 Industrial Way",
      city: isIntl ? "London" : "Los Angeles",
      country: isIntl ? "UK" : "USA"
    },
    recipient: {
      name: "Alex Mercer",
      company: "Innovate Corp",
      street: "882 Innovation Drive",
      city: isIntl ? "New York" : "Seattle",
      country: "USA"
    },
    history: [
      { date: "2024-10-20", time: "09:00", location: "Sender Location", description: "Package dropped off and ready to ship." },
      { date: "2024-10-21", time: "14:30", location: "Central Sorting Hub", description: "Sorted and sent on the next available route." },
      { date: "2024-10-22", time: "02:15", location: "Destination City", description: "Arrived at the local facility and clearing for final delivery." }
    ]
  };
};

export const chatWithSupport = async (message: string, history: { role: 'user' | 'assistant', content: string }[]) => {
  try {
    // Format history for Gemini API
    const formattedHistory: Content[] = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: formattedHistory,
      config: {
        systemInstruction: `You are the friendly Customer Support Assistant for PerfectExpress shipping. 
        Your goal is to help everyday customers with tracking their packages, getting price estimates, 
        and answering general shipping questions. 
        Be warm, helpful, and use simple language. Avoid technical jargon or complicated logistics terms. 
        If you don't know an answer, tell them to contact a human agent at support@perfectexpress.com.`,
      },
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Support chat error:", error);
    return "I'm sorry, I'm having a little trouble connecting. Please try again or reach out to us directly!";
  }
};
