import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/Badge';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import {
  listTaxas,
  getResumoTaxas,
  formatCurrency,
  formatDate,
} from '../../services/financeiro';

const MESES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function FinanceiroScreen({ navigation }) {
  const [taxas, setTaxas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setError(null);
      const data = await listTaxas();
      setTaxas(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar taxas');
    }
  }, []);

  useEffect(() => {
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }, [carregar]);

  const resumo = getResumoTaxas(taxas);

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Resumo */}
      <View style={styles.resumoContainer}>
        <View style={styles.resumoCard}>
          <Text style={styles.resumoNum}>{resumo.pagas}</Text>
          <Text style={styles.resumoLabel}>Pagas</Text>
        </View>
        <View style={[styles.resumoCard, resumo.pendentes > 0 && styles.resumoWarn]}>
          <Text style={styles.resumoNum}>{resumo.pendentes}</Text>
          <Text style={styles.resumoLabel}>Pendentes</Text>
        </View>
        <View style={[styles.resumoCard, resumo.atrasadas > 0 && styles.resumoDanger]}>
          <Text style={styles.resumoNum}>{resumo.atrasadas}</Text>
          <Text style={styles.resumoLabel}>Atrasadas</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={32} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={taxas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={taxas.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState icon="wallet-outline" title="Nenhuma taxa encontrada" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.taxaCard}
              onPress={() => navigation.navigate('TaxaDetalhe', { taxa: item })}
              activeOpacity={0.85}
            >
              <View style={styles.taxaLeft}>
                <Text style={styles.taxaMes}>{MESES[item.mes] || 'Taxa'} {item.ano || ''}</Text>
                <Text style={styles.taxaVenc}>
                  Venc. {formatDate(item.vencimento)}
                </Text>
                {item.asaas?.billingTypeLabel ? (
                  <Text style={styles.taxaMetodo}>
                    {item.asaas.billingTypeLabel}
                    {item.asaas.paymentId ? ' via Asaas' : ''}
                  </Text>
                ) : null}
              </View>
              <View style={styles.taxaRight}>
                <Text style={styles.taxaValor}>{formatCurrency(item.valor)}</Text>
                <Badge status={item.status} />
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} style={styles.chevron} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  resumoContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  resumoCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resumoWarn: { backgroundColor: Colors.warningLight },
  resumoDanger: { backgroundColor: Colors.dangerLight },
  resumoNum: { fontSize: 24, fontWeight: '800', color: Colors.text },
  resumoLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyContainer: { flex: 1 },
  taxaCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taxaLeft: { flex: 1 },
  taxaMes: { fontSize: 15, fontWeight: '700', color: Colors.text },
  taxaVenc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  taxaMetodo: { fontSize: 12, color: Colors.info, marginTop: 4, fontWeight: '600' },
  taxaRight: { alignItems: 'flex-end', gap: 4 },
  taxaValor: { fontSize: 16, fontWeight: '700', color: Colors.text },
  chevron: { marginLeft: 6 },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  errorText: { color: Colors.danger, fontSize: 14 },
});
