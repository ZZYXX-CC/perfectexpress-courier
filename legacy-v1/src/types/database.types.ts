export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            chat_sessions: {
                Row: {
                    id: string
                    visitor_name: string
                    visitor_email: string
                    user_id: string | null
                    assigned_admin_id: string | null
                    status: string | null
                    unread_count: number | null
                    last_message_at: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    visitor_name: string
                    visitor_email: string
                    user_id?: string | null
                    assigned_admin_id?: string | null
                    status?: string | null
                    unread_count?: number | null
                    last_message_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    visitor_name?: string
                    visitor_email?: string
                    user_id?: string | null
                    assigned_admin_id?: string | null
                    status?: string | null
                    unread_count?: number | null
                    last_message_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "chat_sessions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "chat_sessions_assigned_admin_id_fkey"
                        columns: ["assigned_admin_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            },
            chat_messages: {
                Row: {
                    id: string
                    session_id: string
                    sender_type: string
                    sender_name: string | null
                    message: string
                    is_read: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    session_id: string
                    sender_type: string
                    sender_name?: string | null
                    message: string
                    is_read?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    session_id?: string
                    sender_type?: string
                    sender_name?: string | null
                    message?: string
                    is_read?: boolean | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "chat_messages_session_id_fkey"
                        columns: ["session_id"]
                        isOneToOne: false
                        referencedRelation: "chat_sessions"
                        referencedColumns: ["id"]
                    },
                ]
            },
            profiles: {
                Row: {
                    created_at: string | null
                    email: string | null
                    full_name: string | null
                    id: string
                    role: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id: string
                    role?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    role?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            },
            shipments: {
                Row: {
                    created_at: string | null
                    current_location: string | null
                    history: Json | null
                    id: string
                    parcel_details: Json
                    payment_status: string | null
                    price: number | null
                    receiver_info: Json
                    sender_info: Json
                    status: string | null
                    tracking_number: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    current_location?: string | null
                    history?: Json | null
                    id?: string
                    parcel_details?: Json
                    payment_status?: string | null
                    price?: number | null
                    receiver_info?: Json
                    sender_info?: Json
                    status?: string | null
                    tracking_number?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    current_location?: string | null
                    history?: Json | null
                    id?: string
                    parcel_details?: Json
                    payment_status?: string | null
                    price?: number | null
                    receiver_info?: Json
                    sender_info?: Json
                    status?: string | null
                    tracking_number?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "shipments_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            },
            support_tickets: {
                Row: {
                    id: string
                    ticket_number: string | null
                    user_id: string | null
                    name: string
                    email: string
                    subject: string
                    status: string | null
                    priority: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    ticket_number?: string | null
                    user_id?: string | null
                    name: string
                    email: string
                    subject: string
                    status?: string | null
                    priority?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    ticket_number?: string | null
                    user_id?: string | null
                    name?: string
                    email?: string
                    subject?: string
                    status?: string | null
                    priority?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "support_tickets_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            },
            ticket_replies: {
                Row: {
                    id: string
                    ticket_id: string
                    sender_type: string
                    sender_name: string | null
                    message: string
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    ticket_id: string
                    sender_type: string
                    sender_name?: string | null
                    message: string
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    ticket_id?: string
                    sender_type?: string
                    sender_name?: string | null
                    message?: string
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "ticket_replies_ticket_id_fkey"
                        columns: ["ticket_id"]
                        isOneToOne: false
                        referencedRelation: "support_tickets"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
