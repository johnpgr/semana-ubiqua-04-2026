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
      audit_logs: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: number
          metadata: Json | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: number
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      consents: {
        Row: {
          granted_at: string
          id: string
          ip_address: unknown
          request_id: string
          scopes: Database["public"]["Enums"]["consent_scope"][]
          user_agent: string | null
        }
        Insert: {
          granted_at?: string
          id?: string
          ip_address?: unknown
          request_id: string
          scopes: Database["public"]["Enums"]["consent_scope"][]
          user_agent?: string | null
        }
        Update: {
          granted_at?: string
          id?: string
          ip_address?: unknown
          request_id?: string
          scopes?: Database["public"]["Enums"]["consent_scope"][]
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "credit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_requests: {
        Row: {
          approved_amount: number | null
          created_at: string
          decided_at: string | null
          decision: Database["public"]["Enums"]["credit_decision"] | null
          id: string
          requested_amount: number
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          approved_amount?: number | null
          created_at?: string
          decided_at?: string | null
          decision?: Database["public"]["Enums"]["credit_decision"] | null
          id?: string
          requested_amount: number
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Update: {
          approved_amount?: number | null
          created_at?: string
          decided_at?: string | null
          decision?: Database["public"]["Enums"]["credit_decision"] | null
          id?: string
          requested_amount?: number
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          file_name: string
          id: string
          mime_type: string
          request_id: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          id?: string
          mime_type: string
          request_id: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          id?: string
          mime_type?: string
          request_id?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "credit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cpf: string
          created_at: string
          id: string
          mock_profile: Database["public"]["Enums"]["mock_profile"]
          name: string
        }
        Insert: {
          cpf: string
          created_at?: string
          id?: string
          mock_profile: Database["public"]["Enums"]["mock_profile"]
          name: string
        }
        Update: {
          cpf?: string
          created_at?: string
          id?: string
          mock_profile?: Database["public"]["Enums"]["mock_profile"]
          name?: string
        }
        Relationships: []
      }
      scores: {
        Row: {
          behavior: number
          capacity: number
          created_at: string
          data_quality: number
          id: string
          reasons: string[]
          regularity: number
          request_id: string
          stability: number
          suggested_limit: number
          value: number
        }
        Insert: {
          behavior: number
          capacity: number
          created_at?: string
          data_quality: number
          id?: string
          reasons: string[]
          regularity: number
          request_id: string
          stability: number
          suggested_limit: number
          value: number
        }
        Update: {
          behavior?: number
          capacity?: number
          created_at?: string
          data_quality?: number
          id?: string
          reasons?: string[]
          regularity?: number
          request_id?: string
          stability?: number
          suggested_limit?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "scores_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "credit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          description: string
          id: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          occurred_at: string
          request_id: string
          source: Database["public"]["Enums"]["transaction_source"]
        }
        Insert: {
          amount: number
          category: string
          description: string
          id?: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          occurred_at: string
          request_id: string
          source: Database["public"]["Enums"]["transaction_source"]
        }
        Update: {
          amount?: number
          category?: string
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["transaction_kind"]
          occurred_at?: string
          request_id?: string
          source?: Database["public"]["Enums"]["transaction_source"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "credit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      consent_scope: "salary" | "investments" | "cards"
      credit_decision:
        | "approved"
        | "approved_reduced"
        | "further_review"
        | "denied"
      mock_profile:
        | "motorista_consistente"
        | "perfil_forte"
        | "autonomo_irregular"
        | "fluxo_instavel"
        | "historico_insuficiente"
      request_status:
        | "awaiting_consent"
        | "collecting_data"
        | "scoring"
        | "decided"
      transaction_kind: "credit" | "debit"
      transaction_source: "open_finance_mock" | "uploaded_document"
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
      consent_scope: ["salary", "investments", "cards"],
      credit_decision: [
        "approved",
        "approved_reduced",
        "further_review",
        "denied",
      ],
      mock_profile: [
        "motorista_consistente",
        "perfil_forte",
        "autonomo_irregular",
        "fluxo_instavel",
        "historico_insuficiente",
      ],
      request_status: [
        "awaiting_consent",
        "collecting_data",
        "scoring",
        "decided",
      ],
      transaction_kind: ["credit", "debit"],
      transaction_source: ["open_finance_mock", "uploaded_document"],
    },
  },
} as const
