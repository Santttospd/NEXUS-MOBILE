import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/colors';
import api from '../../api/client';

const MODULES = [
  {
    key: 'FinanceiroTab',
    icon: 'wallet-outline',
    label: 'Financeiro',
    color: Colors.primary,
    description: 'Taxas e mensalidades',
  },
  {
    key: 'OcorrenciasTab',
    icon: 'alert-circle-outline',
    label: 'Ocorrências',
    color: '#e91e63',
    description: 'Problemas e solicitações',
  },
  {
    key: 'ReservasTab',
    icon: 'calendar-outline',
    label: 'Reservas',
    color: '#00897b',
    description: 'Áreas de lazer',
  },
  {
    key: 'PerfilTab',
    icon: 'person-outline',
    label: 'Perfil',
    color: '#7b1fa2',
    description: 'Seus dados cadastrais',
  },
];

export function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [alertas, setAlertas] = useState({ taxaAtrasada: false, ocorrenciaAberta: false });
  const [refreshing, setRefreshing] = useState(false);

  const primeiroNome = (user?.nome || 'Morador').split(' ')[0];
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  const carregarAlertas = useCallback(async () => {
    if (!user?.moradorId && user?.role !== 'ADMIN') return;
    try {
      const [taxasRes, ocorrRes] = await Promise.allSettled([
        api.get('/api/taxas'),
        api.get('/api/ocorrencias'),
      ]);

      const taxas = taxasRes.status === 'fulfilled' ? taxasRes.value.data : [];
      const ocorrencias = ocorrRes.status === 'fulfilled' ? ocorrRes.value.data : [];

      setAlertas({
        taxaAtrasada: taxas.some((t) => t.status === 'ATRASADA'),
        ocorrenciaAberta: ocorrencias.some((o) =>
          ['ABERTA', 'EM_ANALISE', 'EM_ANDAMENTO'].includes(o.status)
        ),
      });
    } catch {
      // silencia erros de alerta
    }
  }, [user]);

  useEffect(() => {
    carregarAlertas();
  }, [carregarAlertas]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregarAlertas();
    setRefreshing(false);
  }, [carregarAlertas]);

  function getAlertaIcon(key) {
    if (key === 'FinanceiroTab' && alertas.taxaAtrasada) return true;
    if (key === 'OcorrenciasTab' && alertas.ocorrenciaAberta) return true;
    return false;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.saudacao}>{saudacao},</Text>
            <Text style={styles.nome}>{primeiroNome}!</Text>
          </View>
          {user?.bloco && user?.unidade && (
            <View style={styles.unidadeBox}>
              <Ionicons name="home" size={14} color={Colors.white} />
              <Text style={styles.unidade}>
                Bloco {user.bloco} · Ap {user.unidade}
              </Text>
            </View>
          )}
        </View>

        {/* Alertas */}
        {(alertas.taxaAtrasada || alertas.ocorrenciaAberta) && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning-outline" size={18} color={Colors.warning} />
            <Text style={styles.alertText}>
              {alertas.taxaAtrasada && 'Você possui taxa(s) em atraso. '}
              {alertas.ocorrenciaAberta && 'Há ocorrências abertas.'}
            </Text>
          </View>
        )}

        {/* Cards */}
        <Text style={styles.sectionTitle}>Acesso rápido</Text>
        <View style={styles.grid}>
          {MODULES.map((mod) => {
            const temAlerta = getAlertaIcon(mod.key);
            return (
              <TouchableOpacity
                key={mod.key}
                style={styles.moduleCard}
                onPress={() => navigation.navigate(mod.key)}
                activeOpacity={0.85}
              >
                <View style={[styles.moduleIcon, { backgroundColor: mod.color + '18' }]}>
                  <Ionicons name={mod.icon} size={28} color={mod.color} />
                  {temAlerta && <View style={styles.badgeDot} />}
                </View>
                <Text style={styles.moduleLabel}>{mod.label}</Text>
                <Text style={styles.moduleDesc}>{mod.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Para suporte, contate a administração do condomínio.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  saudacao: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  nome: { fontSize: 26, fontWeight: '800', color: Colors.white },
  unidadeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  unidade: { fontSize: 12, color: Colors.white, fontWeight: '600' },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  alertText: { flex: 1, fontSize: 13, color: '#92400e', fontWeight: '500' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  moduleCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  moduleIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  moduleLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  moduleDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  infoCard: { margin: 16, marginTop: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary },
});
