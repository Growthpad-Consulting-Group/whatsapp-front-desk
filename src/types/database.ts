export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          end_at: string
          google_event_id: string | null
          id: string
          notes: string | null
          payment_status: string
          service_id: string
          source: string
          staff_id: string | null
          start_at: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          end_at: string
          google_event_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          service_id: string
          source?: string
          staff_id?: string | null
          start_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          end_at?: string
          google_event_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          service_id?: string
          source?: string
          staff_id?: string | null
          start_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          business_id: string
          created_at: string
          details: Json
          event: string
          id: string
          reference_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          details?: Json
          event: string
          id?: string
          reference_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          details?: Json
          event?: string
          id?: string
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          billing_plan: string
          cancellation_hours: number
          created_at: string
          currency: string
          deposit_default_percent: number | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          timezone: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          billing_plan?: string
          cancellation_hours?: number
          created_at?: string
          currency?: string
          deposit_default_percent?: number | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          timezone?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          billing_plan?: string
          cancellation_hours?: number
          created_at?: string
          currency?: string
          deposit_default_percent?: number | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          timezone?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      conversation_sessions: {
        Row: {          business_id: string
          context: Json
          customer_phone: string
          expires_at: string
          id: string
          state: string
          updated_at: string
        }
        Insert: {
          business_id: string
          context?: Json
          customer_phone: string
          expires_at?: string
          id?: string
          state?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          context?: Json
          customer_phone?: string
          expires_at?: string
          id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          business_id: string
          consent_given: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          business_id: string
          consent_given?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          business_id?: string
          consent_given?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          amount_paid: number
          appointment_id: string | null
          business_id: string
          created_at: string
          currency: string
          customer_id: string
          due_date: string
          id: string
          invoice_number: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          amount_paid?: number
          appointment_id?: string | null
          business_id: string
          created_at?: string
          currency?: string
          customer_id: string
          due_date: string
          id?: string
          invoice_number: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_paid?: number
          appointment_id?: string | null
          business_id?: string
          created_at?: string
          currency?: string
          customer_id?: string
          due_date?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          business_id: string
          channel: string
          content_summary: string
          customer_id: string | null
          direction: string
          id: string
          provider_message_id: string | null
          status: string
          timestamp: string
        }
        Insert: {
          business_id: string
          channel?: string
          content_summary: string
          customer_id?: string | null
          direction: string
          id?: string
          provider_message_id?: string | null
          status?: string
          timestamp?: string
        }
        Update: {
          business_id?: string
          channel?: string
          content_summary?: string
          customer_id?: string | null
          direction?: string
          id?: string
          provider_message_id?: string | null
          status?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          approval_status: string
          body: string
          business_id: string
          id: string
          language: string
          type: string
        }
        Insert: {
          approval_status?: string
          body: string
          business_id: string
          id?: string
          language?: string
          type: string
        }
        Update: {
          approval_status?: string
          body?: string
          business_id?: string
          id?: string
          language?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_hours: {
        Row: {
          business_id: string
          close_time: string | null
          day_of_week: number
          id: string
          is_closed: boolean
          open_time: string | null
        }
        Insert: {
          business_id: string
          close_time?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
        }
        Update: {
          business_id?: string
          close_time?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operating_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount: number
          appointment_id: string | null
          business_id: string
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          link: string
          provider: string
          status: string
          webhook_reference: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          business_id: string
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          link: string
          provider?: string
          status?: string
          webhook_reference?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          business_id?: string
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          link?: string
          provider?: string
          status?: string
          webhook_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_rules: {
        Row: {
          active: boolean
          business_id: string
          channel: string
          id: string
          template_id: string | null
          timing_minutes: number | null
          trigger: string
        }
        Insert: {
          active?: boolean
          business_id: string
          channel?: string
          id?: string
          template_id?: string | null
          timing_minutes?: number | null
          trigger: string
        }
        Update: {
          active?: boolean
          business_id?: string
          channel?: string
          id?: string
          template_id?: string | null
          timing_minutes?: number | null
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_sent_log: {
        Row: {
          business_id: string
          id: string
          reference_id: string
          sent_at: string
          trigger: string
        }
        Insert: {
          business_id: string
          id?: string
          reference_id: string
          sent_at?: string
          trigger: string
        }
        Update: {
          business_id?: string
          id?: string
          reference_id?: string
          sent_at?: string
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_sent_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          buffer_after_minutes: number
          buffer_before_minutes: number
          business_id: string
          created_at: string
          deposit_amount: number | null
          deposit_required: boolean
          description: string | null
          duration_minutes: number
          id: string
          name: string
          price: number
          staff_id: string | null
        }
        Insert: {
          active?: boolean
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          business_id: string
          created_at?: string
          deposit_amount?: number | null
          deposit_required?: boolean
          description?: string | null
          duration_minutes: number
          id?: string
          name: string
          price: number
          staff_id?: string | null
        }
        Update: {
          active?: boolean
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          business_id?: string
          created_at?: string
          deposit_amount?: number | null
          deposit_required?: boolean
          description?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          price?: number
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          active: boolean
          business_id: string
          calendar_connected: boolean
          created_at: string
          email: string
          google_access_token: string | null
          google_refresh_token: string | null
          google_token_expires_at: string | null
          id: string
          name: string
          phone: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          business_id: string
          calendar_connected?: boolean
          created_at?: string
          email: string
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id?: string
          name: string
          phone?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          business_id?: string
          calendar_connected?: boolean
          created_at?: string
          email?: string
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: {
        Args: { p_business_id: string }
        Returns: string
      }
      my_business_id: { Args: never; Returns: string }
      seed_business_defaults: {
        Args: { p_business_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
