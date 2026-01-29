'use client';

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Box, Globe, Ship, Truck, Clock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion"; // Added framer-motion
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ShipmentDialog from "@/components/ShipmentDialog";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const handleTrack = () => {
    if (!trackingId.trim()) {
      toast.error("Please enter a tracking ID");
      return;
    }
    router.push(`/track/${trackingId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.span variants={fadeIn} className="inline-block py-1 px-3 rounded-full bg-orange-100 text-primary font-semibold text-sm mb-6">
                #1 Logistics Partner
              </motion.span>
              <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold text-secondary tracking-tight mb-6 leading-[1.1]">
                Seamless Logistics, <br />
                <span className="text-primary relative inline-block">
                  Global Reach
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-orange-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor" />
                  </svg>
                </span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                Experience the next generation of courier services. Fast, reliable, and transparent shipping solutions tailored for your business needs.
              </motion.p>

              {/* Tracking Widget */}
              <motion.div variants={fadeIn} className="max-w-2xl mx-auto mb-12">
                <div className="bg-white p-2 rounded-[20px] shadow-2xl shadow-slate-200/50 border border-slate-100 flex items-center justify-between pl-6 pr-2 py-2 relative z-50">
                  <div className="flex items-center gap-3 text-slate-400 flex-1">
                    <Box />
                    {/* Input Field */}
                    <Input
                      className="border-0 shadow-none focus-visible:ring-0 text-lg px-0 h-auto placeholder:text-slate-400"
                      placeholder="Enter tracking number..."
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                    />
                  </div>
                  <Button
                    size="lg"
                    className="rounded-[16px] text-lg h-12 px-8"
                    onClick={handleTrack}
                  >
                    Track
                  </Button>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="flex items-center justify-center gap-8 text-slate-400 grayscale opacity-70">
                {/* Partner Logos Placeholder */}
                <div className="font-bold text-xl">AMAZON</div>
                <div className="font-bold text-xl">DHL</div>
                <div className="font-bold text-xl">FEDEX</div>
                <div className="font-bold text-xl">SHOPIFY</div>
              </motion.div>
            </motion.div>
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
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-secondary mb-4">Our Services</motion.h2>
              <motion.p variants={fadeIn} className="text-slate-500 text-lg">Comprehensive logistics solutions designed to move your business forward.</motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
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
                <motion.div key={i} variants={fadeIn}>
                  <Card className="group hover:bg-white border-0 hover:shadow-xl transition-all duration-300 h-full">
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
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* FEATURES / STATS SECTION */}
        <section id="company" className="py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.span variants={fadeIn} className="text-primary font-bold tracking-wider uppercase text-sm">Why Choose Us</motion.span>
                <motion.h2 variants={fadeIn} className="text-4xl font-bold text-secondary mt-2 mb-6">We ensure your goods arrive safe & on time.</motion.h2>
                <motion.p variants={fadeIn} className="text-slate-500 text-lg mb-8 leading-relaxed">
                  With over 20 years of experience in the logistics industry, we have built a network that you can trust. Our technology-driven approach ensures transparency at every step.
                </motion.p>

                <div className="space-y-6">
                  {[
                    { icon: Clock, title: 'On-Time Delivery', desc: '99.8% on-time delivery record across all routes.' },
                    { icon: ShieldCheck, title: 'Secure Handling', desc: 'Advanced tracking and insurance support for high-value goods.' }
                  ].map((item, i) => (
                    <motion.div key={i} variants={fadeIn} className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <item.icon className="text-secondary" size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-secondary text-lg">{item.title}</h4>
                        <p className="text-slate-500">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div variants={fadeIn} className="mt-10">
                  <Button size="lg">Explore Solutions</Button>
                </motion.div>
              </motion.div>

              {/* Image Placeholder / Visual */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
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
              </motion.div>
            </div>
          </div>
        </section>

        {/* SHIPMENT FORM SECTION */}
        <section id="ship-now" className="py-24 bg-muted/30 relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Ready to Ship?</h2>
              <p className="text-slate-500 text-lg mb-8">Send your parcel securely in minutes. No account required.</p>
              <ShipmentDialog />
            </div>
          </div>

          {/* Decorative background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl -z-10 opacity-30 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-50/50 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl"></div>
          </div>
        </section>

      </main>

      <div id="support">
        <Footer />
      </div>
    </div>
  );
}
