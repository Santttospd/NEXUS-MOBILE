import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/colors';
import api from '../../api/client';

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

export function OcorrenciaDetalheScreen({ route }) {
  const { id } = route.params;
  const [ocorrencia, setOcorrencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/api/ocorrencias/${id}`)
      .then((res) => setOcorrencia(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Erro ao carregar ocorrência'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !ocorrencia) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={Colors.danger} />
        <Text style={styles.errorText}>{error || 'Ocorrência não encontrada'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.tipo}>{ocorrencia.tipo}</Text>
            <Badge status={ocorrencia.prioridade} />
          </View>
          <View style={styles.statusRow}>
            <Badge status={ocorrencia.status} />
          </View>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Informações</Text>
          <InfoRow icon="location-outline" label="Local" value={ocorrencia.local} />
          <InfoRow icon="calendar-outline" label="Aberta em" value={formatDate(ocorrencia.createdAt)} />
          {ocorrencia.resolvidoEm && (
            <InfoRow icon="checkmark-circle-outline" label="Resolvida em" value={formatDate(ocorrencia.resolvidoEm)} />
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.descricao}>{ocorrencia.descricao}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tipo: { fontSize: 20, fontWeight: '800', color: Colors.text, flex: 1 },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  descricao: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  errorText: { color: Colors.danger, fontSize: 14 },
});
