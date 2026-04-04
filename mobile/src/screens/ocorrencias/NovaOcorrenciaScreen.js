import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';
import api from '../../api/client';

const TIPOS = [
  'Manutenção', 'Segurança', 'Limpeza', 'Barulho',
  'Infraestrutura', 'Iluminação', 'Vazamento', 'Outro',
];

const PRIORIDADES = [
  { key: 'ALTA', label: 'Alta', color: Colors.danger },
  { key: 'MEDIA', label: 'Média', color: Colors.warning },
  { key: 'BAIXA', label: 'Baixa', color: Colors.success },
];

export function NovaOcorrenciaScreen({ navigation }) {
  const [tipo, setTipo] = useState('');
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('MEDIA');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function validate() {
    const errs = {};
    if (!tipo) errs.tipo = 'Selecione o tipo de ocorrência';
    if (!local.trim()) errs.local = 'Informe o local';
    if (!descricao.trim() || descricao.trim().length < 10)
      errs.descricao = 'Descrição deve ter ao menos 10 caracteres';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post('/api/ocorrencias', {
        tipo,
        local: local.trim(),
        descricao: descricao.trim(),
        prioridade,
      });
      Alert.alert('Sucesso', 'Ocorrência registrada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao registrar ocorrência');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Tipo */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Tipo de Ocorrência *</Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.tipo && styles.inputError]}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Text style={[styles.dropdownText, !tipo && styles.placeholder]}>
                {tipo || 'Selecione o tipo...'}
              </Text>
              <Ionicons name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            {errors.tipo && <Text style={styles.errorText}>{errors.tipo}</Text>}

            {dropdownOpen && (
              <View style={styles.dropdownList}>
                {TIPOS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.dropdownItem, tipo === t && styles.dropdownItemActive]}
                    onPress={() => { setTipo(t); setDropdownOpen(false); }}
                  >
                    <Text style={[styles.dropdownItemText, tipo === t && styles.dropdownItemTextActive]}>
                      {t}
                    </Text>
                    {tipo === t && <Ionicons name="checkmark" size={16} color={Colors.white} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Input
            label="Local *"
            value={local}
            onChangeText={setLocal}
            placeholder="Ex: Corredor do bloco A, Piscina..."
            autoCapitalize="sentences"
            error={errors.local}
          />

          <Input
            label="Descrição *"
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Descreva detalhadamente o problema..."
            multiline
            numberOfLines={4}
            autoCapitalize="sentences"
            error={errors.descricao}
          />

          {/* Prioridade */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Prioridade</Text>
            <View style={styles.prioridadeRow}>
              {PRIORIDADES.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.prioridadeBtn,
                    { borderColor: p.color },
                    prioridade === p.key && { backgroundColor: p.color },
                  ]}
                  onPress={() => setPrioridade(p.key)}
                >
                  <Text
                    style={[
                      styles.prioridadeText,
                      { color: p.color },
                      prioridade === p.key && { color: Colors.white },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button title="Registrar Ocorrência" onPress={handleSubmit} loading={loading} style={styles.btn} />
          <Button title="Cancelar" onPress={() => navigation.goBack()} variant="outline" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  fieldWrapper: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  inputError: { borderColor: Colors.danger },
  dropdownText: { fontSize: 15, color: Colors.text },
  placeholder: { color: Colors.textLight },
  errorText: { marginTop: 4, fontSize: 12, color: Colors.danger },
  dropdownList: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemActive: { backgroundColor: Colors.primary },
  dropdownItemText: { fontSize: 14, color: Colors.text },
  dropdownItemTextActive: { color: Colors.white, fontWeight: '600' },
  prioridadeRow: { flexDirection: 'row', gap: 10 },
  prioridadeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  prioridadeText: { fontSize: 14, fontWeight: '600' },
  btn: { marginBottom: 12 },
});
