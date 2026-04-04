import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const BADGE_CONFIG = {
  // Taxa
  PAGA:       { bg: Colors.pagoLight,     text: Colors.pago,     label: 'Paga' },
  PENDENTE:   { bg: Colors.pendenteLight, text: Colors.pendente,  label: 'Pendente' },
  ATRASADA:   { bg: Colors.atrasadoLight, text: Colors.atrasado,  label: 'Atrasada' },

  // Ocorrência status
  ABERTA:       { bg: Colors.infoLight,    text: Colors.info,    label: 'Aberta' },
  EM_ANALISE:   { bg: Colors.pendenteLight,text: Colors.pendente, label: 'Em Análise' },
  EM_ANDAMENTO: { bg: Colors.infoLight,    text: Colors.info,    label: 'Em Andamento' },
  RESOLVIDA:    { bg: Colors.pagoLight,    text: Colors.pago,    label: 'Resolvida' },
  FECHADA:      { bg: '#f3f4f6',           text: '#6b7280',      label: 'Fechada' },

  // Ocorrência prioridade
  ALTA:  { bg: Colors.dangerLight,  text: Colors.danger,  label: 'Alta' },
  MEDIA: { bg: Colors.warningLight, text: Colors.warning,  label: 'Média' },
  BAIXA: { bg: Colors.successLight, text: Colors.success, label: 'Baixa' },

  // Reserva
  CONFIRMADA: { bg: Colors.pagoLight,     text: Colors.pago,     label: 'Confirmada' },
  CANCELADA:  { bg: '#f3f4f6',            text: '#6b7280',       label: 'Cancelada' },
};

export function Badge({ status, label: labelOverride, style }) {
  const config = BADGE_CONFIG[status] || {
    bg: '#f3f4f6',
    text: '#6b7280',
    label: status || '—',
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.text, { color: config.text }]}>
        {labelOverride || config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
