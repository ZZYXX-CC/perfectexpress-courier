"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Box } from "lucide-react";

interface TrackingModalProps {
    children?: React.ReactNode;
}

export function TrackingModal({ children }: TrackingModalProps) {
    const [trackingId, setTrackingId] = useState("");
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleTrack = () => {
        if (trackingId.trim()) {
            setOpen(false);
            router.push(`/track/${trackingId.trim()}`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button size="lg">Track Shipment</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Track Your Shipment</DialogTitle>
                    <DialogDescription>
                        Enter your tracking ID to see the current status of your package.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 py-4">
                    <div className="relative flex-1">
                        <Box className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="trackingId"
                            placeholder="e.g. SWIFT-123456"
                            className="pl-9"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                        />
                    </div>
                    <Button type="button" onClick={handleTrack}>
                        Track
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
