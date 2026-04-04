import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/Badge';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import api from '../../api/client';

const FILTROS = [
  { key: null, label: 'Todas' },
  { key: 'ABERTA', label: 'Abertas' },
  { key: 'EM_ANALISE', label: 'Em Análise' },
  { key: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { key: 'RESOLVIDA', label: 'Resolvidas' },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function OcorrenciasScreen({ navigation }) {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [filtroAtivo, setFiltroAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setError(null);
      const params = filtroAtivo ? { status: filtroAtivo } : {};
      const res = await api.get('/api/ocorrencias', { params });
      setOcorrencias(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar ocorrências');
    }
  }, [filtroAtivo]);

  useEffect(() => {
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }, [carregar]);

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
          {FILTROS.map((f) => (
            <TouchableOpacity
              key={String(f.key)}
              style={[styles.filtroBtn, filtroAtivo === f.key && styles.filtroAtivo]}
              onPress={() => { setFiltroAtivo(f.key); setLoading(true); }}
            >
              <Text style={[styles.filtroText, filtroAtivo === f.key && styles.filtroTextAtivo]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={32} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={ocorrencias}
          keyExtractor={(item) => item.id}
          contentContainerStyle={ocorrencias.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="alert-circle-outline"
              title="Nenhuma ocorrência"
              message="Você não possui ocorrências registradas."
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('OcorrenciaDetalhe', { id: item.id })}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTipo}>{item.tipo}</Text>
                <Badge status={item.prioridade} />
              </View>
              <Text style={styles.cardLocal} numberOfLines={1}>
                <Ionicons name="location-outline" size={12} color={Colors.textSecondary} /> {item.local}
              </Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.descricao}</Text>
              <View style={styles.cardFooter}>
                <Badge status={item.status} />
                <Text style={styles.cardData}>{formatDate(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NovaOcorrencia')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  filtrosContainer: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filtros: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filtroBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filtroAtivo: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtroText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filtroTextAtivo: { color: Colors.white },
  list: { padding: 16, paddingBottom: 80 },
  emptyContainer: { flex: 1, paddingBottom: 80 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTipo: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  cardLocal: { fontSize: 12, color: Colors.textSecondary },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardData: { fontSize: 11, color: Colors.textLight },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  errorText: { color: Colors.danger, fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
