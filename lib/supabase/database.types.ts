export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      incident_documents: {
        Row: {
          content_json: Json;
          id: string;
          incident_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          content_json?: Json;
          id?: string;
          incident_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          content_json?: Json;
          id?: string;
          incident_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "incident_documents_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: true;
            referencedRelation: "incidents";
            referencedColumns: ["id"];
          },
        ];
      };
      incidents: {
        Row: {
          created_at: string;
          id: string;
          impact: string | null;
          reporter_id: string;
          resolved_at: string | null;
          severity: Database["public"]["Enums"]["incident_severity"];
          started_at: string;
          status: Database["public"]["Enums"]["incident_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          impact?: string | null;
          reporter_id: string;
          resolved_at?: string | null;
          severity: Database["public"]["Enums"]["incident_severity"];
          started_at?: string;
          status?: Database["public"]["Enums"]["incident_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          impact?: string | null;
          reporter_id?: string;
          resolved_at?: string | null;
          severity?: Database["public"]["Enums"]["incident_severity"];
          started_at?: string;
          status?: Database["public"]["Enums"]["incident_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          created_at: string;
          github_username: string | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          github_username?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          github_username?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      incident_severity: "low" | "medium" | "high" | "critical";
      incident_status: "open" | "in_progress" | "resolved";
      user_role: "user" | "operator" | "admin";
    };
    CompositeTypes: Record<string, never>;
  };
};
