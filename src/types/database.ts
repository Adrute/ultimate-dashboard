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
      dashboard_layouts: {
        Row: {
          created_at: string;
          id: string;
          is_default: boolean;
          name: string;
          owner_user_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name: string;
          owner_user_id: string;
          updated_at?: string;
        };
        Update: Record<never, never>;
        Relationships: [];
      };
      dashboard_widgets: {
        Row: {
          created_at: string;
          id: string;
          layout_id: string;
          position: number;
          size: Database["public"]["Enums"]["dashboard_widget_size"];
          space_id: string;
          title: string;
          updated_at: string;
          widget_type: "placeholder";
        };
        Insert: {
          created_at?: string;
          id?: string;
          layout_id: string;
          position: number;
          size?: Database["public"]["Enums"]["dashboard_widget_size"];
          space_id: string;
          title: string;
          updated_at?: string;
          widget_type?: "placeholder";
        };
        Update: {
          position?: number;
          size?: Database["public"]["Enums"]["dashboard_widget_size"];
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dashboard_widgets_layout_id_fkey";
            columns: ["layout_id"];
            isOneToOne: false;
            referencedRelation: "dashboard_layouts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dashboard_widgets_space_id_fkey";
            columns: ["space_id"];
            isOneToOne: false;
            referencedRelation: "spaces";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          body: string;
          content: Json;
          created_at: string;
          created_by: string | null;
          id: string;
          parent_note_id: string | null;
          space_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          body?: string;
          content?: Json;
          created_at?: string;
          created_by: string;
          id?: string;
          parent_note_id?: string | null;
          space_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          content?: Json;
          parent_note_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_space_id_fkey";
            columns: ["space_id"];
            isOneToOne: false;
            referencedRelation: "spaces";
            referencedColumns: ["id"];
          },
        ];
      };
      note_versions: {
        Row: {
          body: string;
          content: Json;
          created_at: string;
          created_by: string | null;
          id: string;
          note_id: string;
          parent_note_id: string | null;
          space_id: string;
          title: string;
          version_number: number;
        };
        Insert: {
          body: string;
          content?: Json;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note_id: string;
          parent_note_id?: string | null;
          space_id: string;
          title: string;
          version_number: number;
        };
        Update: Record<never, never>;
        Relationships: [
          {
            foreignKeyName: "note_versions_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_versions_space_id_fkey";
            columns: ["space_id"];
            isOneToOne: false;
            referencedRelation: "spaces";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          name: string;
          progress: number;
          space_id: string;
          start_date: string | null;
          status: Database["public"]["Enums"]["project_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          name: string;
          progress?: number;
          space_id: string;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          updated_at?: string;
        };
        Update: {
          description?: string | null;
          due_date?: string | null;
          name?: string;
          progress?: number;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
        };
        Relationships: [
          {
            foreignKeyName: "projects_space_id_fkey";
            columns: ["space_id"];
            isOneToOne: false;
            referencedRelation: "spaces";
            referencedColumns: ["id"];
          },
        ];
      };
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
      tasks: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          priority: Database["public"]["Enums"]["task_priority"];
          project_id: string | null;
          parent_task_id: string | null;
          space_id: string;
          status: Database["public"]["Enums"]["task_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          priority?: Database["public"]["Enums"]["task_priority"];
          project_id?: string | null;
          parent_task_id?: string | null;
          space_id: string;
          status?: Database["public"]["Enums"]["task_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          description?: string | null;
          due_date?: string | null;
          priority?: Database["public"]["Enums"]["task_priority"];
          project_id?: string | null;
          parent_task_id?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_space_id_fkey";
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
    Functions: {
      move_dashboard_widget: {
        Args: {
          move_direction: string;
          target_widget_id: string;
        };
        Returns: boolean;
      };
      search_tasks: {
        Args: {
          search_query: string;
        };
        Returns: Database["public"]["Tables"]["tasks"]["Row"][];
      };
    };
    Enums: {
      dashboard_widget_size: "small" | "medium" | "large";
      project_status: "planned" | "active" | "on_hold" | "completed";
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
      task_priority: "none" | "low" | "medium" | "high";
      task_status: "todo" | "in_progress" | "done";
    };
    CompositeTypes: Record<never, never>;
  };
};
