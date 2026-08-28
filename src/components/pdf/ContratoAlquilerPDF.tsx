import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { numeroALetras } from '../../core/utils/numero-a-letras';

// Registrar fuentes para evitar fallos de renderizado
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

// Paleta de Colores Corporativa
const COLORS = {
  brandPrimary: '#0f766e',  // Teal elegante
  brandAccent: '#f97316',   // Naranja / Salmón
  textDark: '#0f172a',      // slate-900
  textMuted: '#475569',     // slate-600
  border: '#cbd5e1',        // slate-300
  borderLight: '#e2e8f0',   // slate-200
  bgLight: '#f8fafc',       // slate-50
  bgZebra: '#f1f5f9',       // slate-100
  badgeBg: '#f0fdf4',       // emerald-50
  badgeBorder: '#86efac',   // emerald-300
  badgeText: '#15803d',     // emerald-700
};

const getStyles = (pageSize: 'LETTER' | 'A5') => {
  const isA5 = pageSize === 'A5';
  
  return StyleSheet.create({
    page: {
      padding: isA5 ? 18 : 28,
      fontFamily: 'Roboto',
      fontSize: isA5 ? 7.5 : 8.5,
      color: COLORS.textDark,
      backgroundColor: '#ffffff',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottomWidth: 2,
      borderBottomColor: COLORS.brandPrimary,
      paddingBottom: isA5 ? 8 : 12,
      marginBottom: isA5 ? 10 : 14,
    },
    brandTitle: {
      fontSize: isA5 ? 16 : 20,
      fontWeight: 'bold',
      color: COLORS.brandPrimary,
      letterSpacing: -0.5,
    },
    brandSubtitle: {
      fontSize: isA5 ? 7.5 : 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
      fontWeight: 500,
    },
    metaBox: {
      alignItems: 'flex-end',
      backgroundColor: COLORS.bgLight,
      padding: isA5 ? 4 : 6,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: COLORS.borderLight,
    },
    metaText: {
      fontSize: isA5 ? 7 : 8,
      marginBottom: 1.5,
      color: COLORS.textMuted,
    },
    metaBold: {
      fontWeight: 'bold',
      color: COLORS.textDark,
    },
    consecutivoHighlight: {
      fontSize: isA5 ? 10 : 12,
      fontWeight: 'bold',
      color: COLORS.brandPrimary,
    },
    sectionTitle: {
      fontSize: isA5 ? 8.5 : 9.5,
      fontWeight: 'bold',
      backgroundColor: COLORS.bgLight,
      padding: isA5 ? 3.5 : 5,
      marginBottom: isA5 ? 6 : 8,
      marginTop: isA5 ? 4 : 6,
      borderLeftWidth: 3,
      borderLeftColor: COLORS.brandPrimary,
      color: COLORS.textDark,
    },
    grid2Col: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: isA5 ? 8 : 10,
      gap: 10,
    },
    card: {
      flex: 1,
      backgroundColor: COLORS.bgLight,
      padding: isA5 ? 6 : 8,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: COLORS.borderLight,
    },
    infoRow: {
      flexDirection: 'row',
      marginBottom: 2.5,
    },
    infoLabel: {
      width: isA5 ? '38%' : '35%',
      fontSize: isA5 ? 7 : 8,
      color: COLORS.textMuted,
      fontWeight: 500,
    },
    infoValue: {
      width: isA5 ? '62%' : '65%',
      fontSize: isA5 ? 7.5 : 8.5,
      fontWeight: 'bold',
      color: COLORS.textDark,
    },
    table: {
      width: '100%',
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 4,
      marginBottom: isA5 ? 8 : 10,
      overflow: 'hidden',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: COLORS.brandPrimary,
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: isA5 ? 7 : 8,
      paddingVertical: isA5 ? 4 : 5,
      paddingHorizontal: 3,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.borderLight,
      paddingVertical: isA5 ? 3.5 : 4.5,
      paddingHorizontal: 3,
      alignItems: 'center',
    },
    tableRowZebra: {
      backgroundColor: COLORS.bgZebra,
    },
    colItem: { width: '30%' },
    colCant: { width: '8%', textAlign: 'center' },
    colInicio: { width: '13%', textAlign: 'center' },
    colFin: { width: '13%', textAlign: 'center' },
    colDias: { width: '8%', textAlign: 'center' },
    colTarifa: { width: '13%', textAlign: 'right' },
    colSubtotal: { width: '15%', textAlign: 'right' },
    cellText: {
      fontSize: isA5 ? 6.8 : 7.8,
      color: COLORS.textDark,
    },
    cellBold: {
      fontWeight: 'bold',
    },
    totalsWrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: isA5 ? 10 : 14,
      gap: 10,
    },
    wordsBox: {
      flex: 1.1,
      backgroundColor: COLORS.bgLight,
      padding: isA5 ? 6 : 8,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: COLORS.borderLight,
    },
    wordsText: {
      fontSize: isA5 ? 7 : 8,
      fontWeight: 'bold',
      color: COLORS.brandPrimary,
      lineHeight: 1.3,
    },
    totalsBox: {
      flex: 0.9,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: isA5 ? 2.5 : 3.5,
      paddingHorizontal: isA5 ? 5 : 7,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.borderLight,
      backgroundColor: '#ffffff',
    },
    totalRowFinal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: isA5 ? 4 : 5,
      paddingHorizontal: isA5 ? 5 : 7,
      backgroundColor: COLORS.brandPrimary,
    },
    totalLabel: {
      fontSize: isA5 ? 7 : 8,
      color: COLORS.textMuted,
    },
    totalVal: {
      fontSize: isA5 ? 7.5 : 8.5,
      fontWeight: 'bold',
      color: COLORS.textDark,
    },
    totalLabelFinal: {
      fontSize: isA5 ? 8 : 9,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    totalValFinal: {
      fontSize: isA5 ? 9 : 11,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    signatures: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: isA5 ? 16 : 28,
      paddingHorizontal: 20,
    },
    sigBox: {
      width: '42%',
      borderTopWidth: 1,
      borderTopColor: COLORS.textDark,
      paddingTop: 4,
      alignItems: 'center',
    },
    sigLabel: {
      fontSize: isA5 ? 7.5 : 8.5,
      fontWeight: 'bold',
      color: COLORS.textDark,
    },
    sigSub: {
      fontSize: isA5 ? 6.5 : 7.5,
      color: COLORS.textMuted,
      marginTop: 1,
    },
    footer: {
      position: 'absolute',
      bottom: isA5 ? 10 : 16,
      left: isA5 ? 18 : 28,
      right: isA5 ? 18 : 28,
      textAlign: 'center',
      color: COLORS.textMuted,
      fontSize: isA5 ? 6 : 7,
      borderTopWidth: 1,
      borderTopColor: COLORS.borderLight,
      paddingTop: 4,
    },
  });
};

