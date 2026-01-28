'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Users, MessageCircle, Ticket } from 'lucide-react'

interface AdminTabsProps {
    activeTab?: 'shipments' | 'users'
    onTabChange?: (tab: 'shipments' | 'users') => void
}

export default function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
    const pathname = usePathname()

    return (
        <div className="flex gap-2 mb-8 border-b border-slate-200 pb-1 overflow-x-auto">
            {/* Shipments Tab - Button (internal state) */}
            <button
                className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors relative whitespace-nowrap rounded-t-md ${
                    pathname === '/admin' && (activeTab === 'shipments' || !activeTab)
                        ? 'text-primary bg-primary/5'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => {
                    if (pathname !== '/admin') {
                        window.location.href = '/admin'
                    } else {
                        onTabChange?.('shipments')
                    }
                }}
            >
                <Package size={16} />
                Shipments
                {pathname === '/admin' && (activeTab === 'shipments' || !activeTab) && (
                    <div className="absolute bottom-[-5px] left-0 w-full h-[2px] bg-primary rounded-full" />
                )}
            </button>

            {/* Users Tab - Button (internal state) */}
            <button
                className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors relative whitespace-nowrap rounded-t-md ${
                    pathname === '/admin' && activeTab === 'users'
                        ? 'text-primary bg-primary/5'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => {
                    if (pathname !== '/admin') {
                        window.location.href = '/admin?tab=users'
                    } else {
                        onTabChange?.('users')
                    }
                }}
            >
                <Users size={16} />
                User Management
                {pathname === '/admin' && activeTab === 'users' && (
                    <div className="absolute bottom-[-5px] left-0 w-full h-[2px] bg-primary rounded-full" />
                )}
            </button>

            {/* Live Chat Tab - Link */}
            <Link
                href="/admin/chat"
                className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors relative whitespace-nowrap rounded-t-md cursor-pointer ${
                    pathname === '/admin/chat'
                        ? 'text-primary bg-primary/5'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
                <MessageCircle size={16} />
                Live Chat
                {pathname === '/admin/chat' && (
                    <div className="absolute bottom-[-5px] left-0 w-full h-[2px] bg-primary rounded-full" />
                )}
            </Link>

            {/* Support Tickets Tab - Link */}
            <Link
                href="/admin/tickets"
                className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors relative whitespace-nowrap rounded-t-md cursor-pointer ${
                    pathname === '/admin/tickets'
                        ? 'text-primary bg-primary/5'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
                <Ticket size={16} />
                Support Tickets
                {pathname === '/admin/tickets' && (
                    <div className="absolute bottom-[-5px] left-0 w-full h-[2px] bg-primary rounded-full" />
                )}
            </Link>
        </div>
    )
}
