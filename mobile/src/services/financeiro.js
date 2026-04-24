import api from '../api/client';

const ASAAS_STATUS_MAP = {
  RECEIVED: 'PAGA',
  CONFIRMED: 'PAGA',
  RECEIVED_IN_CASH: 'PAGA',
  PENDING: 'PENDENTE',
  AWAITING_RISK_ANALYSIS: 'PENDENTE',
  AWAITING_CHARGEBACK_REVERSAL: 'PENDENTE',
  OVERDUE: 'ATRASADA',
  REFUNDED: 'ESTORNADA',
  PARTIALLY_REFUNDED: 'ESTORNADA',
  REFUND_IN_PROGRESS: 'PROCESSANDO',
  DELETED: 'CANCELADA',
};

const BILLING_TYPE_LABELS = {
  PIX: 'Pix',
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartao de credito',
  DEBIT_CARD: 'Cartao de debito',
  UNDEFINED: 'A definir',
};

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function toMonthYear(dateValue) {
  if (!dateValue) return {};

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return {};

  return {
    mes: date.getMonth() + 1,
    ano: date.getFullYear(),
  };
}

function normalizeStatus(raw) {
  if (!raw) return 'PENDENTE';
  return ASAAS_STATUS_MAP[raw] || raw;
}

function normalizeBillingType(raw) {
  if (!raw) return null;
  return String(raw).toUpperCase();
}

function buildPixImageUri(encodedImage, imageUrl) {
  if (imageUrl) return imageUrl;
  if (!encodedImage) return null;
  return `data:image/png;base64,${encodedImage}`;
}

function normalizeAsaasDetails(raw) {
  const asaas = raw?.asaas || raw?.payment || raw?.cobranca || {};
  const billingType = normalizeBillingType(
    firstValue(raw.billingType, raw.metodoPagamento, asaas.billingType, asaas.metodoPagamento)
  );

  return {
    paymentId: firstValue(
      raw.asaasPaymentId,
      raw.paymentId,
      raw.cobrancaId,
      asaas.paymentId,
      asaas.id
    ),
    customerId: firstValue(raw.asaasCustomerId, raw.customerId, asaas.customer, asaas.customerId),
    invoiceUrl: firstValue(raw.invoiceUrl, raw.faturaUrl, asaas.invoiceUrl, asaas.faturaUrl),
    bankSlipUrl: firstValue(
      raw.bankSlipUrl,
      raw.boletoUrl,
      raw.bankSlipPdfUrl,
      asaas.bankSlipUrl,
      asaas.boletoUrl
    ),
    pixPayload: firstValue(
      raw.pixPayload,
      raw.pixCopiaECola,
      raw.pixCode,
      asaas.pixPayload,
      asaas.payload
    ),
    pixQrCodeImage: buildPixImageUri(
      firstValue(raw.pixEncodedImage, asaas.encodedImage),
      firstValue(raw.pixQrCodeImage, raw.pixQrCodeUrl, asaas.pixQrCodeImage, asaas.pixQrCodeUrl)
    ),
    pixExpirationDate: firstValue(
      raw.pixExpirationDate,
      raw.pixExpiresAt,
      asaas.expirationDate,
      asaas.pixExpirationDate
    ),
    billingType,
    billingTypeLabel: BILLING_TYPE_LABELS[billingType] || billingType || 'Nao informado',
    externalReference: firstValue(
      raw.externalReference,
      raw.referenciaExterna,
      asaas.externalReference
    ),
    nossoNumero: firstValue(raw.nossoNumero, asaas.nossoNumero),
  };
}

export function normalizeTaxa(raw = {}) {
  const vencimento = firstValue(raw.vencimento, raw.dueDate, raw.dataVencimento);
  const fallbackCompetencia = toMonthYear(vencimento);
  const asaas = normalizeAsaasDetails(raw);
  const originalStatus = firstValue(raw.asaasStatus, raw.paymentStatus, raw.status);

  return {
    id: String(
      firstValue(
        raw.id,
        raw._id,
        asaas.paymentId,
        `${vencimento || 'taxa'}-${firstValue(raw.valor, raw.value, raw.amount, '0')}`
      )
    ),
    mes: toNumber(firstValue(raw.mes, fallbackCompetencia.mes), null),
    ano: toNumber(firstValue(raw.ano, fallbackCompetencia.ano), null),
    valor: toNumber(firstValue(raw.valor, raw.value, raw.amount)),
    vencimento,
    pagoEm: firstValue(raw.pagoEm, raw.paymentDate, raw.clientPaymentDate),
    status: normalizeStatus(originalStatus),
    statusOriginal: originalStatus || null,
    descricao: firstValue(raw.descricao, raw.description, raw.nome),
    observacao: firstValue(raw.observacao, raw.observacoes, raw.notes),
    asaas,
  };
}

export async function listTaxas() {
  const response = await api.get('/api/taxas');
  const taxas = Array.isArray(response.data) ? response.data : [];
  return taxas.map(normalizeTaxa);
}

export function getResumoTaxas(taxas = []) {
  return {
    total: taxas.length,
    pagas: taxas.filter((taxa) => taxa.status === 'PAGA').length,
    pendentes: taxas.filter((taxa) => taxa.status === 'PENDENTE').length,
    atrasadas: taxas.filter((taxa) => taxa.status === 'ATRASADA').length,
  };
}

export function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('pt-BR');
}
