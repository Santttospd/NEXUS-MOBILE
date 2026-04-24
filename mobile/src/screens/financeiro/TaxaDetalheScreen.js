import React from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/colors';
import { formatCurrency, formatDate } from '../../services/financeiro';

const MESES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

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
  const possuiDadosAsaas = Boolean(
    taxa.asaas?.paymentId ||
    taxa.asaas?.pixPayload ||
    taxa.asaas?.bankSlipUrl ||
    taxa.asaas?.invoiceUrl
  );

  const statusColors = {
    PAGA: { bg: Colors.pagoLight, icon: 'checkmark-circle', color: Colors.pago },
    PENDENTE: { bg: Colors.pendenteLight, icon: 'time', color: Colors.pendente },
    ATRASADA: { bg: Colors.dangerLight, icon: 'alert-circle', color: Colors.atrasado },
    PROCESSANDO: { bg: Colors.infoLight, icon: 'reload-circle', color: Colors.info },
    ESTORNADA: { bg: '#f3f4f6', icon: 'return-down-back', color: '#6b7280' },
    CANCELADA: { bg: '#f3f4f6', icon: 'close-circle', color: '#6b7280' },
  };

  const sc = statusColors[taxa.status] || statusColors.PENDENTE;

  async function openExternalUrl(url) {
    if (!url) return;

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Link indisponivel', 'Nao foi possivel abrir este link no dispositivo.');
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert('Erro ao abrir link', 'Tente novamente em instantes.');
    }
  }

  async function sharePixPayload() {
    if (!taxa.asaas?.pixPayload) return;

    try {
      await Share.share({
        message: `Pix copia e cola\n\n${taxa.asaas.pixPayload}`,
      });
    } catch {
      Alert.alert('Erro ao compartilhar', 'Nao foi possivel compartilhar o codigo Pix.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.statusBanner, { backgroundColor: sc.bg }]}>
          <Ionicons name={sc.icon} size={40} color={sc.color} />
          <Text style={[styles.statusLabel, { color: sc.color }]}>
            {MESES[taxa.mes] || 'Taxa'} {taxa.ano || ''}
          </Text>
          <Text style={[styles.statusValor, { color: sc.color }]}>
            {formatCurrency(taxa.valor)}
          </Text>
          <Badge status={taxa.status} style={styles.statusBadge} />
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Detalhes da Cobrança</Text>
          <InfoRow
            icon="calendar-outline"
            label="Competência"
            value={`${MESES[taxa.mes] || '-'} / ${taxa.ano || '-'}`}
          />
          <InfoRow icon="cash-outline" label="Valor" value={formatCurrency(taxa.valor)} />
          <InfoRow icon="time-outline" label="Vencimento" value={formatDate(taxa.vencimento)} />
          {taxa.asaas?.billingTypeLabel && (
            <InfoRow
              icon="card-outline"
              label="Forma de pagamento"
              value={taxa.asaas.billingTypeLabel}
            />
          )}
          {taxa.pagoEm && (
            <InfoRow icon="checkmark-circle-outline" label="Pago em" value={formatDate(taxa.pagoEm)} />
          )}
          {taxa.descricao && (
            <InfoRow icon="document-text-outline" label="Descricao" value={taxa.descricao} />
          )}
        </Card>

        {possuiDadosAsaas && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Integracao Asaas</Text>
            {taxa.asaas?.paymentId && (
              <InfoRow icon="link-outline" label="ID da cobranca" value={taxa.asaas.paymentId} />
            )}
            {taxa.asaas?.customerId && (
              <InfoRow icon="person-outline" label="ID do cliente" value={taxa.asaas.customerId} />
            )}
            {taxa.asaas?.externalReference && (
              <InfoRow
                icon="pricetag-outline"
                label="Referencia externa"
                value={taxa.asaas.externalReference}
              />
            )}
            {taxa.asaas?.nossoNumero && (
              <InfoRow icon="barcode-outline" label="Nosso numero" value={taxa.asaas.nossoNumero} />
            )}
            {taxa.statusOriginal && taxa.statusOriginal !== taxa.status && (
              <InfoRow
                icon="swap-horizontal-outline"
                label="Status original"
                value={taxa.statusOriginal}
              />
            )}
          </Card>
        )}

        {taxa.asaas?.pixQrCodeImage || taxa.asaas?.pixPayload ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Pix</Text>
            {taxa.asaas?.pixQrCodeImage ? (
              <Image
                source={{ uri: taxa.asaas.pixQrCodeImage }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : null}

            {taxa.asaas?.pixExpirationDate && (
              <View style={styles.pixMetaRow}>
                <Ionicons name="timer-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.pixMetaText}>
                  Expira em {formatDate(taxa.asaas.pixExpirationDate)}
                </Text>
              </View>
            )}

            {taxa.asaas?.pixPayload ? (
              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>Codigo copia e cola</Text>
                <Text style={styles.codeValue}>{taxa.asaas.pixPayload}</Text>
              </View>
            ) : null}

            {taxa.asaas?.pixPayload ? (
              <Button
                title="Compartilhar codigo Pix"
                onPress={sharePixPayload}
                style={styles.actionButton}
              />
            ) : null}
          </Card>
        ) : null}

        {taxa.asaas?.invoiceUrl || taxa.asaas?.bankSlipUrl ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Acoes de pagamento</Text>
            {taxa.asaas?.invoiceUrl ? (
              <Button
                title="Abrir fatura no Asaas"
                onPress={() => openExternalUrl(taxa.asaas.invoiceUrl)}
                style={styles.actionButton}
              />
            ) : null}
            {taxa.asaas?.bankSlipUrl ? (
              <Button
                title="Abrir boleto"
                variant="outline"
                onPress={() => openExternalUrl(taxa.asaas.bankSlipUrl)}
                style={styles.actionButton}
              />
            ) : null}
          </Card>
        ) : null}

        {taxa.observacao ? (
          <View style={[styles.avisoBox, styles.infoBox]}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
            <Text style={[styles.avisoText, styles.infoText]}>
              {taxa.observacao}
            </Text>
          </View>
        ) : null}

        {taxa.status === 'ATRASADA' && (
          <View style={styles.avisoBox}>
            <Ionicons name="warning-outline" size={20} color={Colors.atrasado} />
            <Text style={styles.avisoText}>
              Esta taxa esta em atraso. Entre em contato com a administracao para regularizar sua situacao.
            </Text>
          </View>
        )}

        {!possuiDadosAsaas && ['PENDENTE', 'ATRASADA'].includes(taxa.status) && (
          <View style={[styles.avisoBox, styles.warningBox]}>
            <Ionicons name="wallet-outline" size={20} color={Colors.warning} />
            <Text style={[styles.avisoText, styles.warningText]}>
              O app ainda nao recebeu links de pagamento desta cobranca. Para usar o Asaas aqui, o backend precisa enviar os dados da fatura, boleto ou Pix.
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
  qrImage: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
  },
  pixMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  pixMetaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  codeBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  codeValue: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  actionButton: {
    marginTop: 8,
  },
  avisoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.dangerLight, borderRadius: 12, padding: 14 },
  infoBox: { backgroundColor: Colors.infoLight },
  warningBox: { backgroundColor: Colors.warningLight },
  avisoText: { flex: 1, fontSize: 13, color: Colors.atrasado },
  infoText: { color: Colors.info },
  warningText: { color: '#92400e' },
});
