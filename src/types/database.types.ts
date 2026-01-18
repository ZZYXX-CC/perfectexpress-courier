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
