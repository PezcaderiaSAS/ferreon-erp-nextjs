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
          aplica_iva: boolean | null
          aplica_retefuente: boolean | null
          aplica_reteica: boolean | null
          cliente_id: number
          consecutivo: number
          cotizacion_origen_id: string | null
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
          valor_iva: number | null
          valor_retefuente: number | null
          valor_reteica: number | null
          valor_transporte: number | null
        }
        Insert: {
          aplica_iva?: boolean | null
          aplica_retefuente?: boolean | null
          aplica_reteica?: boolean | null
          cliente_id: number
          consecutivo?: number
          cotizacion_origen_id?: string | null
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
          valor_iva?: number | null
          valor_retefuente?: number | null
          valor_reteica?: number | null
          valor_transporte?: number | null
        }
        Update: {
          aplica_iva?: boolean | null
          aplica_retefuente?: boolean | null
          aplica_reteica?: boolean | null
          cliente_id?: number
          consecutivo?: number
          cotizacion_origen_id?: string | null
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
          valor_iva?: number | null
          valor_retefuente?: number | null
          valor_reteica?: number | null
          valor_transporte?: number | null
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
            foreignKeyName: "alquileres_cotizacion_origen_id_fkey"
            columns: ["cotizacion_origen_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
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
      audit_logs: {
        Row: {
          accion: string
          created_at: string
          descripcion: string
          detalles: Json | null
          empresa_id: string | null
          entidad_id: string | null
          id: string
          ip_address: string | null
          modulo: string
          usuario_email: string
          usuario_id: string | null
          usuario_nombre: string
          usuario_rol: string
        }
        Insert: {
          accion: string
          created_at?: string
          descripcion: string
          detalles?: Json | null
          empresa_id?: string | null
          entidad_id?: string | null
          id?: string
          ip_address?: string | null
          modulo: string
          usuario_email?: string
          usuario_id?: string | null
          usuario_nombre?: string
          usuario_rol?: string
        }
        Update: {
          accion?: string
          created_at?: string
          descripcion?: string
          detalles?: Json | null
          empresa_id?: string | null
          entidad_id?: string | null
          id?: string
          ip_address?: string | null
          modulo?: string
          usuario_email?: string
          usuario_id?: string | null
          usuario_nombre?: string
          usuario_rol?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_empresa_id_fkey"
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
      compras: {
        Row: {
          aplica_iva: boolean
          aplica_retefuente: boolean
          aplica_reteica: boolean
          created_at: string | null
          empresa_id: string | null
          estado: string
          fecha_compra: string
          id: string
          impuestos: number
          metodo_pago: string
          neto_pagar: number
          numero_orden: string
          observaciones: string | null
          porcentaje_retefuente: number
          porcentaje_reteica: number
          proveedor_email: string | null
          proveedor_id: string | null
          proveedor_nit: string | null
          proveedor_nombre: string
          proveedor_telefono: string | null
          subtotal: number
          tenant_id: string | null
          total: number
          transaction_id: string | null
          usuario_id: string | null
          valor_iva: number
          valor_retefuente: number
          valor_reteica: number
        }
        Insert: {
          aplica_iva?: boolean
          aplica_retefuente?: boolean
          aplica_reteica?: boolean
          created_at?: string | null
          empresa_id?: string | null
          estado?: string
          fecha_compra?: string
          id?: string
          impuestos?: number
          metodo_pago?: string
          neto_pagar?: number
          numero_orden: string
          observaciones?: string | null
          porcentaje_retefuente?: number
          porcentaje_reteica?: number
          proveedor_email?: string | null
          proveedor_id?: string | null
          proveedor_nit?: string | null
          proveedor_nombre: string
          proveedor_telefono?: string | null
          subtotal?: number
          tenant_id?: string | null
          total?: number
          transaction_id?: string | null
          usuario_id?: string | null
          valor_iva?: number
          valor_retefuente?: number
          valor_reteica?: number
        }
        Update: {
          aplica_iva?: boolean
          aplica_retefuente?: boolean
          aplica_reteica?: boolean
          created_at?: string | null
          empresa_id?: string | null
          estado?: string
          fecha_compra?: string
          id?: string
          impuestos?: number
          metodo_pago?: string
          neto_pagar?: number
          numero_orden?: string
          observaciones?: string | null
          porcentaje_retefuente?: number
          porcentaje_reteica?: number
          proveedor_email?: string | null
          proveedor_id?: string | null
          proveedor_nit?: string | null
          proveedor_nombre?: string
          proveedor_telefono?: string | null
          subtotal?: number
          tenant_id?: string | null
          total?: number
          transaction_id?: string | null
          usuario_id?: string | null
          valor_iva?: number
          valor_retefuente?: number
          valor_reteica?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_detalles: {
        Row: {
          cantidad: number
          compra_id: string
          created_at: string | null
          equipo_id: number
          id: string
          precio_unitario: number
          subtotal: number
        }
        Insert: {
          cantidad: number
          compra_id: string
          created_at?: string | null
          equipo_id: number
          id?: string
          precio_unitario: number
          subtotal: number
        }
        Update: {
          cantidad?: number
          compra_id?: string
          created_at?: string | null
          equipo_id?: number
          id?: string
          precio_unitario?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_detalles_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_detalles_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          alquiler_id: number | null
          aplica_iva: boolean
          aplica_retefuente: boolean
          aplica_reteica: boolean
          cliente_documento: string | null
          cliente_email: string | null
          cliente_id: number | null
          cliente_nombre: string
          cliente_telefono: string | null
          consecutivo: string
          created_at: string
          created_by: string | null
          deposito_garantia: number
          empresa_id: string | null
          estado: string
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          obra_direccion: string | null
          obra_nombre: string | null
          observaciones: string | null
          subtotal: number
          tasa_iva: number
          tasa_retefuente: number
          tasa_reteica: number
          tenant_id: string | null
          total: number
          updated_at: string
          valor_iva: number
          valor_retefuente: number
          valor_reteica: number
          valor_transporte: number
        }
        Insert: {
          alquiler_id?: number | null
          aplica_iva?: boolean
          aplica_retefuente?: boolean
          aplica_reteica?: boolean
          cliente_documento?: string | null
          cliente_email?: string | null
          cliente_id?: number | null
          cliente_nombre: string
          cliente_telefono?: string | null
          consecutivo: string
          created_at?: string
          created_by?: string | null
          deposito_garantia?: number
          empresa_id?: string | null
          estado?: string
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          obra_direccion?: string | null
          obra_nombre?: string | null
          observaciones?: string | null
          subtotal?: number
          tasa_iva?: number
          tasa_retefuente?: number
          tasa_reteica?: number
          tenant_id?: string | null
          total?: number
          updated_at?: string
          valor_iva?: number
          valor_retefuente?: number
          valor_reteica?: number
          valor_transporte?: number
        }
        Update: {
          alquiler_id?: number | null
          aplica_iva?: boolean
          aplica_retefuente?: boolean
          aplica_reteica?: boolean
          cliente_documento?: string | null
          cliente_email?: string | null
          cliente_id?: number | null
          cliente_nombre?: string
          cliente_telefono?: string | null
          consecutivo?: string
          created_at?: string
          created_by?: string | null
          deposito_garantia?: number
          empresa_id?: string | null
          estado?: string
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          obra_direccion?: string | null
          obra_nombre?: string | null
          observaciones?: string | null
          subtotal?: number
          tasa_iva?: number
          tasa_retefuente?: number
          tasa_reteica?: number
          tenant_id?: string | null
          total?: number
          updated_at?: string
          valor_iva?: number
          valor_retefuente?: number
          valor_reteica?: number
          valor_transporte?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_alquiler_id_fkey"
            columns: ["alquiler_id"]
            isOneToOne: false
            referencedRelation: "alquileres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones_detalles: {
        Row: {
          cantidad: number
          cotizacion_id: string
          created_at: string
          dias: number
          equipo_id: number
          id: string
          subtotal: number
          tarifa_diaria: number
        }
        Insert: {
          cantidad: number
          cotizacion_id: string
          created_at?: string
          dias: number
          equipo_id: number
          id?: string
          subtotal?: number
          tarifa_diaria: number
        }
        Update: {
          cantidad?: number
          cotizacion_id?: string
          created_at?: string
          dias?: number
          equipo_id?: number
          id?: string
          subtotal?: number
          tarifa_diaria?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_detalles_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_detalles_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
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
      financial_accounts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_cash_equivalent: boolean | null
          name: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_cash_equivalent?: boolean | null
          name: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_cash_equivalent?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
        }
        Relationships: []
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
      journal_entries: {
        Row: {
          account_id: string
          amount: number
          created_at: string | null
          id: string
          transaction_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string | null
          id?: string
          transaction_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string | null
          id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      kardex_inventario: {
        Row: {
          cantidad_delta: number
          creado_en: string
          empresa_id: string | null
          equipo_id: number
          id: string
          motivo: string | null
          referencia_documento: string | null
          stock_resultante: number
          tenant_id: string | null
          tipo_movimiento: string
          usuario_id: string
        }
        Insert: {
          cantidad_delta: number
          creado_en?: string
          empresa_id?: string | null
          equipo_id: number
          id?: string
          motivo?: string | null
          referencia_documento?: string | null
          stock_resultante: number
          tenant_id?: string | null
          tipo_movimiento: string
          usuario_id?: string
        }
        Update: {
          cantidad_delta?: number
          creado_en?: string
          empresa_id?: string | null
          equipo_id?: number
          id?: string
          motivo?: string | null
          referencia_documento?: string | null
          stock_resultante?: number
          tenant_id?: string | null
          tipo_movimiento?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kardex_inventario_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kardex_inventario_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          alquiler_id: number
          cambio_entregado: number | null
          cliente_id: number
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          efectivo_recibido: number | null
          empresa_id: string | null
          fecha: string
          id: number
          metodo_pago: string
          monto: number
          referencia: string | null
          registrado_por: string | null
          sesion_caja_id: string | null
        }
        Insert: {
          alquiler_id: number
          cambio_entregado?: number | null
          cliente_id: number
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          efectivo_recibido?: number | null
          empresa_id?: string | null
          fecha?: string
          id?: number
          metodo_pago: string
          monto: number
          referencia?: string | null
          registrado_por?: string | null
          sesion_caja_id?: string | null
        }
        Update: {
          alquiler_id?: number
          cambio_entregado?: number | null
          cliente_id?: number
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          efectivo_recibido?: number | null
          empresa_id?: string | null
          fecha?: string
          id?: number
          metodo_pago?: string
          monto?: number
          referencia?: string | null
          registrado_por?: string | null
          sesion_caja_id?: string | null
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
          {
            foreignKeyName: "pagos_sesion_caja_id_fkey"
            columns: ["sesion_caja_id"]
            isOneToOne: false
            referencedRelation: "sesiones_caja"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          ciudad: string | null
          contacto: string | null
          created_at: string | null
          dias_credito: number
          direccion: string | null
          email: string | null
          empresa_id: string | null
          estado: string
          id: string
          nit: string
          nombre: string
          observaciones: string | null
          telefono: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          ciudad?: string | null
          contacto?: string | null
          created_at?: string | null
          dias_credito?: number
          direccion?: string | null
          email?: string | null
          empresa_id?: string | null
          estado?: string
          id?: string
          nit: string
          nombre: string
          observaciones?: string | null
          telefono?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ciudad?: string | null
          contacto?: string | null
          created_at?: string | null
          dias_credito?: number
          direccion?: string | null
          email?: string | null
          empresa_id?: string | null
          estado?: string
          id?: string
          nit?: string
          nombre?: string
          observaciones?: string | null
          telefono?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones_caja: {
        Row: {
          empresa_id: string | null
          estado: string
          fecha_apertura: string | null
          fecha_cierre: string | null
          id: string
          monto_apertura: number
          monto_cierre: number | null
          observaciones: string | null
          tenant_id: string | null
          usuario_id: string
        }
        Insert: {
          empresa_id?: string | null
          estado?: string
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          monto_apertura?: number
          monto_cierre?: number | null
          observaciones?: string | null
          tenant_id?: string | null
          usuario_id: string
        }
        Update: {
          empresa_id?: string | null
          estado?: string
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          monto_apertura?: number
          monto_cierre?: number | null
          observaciones?: string | null
          tenant_id?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_caja_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_by: string | null
          description: string
          id: string
          idempotency_key: string
          reference_id: string | null
          timestamp: string | null
        }
        Insert: {
          created_by?: string | null
          description: string
          id?: string
          idempotency_key: string
          reference_id?: string | null
          timestamp?: string | null
        }
        Update: {
          created_by?: string | null
          description?: string
          id?: string
          idempotency_key?: string
          reference_id?: string | null
          timestamp?: string | null
        }
        Relationships: []
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
      insert_transaction: {
        Args: {
          p_created_by: string
          p_description: string
          p_entries: Json
          p_idempotency_key: string
          p_reference_id: string
        }
        Returns: string
      }
      is_ultra_admin: { Args: never; Returns: boolean }
      procesar_devolucion_alquiler: { Args: { p_payload: Json }; Returns: Json }
    }
    Enums: {
      account_type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
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
    Enums: {
      account_type: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"],
    },
  },
} as const
