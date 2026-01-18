'use client';

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Box, Globe, Ship, Truck, Clock, ShieldCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ShipmentForm from "@/components/ShipmentForm";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");

  const handleTrack = () => {
    if (!trackingId.trim()) {
      toast.error("Please enter a tracking ID");
      return;
    }
    router.push(`/track/${trackingId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-background  font-sans selection:bg-primary/20">
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-block py-1 px-3 rounded-full bg-orange-100 text-primary font-semibold text-sm mb-6 animate-fade-in-up">
                #1 Logistics Partner
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-secondary tracking-tight mb-6 leading-[1.1]">
                Seamless Logistics, <br />
                <span className="text-primary relative inline-block">
                  Global Reach
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-orange-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                Experience the next generation of courier services. Fast, reliable, and transparent shipping solutions tailored for your business needs.
              </p>

              {/* Tracking Widget */}
              <div className="max-w-2xl mx-auto bg-white p-2 rounded-[20px] shadow-2xl shadow-slate-200/50 flex flex-col sm:flex-row gap-2 border border-slate-100 mb-12 transform hover:-translate-y-1 transition-transform duration-300">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Enter Tracking ID (e.g. SWIFT-123456)"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                    className="border-0 shadow-none h-14 bg-transparent text-lg focus-visible:ring-0 pl-12"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                    <Box />
                  </div>
                </div>
                <Button size="lg" className="rounded-[16px] sm:w-40 text-lg h-14" onClick={handleTrack}>
                  Track
                </Button>
              </div>

              <div className="flex items-center justify-center gap-8 text-slate-400 grayscale opacity-70">
                {/* Partner Logos Placeholder */}
                <div className="font-bold text-xl">AMAZON</div>
                <div className="font-bold text-xl">DHL</div>
                <div className="font-bold text-xl">FEDEX</div>
                <div className="font-bold text-xl">SHOPIFY</div>
              </div>
            </div>
          </div>

          {/* Background Decorative */}
          <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-orange-50 rounded-full blur-3xl opacity-50" />
            <div className="absolute top-40 -left-20 w-[400px] h-[400px] bg-blue-50 rounded-full blur-3xl opacity-50" />
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section id="services" className="py-24 bg-muted/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Our Services</h2>
              <p className="text-slate-500 text-lg">Comprehensive logistics solutions designed to move your business forward.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Truck,
                  title: 'Road Transport',
                  desc: 'Reliable ground shipping for national and regional deliveries with real-time fleet tracking.'
                },
                {
                  icon: Ship,
                  title: 'Ocean Freight',
                  desc: 'Cost-effective international shipping solutions for large cargo volumes across major sea routes.'
                },
                {
                  icon: Globe,
                  title: 'Air Freight',
                  desc: 'Express air delivery for time-critical shipments ensuring fastest global connections.'
                }
              ].map((service, i) => (
                <Card key={i} className="group hover:bg-white border-0 hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-2 group-hover:bg-primary transition-colors duration-300">
                      <service.icon className="text-primary group-hover:text-white transition-colors duration-300" size={28} />
                    </div>
                    <CardTitle className="text-xl font-bold text-secondary">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-500 leading-relaxed mb-6">{service.desc}</p>
                    <a href="#" className="inline-flex items-center text-primary font-semibold hover:gap-2 transition-all">
                      Learn More <ArrowRight size={16} className="ml-1" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES / STATS SECTION */}
        <section className="py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-primary font-bold tracking-wider uppercase text-sm">Why Choose Us</span>
                <h2 className="text-4xl font-bold text-secondary mt-2 mb-6">We ensure your goods arrive safe & on time.</h2>
                <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                  With over 20 years of experience in the logistics industry, we have built a network that you can trust. Our technology-driven approach ensures transparency at every step.
                </p>

                <div className="space-y-6">
                  {[
                    { icon: Clock, title: 'On-Time Delivery', desc: '99.8% on-time delivery record across all routes.' },
                    { icon: ShieldCheck, title: 'Secure Handling', desc: 'Advanced tracking and insurance support for high-value goods.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <item.icon className="text-secondary" size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-secondary text-lg">{item.title}</h4>
                        <p className="text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <Button size="lg">Explore Solutions</Button>
                </div>
              </div>

              {/* Image Placeholder / Visual */}
              <div className="relative">
                <div className="absolute -inset-4 bg-orange-100 rounded-[40px] rotate-3 -z-10" />
                <div className="bg-slate-200 rounded-[32px] overflow-hidden aspect-square md:aspect-[4/3] relative flex items-center justify-center text-slate-400">
                  <Image
                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"
                    alt="Logistics Warehouse"
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Floating Card */}
                <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-2xl shadow-xl max-w-xs animate-bounce-slow border border-slate-100">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Box className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-secondary">Shipment Delivered</p>
                      <p className="text-xs text-slate-500">Just now</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* SHIPMENT FORM SECTION */}
      <section id="ship-now" className="py-24 bg-muted/30 relative">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Ready to Ship?</h2>
            <p className="text-slate-500 text-lg">Send your parcel securely in minutes. No account required.</p>
          </div>
          <ShipmentForm />
        </div>

        {/* Decorative background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-50/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
