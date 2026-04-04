import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/colors';

const MESES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export function TaxaDetalheScreen({ route }) {
  const { taxa } = route.params;

  const statusColors = {
    PAGA: { bg: Colors.pagoLight, icon: 'checkmark-circle', color: Colors.pago },
    PENDENTE: { bg: Colors.pendenteLight, icon: 'time', color: Colors.pendente },
    ATRASADA: { bg: Colors.dangerLight, icon: 'alert-circle', color: Colors.atrasado },
  };

  const sc = statusColors[taxa.status] || statusColors.PENDENTE;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: sc.bg }]}>
          <Ionicons name={sc.icon} size={40} color={sc.color} />
          <Text style={[styles.statusLabel, { color: sc.color }]}>
            {MESES[taxa.mes]} {taxa.ano}
          </Text>
          <Text style={[styles.statusValor, { color: sc.color }]}>
            {formatCurrency(taxa.valor)}
          </Text>
          <Badge status={taxa.status} style={styles.statusBadge} />
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Detalhes da Cobrança</Text>
          <InfoRow icon="calendar-outline" label="Competência" value={`${MESES[taxa.mes]}/${taxa.ano}`} />
          <InfoRow icon="cash-outline" label="Valor" value={formatCurrency(taxa.valor)} />
          <InfoRow icon="time-outline" label="Vencimento" value={formatDate(taxa.vencimento)} />
          {taxa.pagoEm && (
            <InfoRow icon="checkmark-circle-outline" label="Pago em" value={formatDate(taxa.pagoEm)} />
          )}
        </Card>

        {taxa.status === 'ATRASADA' && (
          <View style={styles.avisoBox}>
            <Ionicons name="warning-outline" size={20} color={Colors.atrasado} />
            <Text style={styles.avisoText}>
              Esta taxa está em atraso. Entre em contato com a administração para regularizar sua situação.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  statusBanner: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statusLabel: { fontSize: 20, fontWeight: '700' },
  statusValor: { fontSize: 32, fontWeight: '900' },
  statusBadge: { marginTop: 4 },
  card: { marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: Colors.textSecondary },
  infoValue: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 1 },
  avisoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.dangerLight, borderRadius: 12, padding: 14 },
  avisoText: { flex: 1, fontSize: 13, color: Colors.atrasado },
});
