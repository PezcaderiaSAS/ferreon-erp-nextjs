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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      alquiler_adendas: {
        Row: {
          alquiler_id: number
          creado_por: string | null
          created_at: string | null
          datos_nuevos: Json
          datos_previos: Json
          dias_adicionales: number | null
          empresa_id: string
          id: string
          metodo_pago: string | null
          monto_adicional: number
          monto_deposito_adicional: number
          motivo: string
          numero_version: string
          observaciones: string | null
        }
        Insert: {
          alquiler_id: number
          creado_por?: string | null
          created_at?: string | null
          datos_nuevos: Json
          datos_previos: Json
          dias_adicionales?: number | null
          empresa_id: string
          id?: string
          metodo_pago?: string | null
          monto_adicional?: number
          monto_deposito_adicional?: number
          motivo: string
          numero_version: string
          observaciones?: string | null
        }
        Update: {
          alquiler_id?: number
          creado_por?: string | null
          created_at?: string | null
          datos_nuevos?: Json
          datos_previos?: Json
          dias_adicionales?: number | null
          empresa_id?: string
          id?: string
          metodo_pago?: string | null
          monto_adicional?: number
          monto_deposito_adicional?: number
          motivo?: string
          numero_version?: string
          observaciones?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alquiler_adendas_alquiler_id_fkey"
            columns: ["alquiler_id"]
            isOneToOne: false
            referencedRelation: "alquileres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alquiler_adendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      alquiler_detalles: {
        Row: {
          alquiler_id: number
          cantidad: number
          cantidad_devuelta: number
          costo_dano: number
          costo_diario_proveedor: number | null
          costo_reparacion: number | null
          costo_subcontratacion_diario: number
          created_at: string
          descripcion_dano: string | null
          devuelto: boolean
          dias_contratados: number
          empresa_id: string
          equipo_id: number
          es_item_clonado_split: boolean | null
          es_subcontratado: boolean
          estado_inspeccion: string | null
          fecha_devolucion_real: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: number
          item_origen_id: number | null
          linea_numero: number
          proveedor_id: string | null
          proveedor_subcontratado_id: string | null
          subcontratacion_id: string | null
          subtotal_linea: number
          subtotal_personalizado: boolean
          tarifa_aplicada: number
          tarifa_personalizada: boolean
          valor_reposicion: number | null
        }
        Insert: {
          alquiler_id: number
          cantidad: number
          cantidad_devuelta?: number
          costo_dano?: number
          costo_diario_proveedor?: number | null
          costo_reparacion?: number | null
          costo_subcontratacion_diario?: number
          created_at?: string
          descripcion_dano?: string | null
          devuelto?: boolean
          dias_contratados: number
          empresa_id?: string
          equipo_id: number
          es_item_clonado_split?: boolean | null
          es_subcontratado?: boolean
          estado_inspeccion?: string | null
          fecha_devolucion_real?: string | null
          fecha_fin?: string | null
          fecha_inicio: string
          id?: number
          item_origen_id?: number | null
          linea_numero?: number
          proveedor_id?: string | null
          proveedor_subcontratado_id?: string | null
          subcontratacion_id?: string | null
          subtotal_linea: number
          subtotal_personalizado?: boolean
          tarifa_aplicada: number
          tarifa_personalizada?: boolean
          valor_reposicion?: number | null
        }
        Update: {
          alquiler_id?: number
          cantidad?: number
          cantidad_devuelta?: number
          costo_dano?: number
          costo_diario_proveedor?: number | null
          costo_reparacion?: number | null
          costo_subcontratacion_diario?: number
          created_at?: string
          descripcion_dano?: string | null
          devuelto?: boolean
          dias_contratados?: number
          empresa_id?: string
          equipo_id?: number
          es_item_clonado_split?: boolean | null
          es_subcontratado?: boolean
          estado_inspeccion?: string | null
          fecha_devolucion_real?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          item_origen_id?: number | null
          linea_numero?: number
          proveedor_id?: string | null
          proveedor_subcontratado_id?: string | null
          subcontratacion_id?: string | null
          subtotal_linea?: number
          subtotal_personalizado?: boolean
          tarifa_aplicada?: number
          tarifa_personalizada?: boolean
          valor_reposicion?: number | null
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
          {
            foreignKeyName: "alquiler_detalles_item_origen_id_fkey"
            columns: ["item_origen_id"]
            isOneToOne: false
            referencedRelation: "alquiler_detalles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alquiler_detalles_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alquiler_detalles_proveedor_subcontratado_id_fkey"
            columns: ["proveedor_subcontratado_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alquiler_detalles_subcontratacion_id_fkey"
            columns: ["subcontratacion_id"]
            isOneToOne: false
            referencedRelation: "subcontrataciones"
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
          idempotency_key: string | null
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
          idempotency_key?: string | null
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
          idempotency_key?: string | null
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
          empresa_id: string
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
          empresa_id: string
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
          empresa_id?: string
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
      catalogo_averias_equipos: {
        Row: {
          activo: boolean | null
          aplica_reposicion: boolean | null
          categoria: string
          codigo: string
          costo_sugerido: number
          created_at: string | null
          empresa_id: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          aplica_reposicion?: boolean | null
          categoria: string
          codigo: string
          costo_sugerido?: number
          created_at?: string | null
          empresa_id: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          aplica_reposicion?: boolean | null
          categoria?: string
          codigo?: string
          costo_sugerido?: number
          created_at?: string | null
          empresa_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogo_averias_equipos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_movimientos_saldo: {
        Row: {
          cliente_id: number
          creado_por: string | null
          created_at: string
          empresa_id: string | null
          id: string
          monto: number
          motivo: string | null
          referencia_origen: string | null
          saldo_resultante: number
          tenant_id: string | null
          tipo: string
        }
        Insert: {
          cliente_id: number
          creado_por?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          monto: number
          motivo?: string | null
          referencia_origen?: string | null
          saldo_resultante: number
          tenant_id?: string | null
          tipo: string
        }
        Update: {
          cliente_id?: number
          creado_por?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          monto?: number
          motivo?: string | null
          referencia_origen?: string | null
          saldo_resultante?: number
          tenant_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_movimientos_saldo_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_movimientos_saldo_empresa_id_fkey"
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
          saldo_a_favor: number
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
          saldo_a_favor?: number
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
          saldo_a_favor?: number
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
          bodeguero_id: string | null
          created_at: string | null
          empresa_id: string | null
          estado: string
          fecha_compra: string
          fecha_recepcion_bodega: string | null
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
          remision_factura_proveedor: string | null
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
          bodeguero_id?: string | null
          created_at?: string | null
          empresa_id?: string | null
          estado?: string
          fecha_compra?: string
          fecha_recepcion_bodega?: string | null
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
          remision_factura_proveedor?: string | null
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
          bodeguero_id?: string | null
          created_at?: string | null
          empresa_id?: string | null
          estado?: string
          fecha_compra?: string
          fecha_recepcion_bodega?: string | null
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
          remision_factura_proveedor?: string | null
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
          cantidad_recibida: number | null
          compra_id: string
          created_at: string | null
          equipo_id: number
          id: string
          precio_unitario: number
          subtotal: number
        }
        Insert: {
          cantidad: number
          cantidad_recibida?: number | null
          compra_id: string
          created_at?: string | null
          equipo_id: number
          id?: string
          precio_unitario: number
          subtotal: number
        }
        Update: {
          cantidad?: number
          cantidad_recibida?: number | null
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
      dashboard_tareas: {
        Row: {
          completada: boolean
          created_at: string
          deleted_at: string | null
          empresa_id: string
          fecha_limite: string | null
          id: string
          subtexto: string | null
          titulo: string
          updated_at: string
          urgencia: string
          user_id: string | null
        }
        Insert: {
          completada?: boolean
          created_at?: string
          deleted_at?: string | null
          empresa_id: string
          fecha_limite?: string | null
          id?: string
          subtexto?: string | null
          titulo: string
          updated_at?: string
          urgencia?: string
          user_id?: string | null
        }
        Update: {
          completada?: boolean
          created_at?: string
          deleted_at?: string | null
          empresa_id?: string
          fecha_limite?: string | null
          id?: string
          subtexto?: string | null
          titulo?: string
          updated_at?: string
          urgencia?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_tareas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      devolucion_detalles: {
        Row: {
          alquiler_detalle_id: number
          cantidad_devuelta: number
          costo_reparacion: number
          created_at: string
          descripcion_dano: string | null
          desglose_averias: Json | null
          devolucion_id: string
          dias_efectivos_cobrados: number
          equipo_id: number
          estado_inspeccion: string
          id: string
          subtotal_alquiler: number
          tarifa_diaria_aplicada: number
          valor_reposicion: number
        }
        Insert: {
          alquiler_detalle_id: number
          cantidad_devuelta: number
          costo_reparacion?: number
          created_at?: string
          descripcion_dano?: string | null
          desglose_averias?: Json | null
          devolucion_id: string
          dias_efectivos_cobrados?: number
          equipo_id: number
          estado_inspeccion?: string
          id?: string
          subtotal_alquiler?: number
          tarifa_diaria_aplicada?: number
          valor_reposicion?: number
        }
        Update: {
          alquiler_detalle_id?: number
          cantidad_devuelta?: number
          costo_reparacion?: number
          created_at?: string
          descripcion_dano?: string | null
          desglose_averias?: Json | null
          devolucion_id?: string
          dias_efectivos_cobrados?: number
          equipo_id?: number
          estado_inspeccion?: string
          id?: string
          subtotal_alquiler?: number
          tarifa_diaria_aplicada?: number
          valor_reposicion?: number
        }
        Relationships: [
          {
            foreignKeyName: "devolucion_detalles_alquiler_detalle_id_fkey"
            columns: ["alquiler_detalle_id"]
            isOneToOne: false
            referencedRelation: "alquiler_detalles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devolucion_detalles_devolucion_id_fkey"
            columns: ["devolucion_id"]
            isOneToOne: false
            referencedRelation: "devoluciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devolucion_detalles_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      devoluciones: {
        Row: {
          alquiler_id: number
          asiento_contable_id: string | null
          consecutivo: string
          created_at: string
          deposito_aplicado: number
          desglose_averias: Json | null
          empresa_id: string | null
          fecha_devolucion: string
          id: string
          idempotency_key: string | null
          metodo_pago: string | null
          movimiento_caja_id: string | null
          observaciones: string | null
          recibido_por: string | null
          saldo_neto: number
          sesion_caja_id: string | null
          tipo_resolucion: string
          total_alquiler_liquidado: number
          total_danos: number
          total_dias_causados: number
          total_reposiciones: number
          updated_at: string
        }
        Insert: {
          alquiler_id: number
          asiento_contable_id?: string | null
          consecutivo: string
          created_at?: string
          deposito_aplicado?: number
          desglose_averias?: Json | null
          empresa_id?: string | null
          fecha_devolucion?: string
          id?: string
          idempotency_key?: string | null
          metodo_pago?: string | null
          movimiento_caja_id?: string | null
          observaciones?: string | null
          recibido_por?: string | null
          saldo_neto?: number
          sesion_caja_id?: string | null
          tipo_resolucion?: string
          total_alquiler_liquidado?: number
          total_danos?: number
          total_dias_causados?: number
          total_reposiciones?: number
          updated_at?: string
        }
        Update: {
          alquiler_id?: number
          asiento_contable_id?: string | null
          consecutivo?: string
          created_at?: string
          deposito_aplicado?: number
          desglose_averias?: Json | null
          empresa_id?: string | null
          fecha_devolucion?: string
          id?: string
          idempotency_key?: string | null
          metodo_pago?: string | null
          movimiento_caja_id?: string | null
          observaciones?: string | null
          recibido_por?: string | null
          saldo_neto?: number
          sesion_caja_id?: string | null
          tipo_resolucion?: string
          total_alquiler_liquidado?: number
          total_danos?: number
          total_dias_causados?: number
          total_reposiciones?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devoluciones_alquiler_id_fkey"
            columns: ["alquiler_id"]
            isOneToOne: false
            referencedRelation: "alquileres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_asiento_contable_id_fkey"
            columns: ["asiento_contable_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_movimiento_caja_id_fkey"
            columns: ["movimiento_caja_id"]
            isOneToOne: false
            referencedRelation: "movimientos_caja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_sesion_caja_id_fkey"
            columns: ["sesion_caja_id"]
            isOneToOne: false
            referencedRelation: "sesiones_caja"
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
          fecha_ultimo_cambio_estado: string | null
          id: number
          permisos_custom: Json | null
          rol: string
          ultimo_cambio_estado_por: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          empresa_id: string
          es_empresa_activa?: boolean
          estado?: string
          fecha_ultimo_cambio_estado?: string | null
          id?: number
          permisos_custom?: Json | null
          rol?: string
          ultimo_cambio_estado_por?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          empresa_id?: string
          es_empresa_activa?: boolean
          estado?: string
          fecha_ultimo_cambio_estado?: string | null
          id?: number
          permisos_custom?: Json | null
          rol?: string
          ultimo_cambio_estado_por?: string | null
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
          autorizado: boolean | null
          ciudad: string | null
          configuracion: Json | null
          created_at: string
          deleted_at: string | null
          dias_gracia: number | null
          id: string
          modulos_activos: Json | null
          nit: string | null
          nombre: string
          plan_id: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          subscription_status: string
          tamano_empresa: string | null
          telefono: string | null
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          autorizado?: boolean | null
          ciudad?: string | null
          configuracion?: Json | null
          created_at?: string
          deleted_at?: string | null
          dias_gracia?: number | null
          id?: string
          modulos_activos?: Json | null
          nit?: string | null
          nombre: string
          plan_id?: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string
          tamano_empresa?: string | null
          telefono?: string | null
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          autorizado?: boolean | null
          ciudad?: string | null
          configuracion?: Json | null
          created_at?: string
          deleted_at?: string | null
          dias_gracia?: number | null
          id?: string
          modulos_activos?: Json | null
          nit?: string | null
          nombre?: string
          plan_id?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string
          tamano_empresa?: string | null
          telefono?: string | null
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipos: {
        Row: {
          categoria: string
          codigo: string
          costo_promedio: number | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          descripcion: string | null
          empresa_id: string | null
          estado: string
          id: number
          nombre: string
          peso: number | null
          stock_disponible: number
          stock_en_obra: number
          stock_mantenimiento: number
          stock_perdido: number | null
          stock_total: number
          tarifa_diaria: number
          ultimo_costo_compra: number | null
          updated_at: string
          valor_reposicion: number | null
        }
        Insert: {
          categoria: string
          codigo: string
          costo_promedio?: number | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          estado?: string
          id?: number
          nombre: string
          peso?: number | null
          stock_disponible: number
          stock_en_obra: number
          stock_mantenimiento?: number
          stock_perdido?: number | null
          stock_total: number
          tarifa_diaria: number
          ultimo_costo_compra?: number | null
          updated_at?: string
          valor_reposicion?: number | null
        }
        Update: {
          categoria?: string
          codigo?: string
          costo_promedio?: number | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          estado?: string
          id?: number
          nombre?: string
          peso?: number | null
          stock_disponible?: number
          stock_en_obra?: number
          stock_mantenimiento?: number
          stock_perdido?: number | null
          stock_total?: number
          tarifa_diaria?: number
          ultimo_costo_compra?: number | null
          updated_at?: string
          valor_reposicion?: number | null
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
          costo_promedio_resultante: number | null
          costo_total: number | null
          costo_unitario: number | null
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
          costo_promedio_resultante?: number | null
          costo_total?: number | null
          costo_unitario?: number | null
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
          costo_promedio_resultante?: number | null
          costo_total?: number | null
          costo_unitario?: number | null
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
      movimientos_caja: {
        Row: {
          beneficiario: string | null
          comprobante: string | null
          concepto: string
          created_at: string | null
          empresa_id: string
          id: string
          monto: number
          sesion_caja_id: string
          tenant_id: string | null
          tipo: string
          usuario_id: string
        }
        Insert: {
          beneficiario?: string | null
          comprobante?: string | null
          concepto: string
          created_at?: string | null
          empresa_id: string
          id?: string
          monto: number
          sesion_caja_id: string
          tenant_id?: string | null
          tipo: string
          usuario_id: string
        }
        Update: {
          beneficiario?: string | null
          comprobante?: string | null
          concepto?: string
          created_at?: string | null
          empresa_id?: string
          id?: string
          monto?: number
          sesion_caja_id?: string
          tenant_id?: string | null
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_caja_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_sesion_caja_id_fkey"
            columns: ["sesion_caja_id"]
            isOneToOne: false
            referencedRelation: "sesiones_caja"
            referencedColumns: ["id"]
          },
        ]
      }
      pago_metodos_detalle: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          metodo: string
          monto: number
          pago_id: number
          referencia: string | null
          sesion_caja_id: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          metodo: string
          monto: number
          pago_id: number
          referencia?: string | null
          sesion_caja_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          metodo?: string
          monto?: number
          pago_id?: number
          referencia?: string | null
          sesion_caja_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pago_metodos_detalle_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_metodos_detalle_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_metodos_detalle_sesion_caja_id_fkey"
            columns: ["sesion_caja_id"]
            isOneToOne: false
            referencedRelation: "sesiones_caja"
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
      proveedor_abonos_cxp: {
        Row: {
          created_at: string | null
          cuenta_pagar_id: string
          empresa_id: string | null
          fecha_abono: string
          id: string
          metodo_pago: string
          monto_abono: number
          numero_comprobante: string
          observaciones: string | null
          referencia_bancaria: string | null
          sesion_caja_id: string | null
          tenant_id: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          cuenta_pagar_id: string
          empresa_id?: string | null
          fecha_abono?: string
          id?: string
          metodo_pago: string
          monto_abono: number
          numero_comprobante: string
          observaciones?: string | null
          referencia_bancaria?: string | null
          sesion_caja_id?: string | null
          tenant_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          cuenta_pagar_id?: string
          empresa_id?: string | null
          fecha_abono?: string
          id?: string
          metodo_pago?: string
          monto_abono?: number
          numero_comprobante?: string
          observaciones?: string | null
          referencia_bancaria?: string | null
          sesion_caja_id?: string | null
          tenant_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proveedor_abonos_cxp_cuenta_pagar_id_fkey"
            columns: ["cuenta_pagar_id"]
            isOneToOne: false
            referencedRelation: "proveedor_cuentas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proveedor_abonos_cxp_sesion_caja_id_fkey"
            columns: ["sesion_caja_id"]
            isOneToOne: false
            referencedRelation: "sesiones_caja"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedor_cuentas_pagar: {
        Row: {
          compra_id: string
          created_at: string | null
          empresa_id: string | null
          estado: string
          fecha_emision: string
          fecha_vencimiento: string
          id: string
          monto_total: number
          numero_orden: string
          observaciones: string | null
          proveedor_id: string | null
          saldo_pendiente: number
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          compra_id: string
          created_at?: string | null
          empresa_id?: string | null
          estado?: string
          fecha_emision?: string
          fecha_vencimiento: string
          id?: string
          monto_total: number
          numero_orden: string
          observaciones?: string | null
          proveedor_id?: string | null
          saldo_pendiente: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          compra_id?: string
          created_at?: string | null
          empresa_id?: string | null
          estado?: string
          fecha_emision?: string
          fecha_vencimiento?: string
          id?: string
          monto_total?: number
          numero_orden?: string
          observaciones?: string | null
          proveedor_id?: string | null
          saldo_pendiente?: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proveedor_cuentas_pagar_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proveedor_cuentas_pagar_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
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
          arqueo_detalle: Json | null
          diferencia: number | null
          empresa_id: string
          estado: string
          fecha_apertura: string | null
          fecha_cierre: string | null
          id: string
          monto_apertura: number
          monto_cierre: number | null
          monto_esperado: number | null
          motivo_descuadre: string | null
          observaciones: string | null
          tenant_id: string | null
          usuario_id: string
        }
        Insert: {
          arqueo_detalle?: Json | null
          diferencia?: number | null
          empresa_id: string
          estado?: string
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          monto_apertura?: number
          monto_cierre?: number | null
          monto_esperado?: number | null
          motivo_descuadre?: string | null
          observaciones?: string | null
          tenant_id?: string | null
          usuario_id: string
        }
        Update: {
          arqueo_detalle?: Json | null
          diferencia?: number | null
          empresa_id?: string
          estado?: string
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          monto_apertura?: number
          monto_cierre?: number | null
          monto_esperado?: number | null
          motivo_descuadre?: string | null
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
      subcontrataciones: {
        Row: {
          alquiler_id: number | null
          aplica_retenciones: boolean | null
          asiento_contable_id: string | null
          consecutivo: string
          costo_final_liquidado: number | null
          costo_total_estimado: number
          costo_total_real: number
          creado_por: string | null
          created_at: string
          deposito_garantia_proveedor: number
          empresa_id: string | null
          estado: string
          fecha_devolucion_estimada: string
          fecha_devolucion_real: string | null
          fecha_emision: string
          fecha_recepcion_estimada: string
          fecha_recepcion_real: string | null
          id: string
          observaciones: string | null
          proveedor_id: string | null
          proveedor_nit: string
          proveedor_nombre: string
          proveedor_telefono: string | null
          retefuente_valor: number | null
          reteica_valor: number | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          alquiler_id?: number | null
          aplica_retenciones?: boolean | null
          asiento_contable_id?: string | null
          consecutivo: string
          costo_final_liquidado?: number | null
          costo_total_estimado?: number
          costo_total_real?: number
          creado_por?: string | null
          created_at?: string
          deposito_garantia_proveedor?: number
          empresa_id?: string | null
          estado?: string
          fecha_devolucion_estimada: string
          fecha_devolucion_real?: string | null
          fecha_emision?: string
          fecha_recepcion_estimada: string
          fecha_recepcion_real?: string | null
          id?: string
          observaciones?: string | null
          proveedor_id?: string | null
          proveedor_nit: string
          proveedor_nombre: string
          proveedor_telefono?: string | null
          retefuente_valor?: number | null
          reteica_valor?: number | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          alquiler_id?: number | null
          aplica_retenciones?: boolean | null
          asiento_contable_id?: string | null
          consecutivo?: string
          costo_final_liquidado?: number | null
          costo_total_estimado?: number
          costo_total_real?: number
          creado_por?: string | null
          created_at?: string
          deposito_garantia_proveedor?: number
          empresa_id?: string | null
          estado?: string
          fecha_devolucion_estimada?: string
          fecha_devolucion_real?: string | null
          fecha_emision?: string
          fecha_recepcion_estimada?: string
          fecha_recepcion_real?: string | null
          id?: string
          observaciones?: string | null
          proveedor_id?: string | null
          proveedor_nit?: string
          proveedor_nombre?: string
          proveedor_telefono?: string | null
          retefuente_valor?: number | null
          reteica_valor?: number | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontrataciones_alquiler_id_fkey"
            columns: ["alquiler_id"]
            isOneToOne: false
            referencedRelation: "alquileres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontrataciones_asiento_contable_id_fkey"
            columns: ["asiento_contable_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontrataciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontrataciones_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontrataciones_detalles: {
        Row: {
          alquiler_detalle_id: number | null
          cantidad: number
          costo_diario_unitario: number
          created_at: string
          descripcion_item: string
          dias_pactados: number
          equipo_id: number | null
          id: string
          subcontratacion_id: string
          subtotal_costo: number
          tarifa_diaria_cliente: number
        }
        Insert: {
          alquiler_detalle_id?: number | null
          cantidad: number
          costo_diario_unitario: number
          created_at?: string
          descripcion_item: string
          dias_pactados: number
          equipo_id?: number | null
          id?: string
          subcontratacion_id: string
          subtotal_costo?: number
          tarifa_diaria_cliente?: number
        }
        Update: {
          alquiler_detalle_id?: number | null
          cantidad?: number
          costo_diario_unitario?: number
          created_at?: string
          descripcion_item?: string
          dias_pactados?: number
          equipo_id?: number | null
          id?: string
          subcontratacion_id?: string
          subtotal_costo?: number
          tarifa_diaria_cliente?: number
        }
        Relationships: [
          {
            foreignKeyName: "subcontrataciones_detalles_alquiler_detalle_id_fkey"
            columns: ["alquiler_detalle_id"]
            isOneToOne: false
            referencedRelation: "alquiler_detalles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontrataciones_detalles_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontrataciones_detalles_subcontratacion_id_fkey"
            columns: ["subcontratacion_id"]
            isOneToOne: false
            referencedRelation: "subcontrataciones"
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
      alquiler_crear_pos_rapido_v1: { Args: { p_payload: Json }; Returns: Json }
      alquiler_despachar_items_v1: { Args: { p_payload: Json }; Returns: Json }
      alquiler_despachar_segmentado_concurrente_v1: {
        Args: { p_payload: Json }
        Returns: Json
      }
      alquiler_devolver_items_v1: { Args: { p_payload: Json }; Returns: Json }
      alquiler_generar_adenda_transaccional_v1: {
        Args: { p_payload: Json }
        Returns: Json
      }
      aprobar_cotizacion_transaccional: {
        Args: { p_alquiler_id: number }
        Returns: Json
      }
      convertir_cotizacion_a_alquiler_transaccional: {
        Args: { p_payload: Json }
        Returns: Json
      }
      cotizacion_convertir_pos_1clic: {
        Args: { p_payload: Json }
        Returns: Json
      }
      crear_alquiler_transaccional: { Args: { p_payload: Json }; Returns: Json }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      devolucion_pos_inspeccion_rapida_v1: {
        Args: { p_payload: Json }
        Returns: Json
      }
      editar_alquiler_transaccional_v1: {
        Args: { p_payload: Json }
        Returns: Json
      }
      formalizar_alquiler_cotizacion_transaccional: {
        Args: { p_payload: Json }
        Returns: Json
      }
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
      procesar_devolucion_avanzada: { Args: { p_payload: Json }; Returns: Json }
      recibir_compra_y_actualizar_pmp_transaccional: {
        Args: {
          p_compra_id: string
          p_observaciones_bodega?: string
          p_remision_factura?: string
          p_usuario_id: string
        }
        Returns: Json
      }
      reducir_stock_seguro: {
        Args: { p_cantidad_requerida: number; p_equipo_id: number }
        Returns: boolean
      }
      seed_dummy_tenant_data: {
        Args: { p_empresa_id: string; p_user_id: string }
        Returns: undefined
      }
      test_dyn: { Args: never; Returns: undefined }
      test_fn: { Args: never; Returns: number }
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
