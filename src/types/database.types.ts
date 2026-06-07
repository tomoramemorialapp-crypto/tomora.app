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
      accounts: {
        Row: {
          avatar_url: string | null
          created_at: string
          deletion_requested_at: string | null
          deletion_scheduled_for: string | null
          display_name: string
          id: string
          invite_code: string | null
          language: string
          preferences: Json
          social_links: Json
          status: string
          theme_preference: string
          updated_at: string
          username: string | null
          username_changes: string[]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          display_name: string
          id: string
          invite_code?: string | null
          language?: string
          preferences?: Json
          social_links?: Json
          status?: string
          theme_preference?: string
          updated_at?: string
          username?: string | null
          username_changes?: string[]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          display_name?: string
          id?: string
          invite_code?: string | null
          language?: string
          preferences?: Json
          social_links?: Json
          status?: string
          theme_preference?: string
          updated_at?: string
          username?: string | null
          username_changes?: string[]
        }
        Relationships: []
      }
      family_trees: {
        Row: {
          created_at: string
          created_by_account_id: string
          default_visibility: string
          id: string
          name: string
          public_sharing_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_account_id: string
          default_visibility?: string
          id?: string
          name: string
          public_sharing_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_account_id?: string
          default_visibility?: string
          id?: string
          name?: string
          public_sharing_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_trees_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      memorial_requests: {
        Row: {
          created_at: string
          death_date: string | null
          family_tree_id: string
          id: string
          node_id: string
          reason: string | null
          requested_by_account_id: string
          resolve_after: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          death_date?: string | null
          family_tree_id: string
          id?: string
          node_id: string
          reason?: string | null
          requested_by_account_id: string
          resolve_after?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          death_date?: string | null
          family_tree_id?: string
          id?: string
          node_id?: string
          reason?: string | null
          requested_by_account_id?: string
          resolve_after?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorial_requests_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorial_requests_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      memorial_votes: {
        Row: {
          account_id: string
          created_at: string
          family_tree_id: string
          id: string
          request_id: string
          vote: string
        }
        Insert: {
          account_id: string
          created_at?: string
          family_tree_id: string
          id?: string
          request_id: string
          vote: string
        }
        Update: {
          account_id?: string
          created_at?: string
          family_tree_id?: string
          id?: string
          request_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorial_votes_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorial_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "memorial_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          approval_status: string
          body: string | null
          caption: string | null
          created_at: string
          created_by_account_id: string
          family_tree_id: string
          id: string
          media: Json
          media_mime: string | null
          media_size_bytes: number | null
          media_url: string | null
          node_id: string | null
          occasion_id: string | null
          storage_path: string | null
          tagged_node_ids: string[]
          title: string | null
          type: string
          updated_at: string
          visibility: string
        }
        Insert: {
          approval_status?: string
          body?: string | null
          caption?: string | null
          created_at?: string
          created_by_account_id: string
          family_tree_id: string
          id?: string
          media?: Json
          media_mime?: string | null
          media_size_bytes?: number | null
          media_url?: string | null
          node_id?: string | null
          occasion_id?: string | null
          storage_path?: string | null
          tagged_node_ids?: string[]
          title?: string | null
          type?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          approval_status?: string
          body?: string | null
          caption?: string | null
          created_at?: string
          created_by_account_id?: string
          family_tree_id?: string
          id?: string
          media?: Json
          media_mime?: string | null
          media_size_bytes?: number | null
          media_url?: string | null
          node_id?: string | null
          occasion_id?: string | null
          storage_path?: string | null
          tagged_node_ids?: string[]
          title?: string | null
          type?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      node_change_log: {
        Row: {
          action: string
          created_at: string
          family_tree_id: string
          field_key: string | null
          id: string
          new_value: Json | null
          node_id: string
          note: string | null
          performed_by_account_id: string
          previous_value: Json | null
        }
        Insert: {
          action: string
          created_at?: string
          family_tree_id: string
          field_key?: string | null
          id?: string
          new_value?: Json | null
          node_id: string
          note?: string | null
          performed_by_account_id: string
          previous_value?: Json | null
        }
        Update: {
          action?: string
          created_at?: string
          family_tree_id?: string
          field_key?: string | null
          id?: string
          new_value?: Json | null
          node_id?: string
          note?: string | null
          performed_by_account_id?: string
          previous_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "node_change_log_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_change_log_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_change_log_performed_by_account_id_fkey"
            columns: ["performed_by_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      nodes: {
        Row: {
          alternate_names: string[]
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          claim_password: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          death_date: string | null
          default_visibility: string
          display_name: string
          family_tree_id: string
          id: string
          invite_code: string | null
          invite_expires_at: string | null
          invite_failed_attempts: number
          invite_locked_at: string | null
          invite_used_at: string | null
          invite_used_by_account_id: string | null
          invited_by_account_id: string | null
          is_living: boolean | null
          legal_name: string | null
          managed_by_account_id: string | null
          memorial_banner_url: string | null
          memorial_bio: string | null
          memorial_link_label: string | null
          memorial_link_url: string | null
          memorial_password: string | null
          memorial_privacy: string
          memorial_title: string | null
          owner_account_id: string | null
          profile: Json
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          alternate_names?: string[]
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          claim_password?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          death_date?: string | null
          default_visibility?: string
          display_name: string
          family_tree_id: string
          id?: string
          invite_code?: string | null
          invite_expires_at?: string | null
          invite_failed_attempts?: number
          invite_locked_at?: string | null
          invite_used_at?: string | null
          invite_used_by_account_id?: string | null
          invited_by_account_id?: string | null
          is_living?: boolean | null
          legal_name?: string | null
          managed_by_account_id?: string | null
          memorial_banner_url?: string | null
          memorial_bio?: string | null
          memorial_link_label?: string | null
          memorial_link_url?: string | null
          memorial_password?: string | null
          memorial_privacy?: string
          memorial_title?: string | null
          owner_account_id?: string | null
          profile?: Json
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          alternate_names?: string[]
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          claim_password?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          death_date?: string | null
          default_visibility?: string
          display_name?: string
          family_tree_id?: string
          id?: string
          invite_code?: string | null
          invite_expires_at?: string | null
          invite_failed_attempts?: number
          invite_locked_at?: string | null
          invite_used_at?: string | null
          invite_used_by_account_id?: string | null
          invited_by_account_id?: string | null
          is_living?: boolean | null
          legal_name?: string | null
          managed_by_account_id?: string | null
          memorial_banner_url?: string | null
          memorial_bio?: string | null
          memorial_link_label?: string | null
          memorial_link_url?: string | null
          memorial_password?: string | null
          memorial_privacy?: string
          memorial_title?: string | null
          owner_account_id?: string | null
          profile?: Json
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nodes_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_managed_by_account_id_fkey"
            columns: ["managed_by_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_owner_account_id_fkey"
            columns: ["owner_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_account_id: string | null
          body: string | null
          created_at: string
          data: Json
          family_tree_id: string
          id: string
          is_read: boolean
          node_id: string | null
          recipient_account_id: string
          title: string
          type: string
        }
        Insert: {
          actor_account_id?: string | null
          body?: string | null
          created_at?: string
          data?: Json
          family_tree_id: string
          id?: string
          is_read?: boolean
          node_id?: string | null
          recipient_account_id: string
          title: string
          type: string
        }
        Update: {
          actor_account_id?: string | null
          body?: string | null
          created_at?: string
          data?: Json
          family_tree_id?: string
          id?: string
          is_read?: boolean
          node_id?: string | null
          recipient_account_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          created_at: string
          created_by_account_id: string
          family_tree_id: string
          from_node_id: string
          id: string
          relationship_detail: string | null
          relationship_type: string
          status: string
          to_node_id: string
          updated_at: string
          visibility: string
          wedding_date: string | null
        }
        Insert: {
          created_at?: string
          created_by_account_id: string
          family_tree_id: string
          from_node_id: string
          id?: string
          relationship_detail?: string | null
          relationship_type: string
          status?: string
          to_node_id: string
          updated_at?: string
          visibility?: string
          wedding_date?: string | null
        }
        Update: {
          created_at?: string
          created_by_account_id?: string
          family_tree_id?: string
          from_node_id?: string
          id?: string
          relationship_detail?: string | null
          relationship_type?: string
          status?: string
          to_node_id?: string
          updated_at?: string
          visibility?: string
          wedding_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relationships_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      suggested_edits: {
        Row: {
          created_at: string
          current_value_snapshot: Json | null
          family_tree_id: string
          field_key: string
          id: string
          reason: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by_account_id: string | null
          status: string
          suggested_by_account_id: string
          suggested_value: Json | null
          target_node_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value_snapshot?: Json | null
          family_tree_id: string
          field_key: string
          id?: string
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by_account_id?: string | null
          status?: string
          suggested_by_account_id: string
          suggested_value?: Json | null
          target_node_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value_snapshot?: Json | null
          family_tree_id?: string
          field_key?: string
          id?: string
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by_account_id?: string | null
          status?: string
          suggested_by_account_id?: string
          suggested_value?: Json | null
          target_node_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggested_edits_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_edits_reviewed_by_account_id_fkey"
            columns: ["reviewed_by_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_edits_suggested_by_account_id_fkey"
            columns: ["suggested_by_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_edits_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_memberships: {
        Row: {
          account_id: string
          created_at: string
          family_tree_id: string
          id: string
          role: string
          status: string
        }
        Insert: {
          account_id: string
          created_at?: string
          family_tree_id: string
          id?: string
          role?: string
          status?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          family_tree_id?: string
          id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_memberships_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_memberships_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_node: {
        Args: { p_code: string; p_password?: string }
        Returns: Json
      }
      peek_invite_code: {
        Args: { p_code: string }
        Returns: Json
      }
      request_node_transfer: {
        Args: { p_node_id: string; p_to_email: string }
        Returns: Json
      }
      accept_node_transfer: {
        Args: { p_transfer_id: string }
        Returns: Json
      }
      dispute_memorial: {
        Args: { p_reason?: string; p_request_id: string }
        Returns: Json
      }
      finalize_memorial: { Args: { p_request_id: string }; Returns: Json }
      get_memorial_page: {
        Args: { p_node_id: string; p_password?: string }
        Returns: Json
      }
      get_public_profile: { Args: { p_username: string }; Returns: Json }
      unlock_public_memory: {
        Args: { p_memory_id: string; p_password: string }
        Returns: Json
      }
      set_memory_share_password: {
        Args: { p_memory_id: string; p_password: string }
        Returns: undefined
      }
      public_profile_supports_v2: { Args: Record<PropertyKey, never>; Returns: boolean }
      public_profile_media_access_enabled: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_tree_member: { Args: { p_tree_id: string }; Returns: boolean }
      process_due_account_deletions: { Args: never; Returns: number }
      request_passing: {
        Args: { p_death_date?: string; p_node_id: string; p_reason?: string }
        Returns: Json
      }
      assert_storage_quota: { Args: { p_account_id: string; p_add_bytes: number }; Returns: undefined }
      get_account_storage_bytes: { Args: { p_account_id: string }; Returns: number }
      resolve_login_email: { Args: { p_identifier: string }; Returns: string }
      set_username: {
        Args: { p_username: string }
        Returns: {
          avatar_url: string | null
          created_at: string
          deletion_requested_at: string | null
          deletion_scheduled_for: string | null
          display_name: string
          id: string
          invite_code: string | null
          language: string
          preferences: Json
          social_links: Json
          status: string
          theme_preference: string
          updated_at: string
          username: string | null
          username_changes: string[]
        }
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
