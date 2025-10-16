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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_type?: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          department: string
          email: string
          hourly_rate: number | null
          id: string
          is_admin: boolean
          name: string
          pay_scale_type: Database["public"]["Enums"]["pay_scale_type"]
          phone: string | null
          position: string
          project_rate_1_member: number | null
          project_rate_2_members: number | null
          project_rate_3_members: number | null
          project_rate_4_members: number | null
          project_rate_5_members: number | null
          status: Database["public"]["Enums"]["employee_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          email: string
          hourly_rate?: number | null
          id?: string
          is_admin?: boolean
          name: string
          pay_scale_type: Database["public"]["Enums"]["pay_scale_type"]
          phone?: string | null
          position: string
          project_rate_1_member?: number | null
          project_rate_2_members?: number | null
          project_rate_3_members?: number | null
          project_rate_4_members?: number | null
          project_rate_5_members?: number | null
          status?: Database["public"]["Enums"]["employee_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          email?: string
          hourly_rate?: number | null
          id?: string
          is_admin?: boolean
          name?: string
          pay_scale_type?: Database["public"]["Enums"]["pay_scale_type"]
          phone?: string | null
          position?: string
          project_rate_1_member?: number | null
          project_rate_2_members?: number | null
          project_rate_3_members?: number | null
          project_rate_4_members?: number | null
          project_rate_5_members?: number | null
          status?: Database["public"]["Enums"]["employee_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          created_at: string
          document_id: string
          id: string
          id_verification_results: Json | null
          ocr_data: Json | null
          submission_date: string
          total_documents_count: number | null
          updated_at: string
          user_id: string
          validation_results: Json | null
          validation_status: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          id_verification_results?: Json | null
          ocr_data?: Json | null
          submission_date?: string
          total_documents_count?: number | null
          updated_at?: string
          user_id: string
          validation_results?: Json | null
          validation_status?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          id_verification_results?: Json | null
          ocr_data?: Json | null
          submission_date?: string
          total_documents_count?: number | null
          updated_at?: string
          user_id?: string
          validation_results?: Json | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "scanned_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          assigned_member_id: string | null
          assigned_member_name: string | null
          calculation_type: string
          clock_in_time: string | null
          clock_out_time: string | null
          collaborators_count: number | null
          created_at: string
          edit_reason: string | null
          employee_id: string
          employee_name: string
          hours_worked: number | null
          id: string
          is_edited: boolean | null
          is_first_time: boolean | null
          project_title: string | null
          project_value: number | null
          quoted_by_id: string | null
          quoted_by_name: string | null
          rate: number
          source: string
          updated_at: string
        }
        Insert: {
          amount: number
          assigned_member_id?: string | null
          assigned_member_name?: string | null
          calculation_type: string
          clock_in_time?: string | null
          clock_out_time?: string | null
          collaborators_count?: number | null
          created_at?: string
          edit_reason?: string | null
          employee_id: string
          employee_name: string
          hours_worked?: number | null
          id?: string
          is_edited?: boolean | null
          is_first_time?: boolean | null
          project_title?: string | null
          project_value?: number | null
          quoted_by_id?: string | null
          quoted_by_name?: string | null
          rate: number
          source?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          assigned_member_id?: string | null
          assigned_member_name?: string | null
          calculation_type?: string
          clock_in_time?: string | null
          clock_out_time?: string | null
          collaborators_count?: number | null
          created_at?: string
          edit_reason?: string | null
          employee_id?: string
          employee_name?: string
          hours_worked?: number | null
          id?: string
          is_edited?: boolean | null
          is_first_time?: boolean | null
          project_title?: string | null
          project_value?: number | null
          quoted_by_id?: string | null
          quoted_by_name?: string | null
          rate?: number
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      scanned_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          page_number: number | null
          processing_status: string
          scan_date: string
          submission_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          page_number?: number | null
          processing_status?: string
          scan_date?: string
          submission_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          page_number?: number | null
          processing_status?: string
          scan_date?: string
          submission_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          check_in_time: string
          check_out_time: string | null
          created_at: string
          employee_id: string
          employee_name: string
          id: string
          notes: string | null
          status: string
          timezone_offset: number | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          check_in_time: string
          check_out_time?: string | null
          created_at?: string
          employee_id: string
          employee_name: string
          id?: string
          notes?: string | null
          status?: string
          timezone_offset?: number | null
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          employee_id?: string
          employee_name?: string
          id?: string
          notes?: string | null
          status?: string
          timezone_offset?: number | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          user_timezone: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          user_timezone?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          user_timezone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      employee_status: "active" | "inactive" | "on_leave"
      pay_scale_type: "hourly" | "project"
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
    Enums: {
      employee_status: ["active", "inactive", "on_leave"],
      pay_scale_type: ["hourly", "project"],
    },
  },
} as const
