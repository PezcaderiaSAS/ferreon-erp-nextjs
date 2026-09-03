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
      alquiler_detalles: {
        Row: {
          alquiler_id: number
          cantidad: number
          cantidad_devuelta: number
          costo_dano: number
          created_at: string
          devuelto: boolean
          dias_contratados: number
          empresa_id: string | null
          equipo_id: number
          fecha_fin: string | null
          fecha_inicio: string
          id: number
          subtotal_linea: number
          tarifa_aplicada: number
        }
        Insert: {
          alquiler_id: number
          cantidad: number
          cantidad_devuelta?: number
          costo_dano?: number
          created_at?: string
          devuelto?: boolean
          dias_contratados: number
          empresa_id?: string | null
          equipo_id: number
          fecha_fin?: string | null
          fecha_inicio: string
          id?: number
          subtotal_linea: number
          tarifa_aplicada: number
        }
        Update: {
          alquiler_id?: number
          cantidad?: number
          cantidad_devuelta?: number
          costo_dano?: number
          created_at?: string
          devuelto?: boolean
          dias_contratados?: number
          empresa_id?: string | null
          equipo_id?: number
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          subtotal_linea?: number
          tarifa_aplicada?: number
        }
        Relationships: [
          {
            foreignKeyName: "alquiler_detalles_alquiler_id_fkey"
            columns: ["alquiler_id"]
            isOneToOne: false
            referencedRelation: "alquileres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alquiler_detalles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alquiler_detalles_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      alquileres: {
        Row: {
          cliente_id: number
          consecutivo: number
          creado_por: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deposito: number
          detalles_logistica: string | null
          empresa_id: string | null
          estado: string
          flete_entrega: number
          flete_recogida: number
          garantia_estado: string
          garantia_monto: number
          garantia_tipo: string
          id: number
          observaciones: string | null
          saldo_pendiente: number
          subtotal_equipos: number
          subtotal_general: number
          total: number
          total_pagado: number
          updated_at: string
        }
        Insert: {
          cliente_id: number
          consecutivo?: number
          creado_por?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deposito?: number
          detalles_logistica?: string | null
          empresa_id?: string | null
          estado?: string
          flete_entrega?: number
          flete_recogida?: number
          garantia_estado?: string
          garantia_monto?: number
          garantia_tipo?: string
          id?: number
          observaciones?: string | null
          saldo_pendiente?: number
          subtotal_equipos?: number
          subtotal_general?: number
          total?: number
          total_pagado?: number
          updated_at?: string
        }
        Update: {
          cliente_id?: number
          consecutivo?: number
          creado_por?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deposito?: number
          detalles_logistica?: string | null
          empresa_id?: string | null
          estado?: string
          flete_entrega?: number
          flete_recogida?: number
          garantia_estado?: string
          garantia_monto?: number
          garantia_tipo?: string
          id?: number
          observaciones?: string | null
          saldo_pendiente?: number
          subtotal_equipos?: number
          subtotal_general?: number
          total?: number
          total_pagado?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alquileres_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alquileres_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          direccion: string | null
          email: string | null
          empresa_id: string | null
          estado: string
          id: number
          nit_cedula: string
          nombre: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          direccion?: string | null
          email?: string | null
          empresa_id?: string | null
          estado?: string
          id?: number
          nit_cedula: string
          nombre: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          direccion?: string | null
          email?: string | null
          empresa_id?: string | null
          estado?: string
          id?: number
          nit_cedula?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_usuarios: {
        Row: {
          created_at: string
          deleted_at: string | null
          empresa_id: string
          es_empresa_activa: boolean
          estado: string
          id: number
          rol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          empresa_id: string
          es_empresa_activa?: boolean
          estado?: string
          id?: number
          rol?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          empresa_id?: string
          es_empresa_activa?: boolean
          estado?: string
          id?: number
          rol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          configuracion: Json | null
          created_at: string
          deleted_at: string | null
          id: string
          nit: string | null
          nombre: string
          plan_id: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          configuracion?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          nit?: string | null
          nombre: string
          plan_id?: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          configuracion?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          nit?: string | null
          nombre?: string
          plan_id?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipos: {
        Row: {
          categoria: string
          codigo: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          empresa_id: string | null
          estado: string
          id: number
          nombre: string
          stock_disponible: number
          stock_en_obra: number
          stock_mantenimiento: number
          stock_total: number
          tarifa_diaria: number
          updated_at: string
        }
        Insert: {
          categoria: string
          codigo: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          estado?: string
          id?: number
          nombre: string
          stock_disponible: number
          stock_en_obra: number
          stock_mantenimiento?: number
          stock_total: number
          tarifa_diaria: number
          updated_at?: string
        }
        Update: {
          categoria?: string
          codigo?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          estado?: string
          id?: number
          nombre?: string
          stock_disponible?: number
          stock_en_obra?: number
          stock_mantenimiento?: number
          stock_total?: number
          tarifa_diaria?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas: {
        Row: {
          alquiler_id: number
          cliente_id: number
          costos_dano: number
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deposito_aplicado: number
          empresa_id: string | null
          estado_pago: string
          id: number
          numero_consecutivo: number
          observaciones: string | null
          subtotal: number
          tipo_documento: string
          total_pagar: number
          updated_at: string
        }
        Insert: {
          alquiler_id: number
          cliente_id: number
          costos_dano?: number
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deposito_aplicado?: number
          empresa_id?: string | null
          estado_pago?: string
          id?: number
          numero_consecutivo?: number
          observaciones?: string | null
          subtotal: number
          tipo_documento?: string
          total_pagar: number
          updated_at?: string
        }
        Update: {
          alquiler_id?: number
          cliente_id?: number
          costos_dano?: number
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deposito_aplicado?: number
          empresa_id?: string | null
          estado_pago?: string
          id?: number
          numero_consecutivo?: number
          observaciones?: string | null
          subtotal?: number
          tipo_documento?: string
          total_pagar?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facturas_alquiler_id_fkey"
            columns: ["alquiler_id"]
            isOneToOne: false
            referencedRelation: "alquileres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_logs: {
        Row: {
          action_type: string
          created_at: string | null
          empresa_id: string | null
          idempotency_key: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          empresa_id?: string | null
          idempotency_key: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          empresa_id?: string | null
          idempotency_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          alquiler_id: number
          cliente_id: number
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          empresa_id: string | null
          fecha: string
          id: number
          metodo_pago: string
          monto: number
          referencia: string | null
          registrado_por: string | null
        }
        Insert: {
          alquiler_id: number
          cliente_id: number
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          fecha?: string
          id?: number
          metodo_pago: string
          monto: number
          referencia?: string | null
          registrado_por?: string | null
        }
        Update: {
          alquiler_id?: number
          cliente_id?: number
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          fecha?: string
          id?: number
          metodo_pago?: string
          monto?: number
          referencia?: string | null
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_alquiler_id_fkey"
            columns: ["alquiler_id"]
            isOneToOne: false
            referencedRelation: "alquileres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ajustar_stock_equipo: {
        Args: { p_delta: number; p_equipo_id: number }
        Returns: Json
      }
      crear_alquiler_transaccional: { Args: { p_payload: Json }; Returns: Json }
      get_current_tenant_id: { Args: never; Returns: string }
      procesar_devolucion_alquiler: { Args: { p_payload: Json }; Returns: Json }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

