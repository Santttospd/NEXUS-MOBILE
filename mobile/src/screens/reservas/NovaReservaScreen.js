import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';
import api from '../../api/client';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const PERIODOS = [
  {
    key: 'MANHA',
    label: 'Manhã',
    horario: '08h – 12h',
    icon: 'sunny-outline',
  },
  {
    key: 'TARDE',
    label: 'Tarde',
    horario: '13h – 18h',
    icon: 'partly-sunny-outline',
  },
  {
    key: 'DIA_INTEIRO',
    label: 'Dia inteiro',
    horario: '08h – 18h',
    icon: 'calendar-outline',
  },
];

const AREAS_PERMITIDAS = ['SALAO DE FESTAS', 'CHURRASQUEIRA'];

function normalizeAreaName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function isAreaReservavel(area) {
  const normalized = normalizeAreaName(area?.nome);
  return AREAS_PERMITIDAS.some((allowed) => normalized.includes(allowed));
}

function getAreaIconName(areaName) {
  const normalized = normalizeAreaName(areaName);

  if (normalized.includes('CHURRASQUEIRA')) {
    return 'flame-outline';
  }

  if (normalized.includes('SALAO')) {
    return 'wine-outline';
  }

  return 'business-outline';
}

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function NovaReservaScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1=área, 2=data, 3=período, 4=confirmação
  const [areas, setAreas] = useState([]);
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [periodoSelecionado, setPeriodoSelecionado] = useState(null);
  const [convidados, setConvidados] = useState('0');
  const [disponibilidade, setDisponibilidade] = useState(null);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  useEffect(() => {
    api.get('/api/areas-lazer')
      .then((res) => setAreas((res.data || []).filter(isAreaReservavel)))
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar áreas de lazer'))
      .finally(() => setLoadingAreas(false));
  }, []);

  useEffect(() => {
    if (!areaSelecionada || !dataSelecionada) return;
    setLoadingDisp(true);
    setPeriodoSelecionado(null);
    api.get('/api/reservas/disponibilidade', {
      params: { areaId: areaSelecionada.id, data: dataSelecionada },
    })
      .then((res) => setDisponibilidade(res.data))
      .catch(() => setDisponibilidade(null))
      .finally(() => setLoadingDisp(false));
  }, [areaSelecionada, dataSelecionada]);

  async function handleConfirmar() {
    setSubmitting(true);
    try {
      await api.post('/api/reservas', {
        areaLazerId: areaSelecionada.id,
        data: dataSelecionada,
        periodo: periodoSelecionado,
        convidados: parseInt(convidados) || 0,
      });
      Alert.alert(
        'Reserva realizada!',
        `${areaSelecionada.nome} reservada para ${formatDataLabel(dataSelecionada)} (${PERIODOS.find(p => p.key === periodoSelecionado)?.label}).`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao criar reserva');
    } finally {
      setSubmitting(false);
    }
  }

  function formatDataLabel(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  }

  function isPeriodoDisponivel(key) {
    if (!disponibilidade) return false;
    return disponibilidade.periodosDisponiveis?.includes(key) ?? false;
  }

  // ── Step 1: Escolher área ─────────────────────────────────────
  function renderStep1() {
    if (loadingAreas) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />;
    if (areas.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-clear-outline" size={40} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>Nenhuma área disponível</Text>
          <Text style={styles.emptyText}>
            No momento, apenas Salão de Festas e Churrasqueira podem ser reservados.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepLabel}>Escolha a área de lazer:</Text>
        {areas.map((area) => (
          <TouchableOpacity
            key={area.id}
            style={[styles.areaCard, areaSelecionada?.id === area.id && styles.areaCardActive]}
            onPress={() => { setAreaSelecionada(area); setStep(2); }}
            activeOpacity={0.85}
          >
            <Ionicons
              name={getAreaIconName(area.nome)}
              size={28}
              color={areaSelecionada?.id === area.id ? Colors.white : Colors.primary}
            />
            <View style={styles.areaInfo}>
              <Text style={[styles.areaNome, areaSelecionada?.id === area.id && styles.areaTextoActive]}>
                {area.nome}
              </Text>
              <Text style={[styles.areaDescSmall, areaSelecionada?.id === area.id && styles.areaTextoActive]}>
                Capacidade: {area.capacidade} pessoas
              </Text>
              {area.descricao && (
                <Text style={[styles.areaDescSmall, areaSelecionada?.id === area.id && styles.areaTextoActive]}>
                  {area.descricao}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // ── Step 2: Calendário ────────────────────────────────────────
  function renderStep2() {
    const days = buildCalendarDays(calYear, calMonth);
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepLabel}>Escolha a data:</Text>
        <View style={styles.calHeader}>
          <TouchableOpacity
            onPress={() => {
              if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
              else setCalMonth(calMonth - 1);
            }}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.calTitle}>{MESES_ABREV[calMonth]} {calYear}</Text>
          <TouchableOpacity
            onPress={() => {
              if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
              else setCalMonth(calMonth + 1);
            }}
          >
            <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.calGrid}>
          {DIAS_SEMANA.map((d) => (
            <Text key={d} style={styles.calDayHeader}>{d}</Text>
          ))}
          {days.map((day, idx) => {
            if (!day) return <View key={`e-${idx}`} style={styles.calCell} />;
            const dateStr = toDateStr(calYear, calMonth, day);
            const dayDate = new Date(dateStr + 'T00:00:00');
            const isDisabled = dayDate < hoje;
            const isSelected = dataSelecionada === dateStr;
            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.calCell,
                  isSelected && styles.calSelected,
                  isDisabled && styles.calDisabled,
                ]}
                onPress={() => {
                  if (isDisabled) return;
                  setDataSelecionada(dateStr);
                  setStep(3);
                }}
                disabled={isDisabled}
              >
                <Text style={[
                  styles.calDay,
                  isSelected && styles.calDaySelected,
                  isDisabled && styles.calDayDisabled,
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  // ── Step 3: Período ───────────────────────────────────────────
  function renderStep3() {
    if (loadingDisp) {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepLabel}>Verificando disponibilidade...</Text>
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        </View>
      );
    }

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepLabel}>Escolha o período:</Text>
        <Text style={styles.stepHint}>{formatDataLabel(dataSelecionada)}</Text>

        {PERIODOS.map((p) => {
          const disponivel = isPeriodoDisponivel(p.key);
          const selecionado = periodoSelecionado === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.periodoCard,
                selecionado && styles.periodoCardActive,
                !disponivel && styles.periodoCardOcupado,
              ]}
              onPress={() => {
                if (!disponivel) return;
                setPeriodoSelecionado(p.key);
                setStep(4);
              }}
              disabled={!disponivel}
              activeOpacity={0.85}
            >
              <Ionicons
                name={p.icon}
                size={26}
                color={selecionado ? Colors.white : !disponivel ? Colors.textLight : Colors.primary}
              />
              <View style={styles.periodoInfo}>
                <Text style={[
                  styles.periodoLabel,
                  selecionado && styles.periodoTextoActive,
                  !disponivel && styles.periodoTextoOcupado,
                ]}>
                  {p.label}
                </Text>
                <Text style={[
                  styles.periodoHorario,
                  selecionado && styles.periodoTextoActive,
                  !disponivel && styles.periodoTextoOcupado,
                ]}>
                  {p.horario}
                </Text>
              </View>
              {!disponivel && (
                <View style={styles.ocupadoBadge}>
                  <Text style={styles.ocupadoText}>Ocupado</Text>
                </View>
              )}
              {disponivel && !selecionado && (
                <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
              )}
              {selecionado && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // ── Step 4: Confirmação ───────────────────────────────────────
  function renderStep4() {
    const periodoInfo = PERIODOS.find((p) => p.key === periodoSelecionado);
    return (
      <View style={styles.stepContent}>
        <View style={styles.confirmCard}>
          <Ionicons name="checkmark-circle" size={52} color={Colors.success} />
          <Text style={styles.confirmTitle}>Confirmar reserva?</Text>

          <View style={styles.confirmRow}>
            <Ionicons name="business-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.confirmText}>{areaSelecionada?.nome}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.confirmText}>{formatDataLabel(dataSelecionada)}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Ionicons name={periodoInfo?.icon || 'time-outline'} size={16} color={Colors.textSecondary} />
            <Text style={styles.confirmText}>
              {periodoInfo?.label} ({periodoInfo?.horario})
            </Text>
          </View>
        </View>

        {/* Número de convidados */}
        <View style={styles.convidadosBox}>
          <Text style={styles.convidadosLabel}>Número de convidados</Text>
          <View style={styles.convidadosRow}>
            <TouchableOpacity
              style={styles.convidadoBtn}
              onPress={() => setConvidados(String(Math.max(0, parseInt(convidados || 0) - 1)))}
            >
              <Ionicons name="remove" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.convidadosInput}
              value={convidados}
              onChangeText={(v) => setConvidados(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={3}
            />
            <TouchableOpacity
              style={styles.convidadoBtn}
              onPress={() => {
                const max = areaSelecionada?.capacidade || 99;
                setConvidados(String(Math.min(max, parseInt(convidados || 0) + 1)));
              }}
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.convidadosHint}>
            Capacidade máxima: {areaSelecionada?.capacidade} pessoas
          </Text>
        </View>

        <Button title="Confirmar Reserva" onPress={handleConfirmar} loading={submitting} style={styles.btn} />
        <Button title="Voltar" onPress={() => setStep(3)} variant="outline" />
      </View>
    );
  }

  const stepLabels = ['Área', 'Data', 'Período', 'Confirmar'];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Progress steps */}
      <View style={styles.stepsBar}>
        {stepLabels.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <View key={label} style={styles.stepItem}>
              <View style={[styles.stepCircle, active && styles.stepActive, done && styles.stepDone]}>
                {done
                  ? <Ionicons name="checkmark" size={14} color={Colors.white} />
                  : <Text style={[styles.stepNum, (active || done) && styles.stepNumActive]}>{n}</Text>
                }
              </View>
              <Text style={[styles.stepName, active && styles.stepNameActive]}>{label}</Text>
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      {step > 1 && step < 4 && (
        <View style={styles.backBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <Ionicons name="arrow-back" size={18} color={Colors.primary} />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  stepsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: { backgroundColor: Colors.primary },
  stepDone: { backgroundColor: Colors.success },
  stepNum: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  stepNumActive: { color: Colors.white },
  stepName: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  stepNameActive: { color: Colors.primary },
  scroll: { padding: 16, paddingBottom: 80 },
  stepContent: { gap: 12 },
  stepLabel: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  stepHint: { fontSize: 13, color: Colors.textSecondary, textTransform: 'capitalize' },
  emptyBox: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  // Área
  areaCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  areaCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  areaInfo: { flex: 1 },
  areaNome: { fontSize: 16, fontWeight: '700', color: Colors.text },
  areaDescSmall: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  areaTextoActive: { color: Colors.white },
  // Calendário
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  calTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayHeader: { width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '700', color: Colors.textSecondary, paddingVertical: 6 },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  calSelected: { backgroundColor: Colors.primary, borderRadius: 100 },
  calDisabled: { opacity: 0.3 },
  calDay: { fontSize: 14, fontWeight: '500', color: Colors.text },
  calDaySelected: { color: Colors.white, fontWeight: '800' },
  calDayDisabled: { color: Colors.textLight },
  // Período
  periodoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodoCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodoCardOcupado: { backgroundColor: Colors.background, borderColor: Colors.border, opacity: 0.6 },
  periodoInfo: { flex: 1 },
  periodoLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  periodoHorario: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  periodoTextoActive: { color: Colors.white },
  periodoTextoOcupado: { color: Colors.textLight },
  ocupadoBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ocupadoText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  // Confirmação
  confirmCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  // Convidados
  convidadosBox: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  convidadosLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  convidadosRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  convidadoBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convidadosInput: {
    width: 60,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  convidadosHint: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  btn: { marginBottom: 10 },
  backBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 12,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', padding: 4 },
  backText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
