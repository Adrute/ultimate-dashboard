export type Json =
  | boolean
  | number
  | string
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      space_members: {
        Row: {
          created_at: string;
          role: Database["public"]["Enums"]["space_role"];
          space_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role: Database["public"]["Enums"]["space_role"];
          space_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          role?: Database["public"]["Enums"]["space_role"];
        };
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey";
            columns: ["space_id"];
            isOneToOne: false;
            referencedRelation: "spaces";
            referencedColumns: ["id"];
          },
        ];
      };
      space_modules: {
        Row: {
          created_at: string;
          enabled: boolean;
          module_key: Database["public"]["Enums"]["space_module_key"];
          space_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          module_key: Database["public"]["Enums"]["space_module_key"];
          space_id: string;
          updated_at?: string;
        };
        Update: {
          enabled?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "space_modules_space_id_fkey";
            columns: ["space_id"];
            isOneToOne: false;
            referencedRelation: "spaces";
            referencedColumns: ["id"];
          },
        ];
      };
      spaces: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          kind: Database["public"]["Enums"]["space_kind"];
          name: string;
          owner_user_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["space_kind"];
          name: string;
          owner_user_id?: string | null;
          updated_at?: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      space_kind: "personal" | "shared";
      space_module_key:
        | "dashboard"
        | "calendar"
        | "tasks"
        | "notes"
        | "health"
        | "fitness"
        | "entertainment"
        | "shopping"
        | "habits"
        | "renewals"
        | "projects"
        | "recipes";
      space_role: "admin" | "editor" | "viewer";
    };
    CompositeTypes: Record<never, never>;
  };
};
