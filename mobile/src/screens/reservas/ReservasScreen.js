import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/Badge';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import api from '../../api/client';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });
}

export function ReservasScreen({ navigation }) {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/api/reservas');
      setReservas(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar reservas');
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

  async function handleCancelar(reserva) {
    Alert.alert(
      'Cancelar reserva',
      `Deseja cancelar a reserva de ${reserva.areaLazer?.nome}?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/api/reservas/${reserva.id}/cancelar`);
              await carregar();
            } catch (err) {
              Alert.alert('Erro', err.response?.data?.error || 'Erro ao cancelar reserva');
            }
          },
        },
      ]
    );
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const futuras = reservas.filter(
    (r) => new Date(r.data) >= hoje && r.status !== 'CANCELADA'
  );
  const historico = reservas.filter(
    (r) => new Date(r.data) < hoje || r.status === 'CANCELADA'
  );

  if (loading) return <Loading />;

  function renderReserva({ item }) {
    const isFutura = new Date(item.data) >= hoje && item.status !== 'CANCELADA';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.areaIcon}>
            <Ionicons
              name={
                item.areaLazer?.nome?.toLowerCase().includes('piscina')
                  ? 'water-outline'
                  : item.areaLazer?.nome?.toLowerCase().includes('churrasco')
                  ? 'flame-outline'
                  : 'business-outline'
              }
              size={22}
              color={Colors.primary}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.areaNome}>{item.areaLazer?.nome || 'Área'}</Text>
            <Text style={styles.cardData}>{formatDate(item.data)}</Text>
          </View>
          <Badge status={item.status} />
        </View>
        <View style={styles.horarioRow}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.horario}>{item.horarioInicio} — {item.horarioFim}</Text>
        </View>
        {isFutura && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleCancelar(item)}
          >
            <Ionicons name="close-circle-outline" size={14} color={Colors.danger} />
            <Text style={styles.cancelText}>Cancelar reserva</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={32} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => 'placeholder'}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <>
              {futuras.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Próximas Reservas</Text>
                  {futuras.map((r) => (
                    <View key={r.id}>{renderReserva({ item: r })}</View>
                  ))}
                </>
              )}
              {historico.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Histórico</Text>
                  {historico.map((r) => (
                    <View key={r.id}>{renderReserva({ item: r })}</View>
                  ))}
                </>
              )}
              {reservas.length === 0 && (
                <EmptyState
                  icon="calendar-outline"
                  title="Nenhuma reserva"
                  message="Você ainda não fez nenhuma reserva de área de lazer."
                />
              )}
            </>
          }
          renderItem={() => null}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NovaReserva')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 90 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10, marginTop: 8 },
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
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  areaIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  areaNome: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardData: { fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
  horarioRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  horario: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  cancelText: { fontSize: 12, color: Colors.danger, fontWeight: '600' },
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