interface ContratoAlquilerPDFProps {
  data: any;
  pageSize?: 'LETTER' | 'A5';
}

export const ContratoAlquilerPDF: React.FC<ContratoAlquilerPDFProps> = ({ 
  data, 
  pageSize = 'LETTER' 
}) => {
  const styles = getStyles(pageSize);

  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(Math.round(valor || 0));
  };

  const fechaDoc = data.created_at || data.fechaRegistro || new Date().toISOString();
  const fechaFormat = new Date(fechaDoc).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Procesamiento y cálculo matemático dinámico de ítems
  const detallesProcesados = (data.detalles || []).map((item: any) => {
    const fInicio = item.fecha_inicio || item.fechaInicio || fechaDoc;
    const fFin = item.fecha_fin_estimada || item.fechaFinEstimada || item.fecha_fin || item.fechaFin || fInicio;
    
    const diffMs = new Date(fFin).getTime() - new Date(fInicio).getTime();
    const dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const cantidad = Number(item.cantidad || 1);
    const tarifa = Number(item.valor_unitario || item.tarifaDiaria || item.tarifaAplicada || item.precioDiario || 0);
    const subtotalLinea = cantidad * tarifa * dias;

    const nombreDisplay = item.nombreItem || item.nombre || item.equipo?.nombre || 'Equipo de Construcción';
    const codigoDisplay = item.codigo || item.sku || item.equipo?.codigo || '';

    return {
      nombre: codigoDisplay ? `${nombreDisplay} (${codigoDisplay})` : nombreDisplay,
      cantidad,
      fechaInicio: new Date(fInicio).toLocaleDateString('es-CO'),
      fechaFin: new Date(fFin).toLocaleDateString('es-CO'),
      dias,
      tarifaDiaria: tarifa,
      subtotal: subtotalLinea,
    };
  });

  const subtotalEquipos = detallesProcesados.reduce((acc: number, it: any) => acc + it.subtotal, 0);
  const fleteEntrega = Number(data.flete_entrega || data.fleteEntrega || 0);
  const fleteRecogida = Number(data.flete_recogida || data.fleteRecogida || 0);
  const totalFletes = fleteEntrega + fleteRecogida;
  const deposito = Number(data.deposito || 0);
  const garantiaMonto = Number(data.garantia_monto || data.garantiaMonto || 0);
  const garantiaTipo = data.garantia_tipo || data.garantiaTipo || 'Efectivo';
  
  const totalGeneral = subtotalEquipos + totalFletes;
  const saldoPendiente = Math.max(0, totalGeneral - deposito);
  const montoEnLetras = numeroALetras(saldoPendiente);

  const consecutivoFormatted = data.consecutivo ? `#${String(data.consecutivo).padStart(5, '0')}` : 'BORRADOR';

  return (
    <Document>
      <Page size={pageSize === 'A5' ? 'A5' : 'LETTER'} style={styles.page}>
        
        {/* CABECERA CORPORATIVA */}
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brandTitle}>Alquileres System</Text>
            <Text style={styles.brandSubtitle}>Gestión y Alquiler de Maquinaria y Equipos para la Construcción</Text>
            <Text style={[styles.metaText, { marginTop: 2 }]}>NIT: 900.854.123-9 • Tel: (+57) 310 987 6543 • Bogotá D.C.</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaText}>CONTRATO DE ALQUILER</Text>
            <Text style={styles.consecutivoHighlight}>{consecutivoFormatted}</Text>
            <Text style={styles.metaText}>Fecha: <Text style={styles.metaBold}>{fechaFormat}</Text></Text>
            <Text style={styles.metaText}>Estado: <Text style={styles.metaBold}>{data.estado || 'ACTIVO'}</Text></Text>
          </View>
        </View>

        {/* INFORMACIÓN DEL CLIENTE Y LOGÍSTICA */}
        <View style={styles.grid2Col}>
          {/* Card Cliente */}
          <View style={styles.card}>
            <Text style={[styles.metaBold, { color: COLORS.brandPrimary, marginBottom: 4 }]}>DATOS DEL CLIENTE</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cliente:</Text>
              <Text style={styles.infoValue}>{data.clienteNombre || data.cliente_nombre || 'Consumidor Final'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>NIT / C.C.:</Text>
              <Text style={styles.infoValue}>{data.clienteNit || data.cliente_nit || data.nit_cedula || data.nit || 'Sin Registrar'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>{data.clienteTelefono || data.telefono || data.contacto || 'No especificado'}</Text>
            </View>
          </View>

          {/* Card Logística y Garantía */}
          <View style={styles.card}>
            <Text style={[styles.metaBold, { color: COLORS.brandPrimary, marginBottom: 4 }]}>LOGÍSTICA Y RESPALDO</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lugar de Obra:</Text>
              <Text style={styles.infoValue}>{data.detalles_logistica || data.detallesLogistica || 'Entrega en bodega central'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Garantía ({garantiaTipo}):</Text>
              <Text style={styles.infoValue}>{formatearCOP(garantiaMonto)}</Text>
            </View>
            {data.observaciones && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Observación:</Text>
                <Text style={styles.infoValue}>{data.observaciones}</Text>
              </View>
            )}
          </View>
        </View>

        {/* TABLA DE EQUIPOS (7 COLUMNAS) */}
        <Text style={styles.sectionTitle}>MAQUINARIA Y EQUIPOS CONTRATADOS</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colItem}><Text style={styles.cellBold}>Equipo / Maquinaria</Text></View>
            <View style={styles.colCant}><Text style={styles.cellBold}>Cant.</Text></View>
            <View style={styles.colInicio}><Text style={styles.cellBold}>Desde</Text></View>
            <View style={styles.colFin}><Text style={styles.cellBold}>Hasta</Text></View>
            <View style={styles.colDias}><Text style={styles.cellBold}>Días</Text></View>
            <View style={styles.colTarifa}><Text style={styles.cellBold}>Tarifa / Día</Text></View>
            <View style={styles.colSubtotal}><Text style={styles.cellBold}>Subtotal Est.</Text></View>
          </View>

          {detallesProcesados.map((item: any, index: number) => (
            <View wrap={false} key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowZebra : {}]}>
              <View style={styles.colItem}><Text style={styles.cellText}>{item.nombre}</Text></View>
              <View style={styles.colCant}><Text style={[styles.cellText, styles.cellBold]}>{item.cantidad}</Text></View>
              <View style={styles.colInicio}><Text style={styles.cellText}>{item.fechaInicio}</Text></View>
              <View style={styles.colFin}><Text style={styles.cellText}>{item.fechaFin}</Text></View>
              <View style={styles.colDias}><Text style={[styles.cellText, styles.cellBold]}>{item.dias}</Text></View>
              <View style={styles.colTarifa}><Text style={styles.cellText}>{formatearCOP(item.tarifaDiaria)}</Text></View>
              <View style={styles.colSubtotal}><Text style={[styles.cellText, styles.cellBold]}>{formatearCOP(item.subtotal)}</Text></View>
            </View>
          ))}
        </View>

        {/* RESUMEN FINANCIERO Y VALOR EN LETRAS */}
        <View style={styles.totalsWrapper} wrap={false}>
          {/* Caja en Letras y Cuentas */}
          <View style={styles.wordsBox}>
            <Text style={[styles.metaText, { color: COLORS.textMuted }]}>VALOR TOTAL ESTIMADO EN LETRAS:</Text>
            <Text style={styles.wordsText}>{montoEnLetras}</Text>
            <Text style={[styles.metaText, { marginTop: 6, fontSize: pageSize === 'A5' ? 6 : 7 }]}>
              Pagos: Bancolombia Cta Ahorros No. 123-456789-01 (Alquileres System NIT 900.854.123-9)
            </Text>
          </View>

          {/* Desglose de Totales */}
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal Alquiler Equipos:</Text>
              <Text style={styles.totalVal}>{formatearCOP(subtotalEquipos)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Flete Entrega en Obra:</Text>
              <Text style={styles.totalVal}>{formatearCOP(fleteEntrega)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Flete Retorno / Recogida:</Text>
              <Text style={styles.totalVal}>{formatearCOP(fleteRecogida)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Anticipo / Depósito Aplicado:</Text>
              <Text style={[styles.totalVal, { color: '#dc2626' }]}>- {formatearCOP(deposito)}</Text>
            </View>
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>SALDO PENDIENTE:</Text>
              <Text style={styles.totalValFinal}>{formatearCOP(saldoPendiente)}</Text>
            </View>
          </View>
        </View>

        {/* FIRMAS LEGALES */}
        <View style={styles.signatures} wrap={false}>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Firma Cliente / Receptor</Text>
            <Text style={styles.sigSub}>C.C. / NIT: {data.clienteNit || data.nit_cedula || data.nit || '____________________'}</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Alquileres System</Text>
            <Text style={styles.sigSub}>Firma Autorizada y Sello</Text>
          </View>
        </View>

        {/* PIE DE PÁGINA */}
        <Text style={styles.footer} fixed>
          Documento oficial de control de alquiler expedido por Alquileres System. Horario de corte diario: 5:00 PM. 
          Generado el {new Date().toLocaleString('es-CO')}.
        </Text>
      </Page>
    </Document>
  );
};
