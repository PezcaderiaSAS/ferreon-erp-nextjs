import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

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

// Paleta de Colores
const COLORS = {
  brandSalmon: '#ff7f50', // Ajusta al código hexadecimal real de tu marca
  textDark: '#1e293b',    // slate-800
  textMuted: '#64748b',   // slate-500
  border: '#e2e8f0',      // slate-200
  bgLight: '#f8fafc',     // slate-50
  bgZebra: '#f1f5f9',     // slate-100
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    color: COLORS.textDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.brandSalmon,
    paddingBottom: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.brandSalmon,
  },
  headerSubTitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  metaDataContainer: {
    alignItems: 'flex-end',
  },
  metaDataText: {
    fontSize: 10,
    marginBottom: 2,
  },
  metaDataBold: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: COLORS.bgLight,
    padding: 5,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.brandSalmon,
  },
  clientContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.brandSalmon,
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowZebra: {
    backgroundColor: COLORS.bgZebra,
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    margin: 5,
    fontSize: 9,
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '25%', textAlign: 'right' },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  totalsBox: {
    width: '45%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    backgroundColor: COLORS.bgLight,
  },
  totalText: {
    fontWeight: 'bold',
  },
  totalValue: {
    textAlign: 'right',
  },
  totalValueFinal: {
    textAlign: 'right',
    fontWeight: 'bold',
    color: COLORS.brandSalmon,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
});

interface ContratoAlquilerPDFProps {
  data: any; // Ideally we use a strict type here based on AlquilerUI
}

export const ContratoAlquilerPDF: React.FC<ContratoAlquilerPDFProps> = ({ data }) => {
  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0);
  };

  const fechaFormat = new Date(data.created_at).toLocaleDateString('es-CO');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* CABECERA */}
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.title}>FerreOn</Text>
            <Text style={styles.headerSubTitle}>Alquiler de Equipos y Maquinaria</Text>
          </View>
          <View style={styles.metaDataContainer}>
            <Text style={styles.metaDataText}>Contrato N°: <Text style={styles.metaDataBold}>{data.consecutivo || 'Borrador'}</Text></Text>
            <Text style={styles.metaDataText}>Fecha: {fechaFormat}</Text>
            <Text style={styles.metaDataText}>Estado: {data.estado}</Text>
          </View>
        </View>

        {/* INFORMACIÓN DEL CLIENTE */}
        <Text style={styles.sectionTitle}>INFORMACIÓN DEL CLIENTE</Text>
        <View style={styles.clientContainer}>
          <View style={styles.col}>
            <Text style={styles.metaDataText}>Nombre / Razón Social:</Text>
            <Text style={styles.metaDataBold}>{data.clienteNombre || 'Sin Registrar'}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.metaDataText}>Garantía ({data.garantia_tipo}):</Text>
            <Text style={styles.metaDataBold}>{formatearCOP(data.garantia_monto)}</Text>
          </View>
        </View>

        {/* TABLA DE EQUIPOS */}
        <Text style={styles.sectionTitle}>EQUIPOS Y MAQUINARIA</Text>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <View style={styles.col1}><Text style={styles.tableCellHeader}>Equipo</Text></View>
            <View style={styles.col2}><Text style={styles.tableCellHeader}>Cant.</Text></View>
            <View style={styles.col3}><Text style={styles.tableCellHeader}>Tarifa Diaria</Text></View>
            <View style={styles.col4}><Text style={styles.tableCellHeader}>Subtotal Est.</Text></View>
          </View>
          
          {data.detalles && data.detalles.map((item: any, index: number) => (
            <View wrap={false} key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowZebra : {}]}>
              <View style={styles.col1}><Text style={styles.tableCell}>{item.nombreItem}</Text></View>
              <View style={styles.col2}><Text style={styles.tableCell}>{item.cantidad}</Text></View>
              <View style={styles.col3}><Text style={styles.tableCell}>{formatearCOP(item.tarifaAplicada)}</Text></View>
              <View style={styles.col4}><Text style={styles.tableCell}>{formatearCOP(item.subtotalLineaEstimado)}</Text></View>
            </View>
          ))}
        </View>

        {/* LOGÍSTICA */}
        {(data.observaciones || data.detalles_logistica) && (
          <View wrap={false} style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>OBSERVACIONES Y LOGÍSTICA</Text>
            {data.observaciones && <Text style={[styles.metaDataText, { marginBottom: 4 }]}>{data.observaciones}</Text>}
            {data.detalles_logistica && <Text style={styles.metaDataText}>Logística: {data.detalles_logistica}</Text>}
          </View>
        )}

        {/* TOTALES */}
        <View style={styles.totalsContainer} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.metaDataText}>Subtotal Equipos:</Text>
              <Text style={styles.totalValue}>{formatearCOP(data.subtotal_equipos)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.metaDataText}>Flete de Entrega:</Text>
              <Text style={styles.totalValue}>{formatearCOP(data.flete_entrega)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.metaDataText}>Flete de Recogida:</Text>
              <Text style={styles.totalValue}>{formatearCOP(data.flete_recogida)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.metaDataText}>Depósito / Abono:</Text>
              <Text style={[styles.totalValue, { color: '#ef4444' }]}>- {formatearCOP(data.deposito)}</Text>
            </View>
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalText}>SALDO PENDIENTE:</Text>
              <Text style={styles.totalValueFinal}>{formatearCOP(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* FIRMAS */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 50 }} wrap={false}>
          <View style={{ width: '40%', borderTopWidth: 1, borderTopColor: COLORS.textMuted, paddingTop: 5, alignItems: 'center' }}>
            <Text style={styles.metaDataBold}>Firma Cliente</Text>
            <Text style={styles.metaDataText}>C.C / NIT:</Text>
          </View>
          <View style={{ width: '40%', borderTopWidth: 1, borderTopColor: COLORS.textMuted, paddingTop: 5, alignItems: 'center' }}>
            <Text style={styles.metaDataBold}>Firma FerreOn</Text>
            <Text style={styles.metaDataText}>Autorizado</Text>
          </View>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer} fixed>
          Este documento es un comprobante de alquiler. Los equipos siguen siendo propiedad exclusiva de FerreOn.
          Generado el {new Date().toLocaleString('es-CO')}
        </Text>
      </Page>
    </Document>
  );
};
