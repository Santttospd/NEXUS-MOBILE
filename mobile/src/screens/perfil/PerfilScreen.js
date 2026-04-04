import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

function InfoItem({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export function PerfilScreen() {
  const { user, signOut } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Busca dados completos do morador
  useEffect(() => {
    if (user?.moradorId) {
      api.get('/api/moradores/me')
        .then((res) => setPerfil(res.data))
        .catch(() => null); // usa dados do token como fallback
    }
  }, [user]);

  const dados = perfil || user;

  function handleLogout() {
    Alert.alert(
      'Sair',
      'Deseja encerrar sua sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await signOut();
          },
        },
      ]
    );
  }

  const iniciais = dados?.nome
    ? dados.nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{iniciais}</Text>
          </View>
          <Text style={styles.nome}>{dados?.nome || 'Morador'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {dados?.bloco && dados?.unidade && (
            <View style={styles.unidadeBadge}>
              <Ionicons name="home-outline" size={14} color={Colors.primary} />
              <Text style={styles.unidadeText}>
                Bloco {dados.bloco} · Unidade {dados.unidade}
              </Text>
            </View>
          )}
        </View>

        {/* Dados cadastrais */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Dados cadastrais</Text>
          <InfoItem icon="person-outline" label="Nome completo" value={dados?.nome} />
          <InfoItem icon="mail-outline" label="E-mail" value={user?.email} />
          <InfoItem icon="call-outline" label="Telefone" value={dados?.telefone} />
          <InfoItem icon="home-outline" label="Bloco" value={dados?.bloco} />
          <InfoItem icon="business-outline" label="Unidade" value={dados?.unidade} />
          <InfoItem icon="card-outline" label="CPF" value={dados?.cpf} />
        </Card>

        {/* App info */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Sobre o app</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Versão</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Sistema</Text>
              <Text style={styles.infoValue}>NEXUS Portal do Morador</Text>
            </View>
          </View>
        </Card>

        <Button
          title="Sair da conta"
          variant="danger"
          onPress={handleLogout}
          loading={loggingOut}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: Colors.white },
  nome: { fontSize: 22, fontWeight: '800', color: Colors.text },
  email: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  unidadeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unidadeText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  card: { marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  infoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 1 },
  logoutBtn: { marginTop: 8 },
});
