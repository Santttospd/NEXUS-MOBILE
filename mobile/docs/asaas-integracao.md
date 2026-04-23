# Integracao Asaas no app mobile

## Decisao de arquitetura

O aplicativo **nao deve chamar a API do Asaas diretamente**. A chave `access_token` do Asaas precisa ficar no backend.

Fluxo recomendado:

1. O backend cria ou atualiza o cliente no Asaas.
2. O backend cria a cobranca no Asaas (`/v3/payments`).
3. Se a cobranca for Pix, o backend busca o QR Code (`/v3/payments/{id}/pixQrCode`).
4. O backend salva o `paymentId` do Asaas junto da taxa do morador.
5. O backend expoe `GET /api/taxas` para o app com os links e metadados necessarios.
6. O backend recebe webhooks do Asaas e atualiza o status local da taxa.

## Contrato esperado em `GET /api/taxas`

O app agora aceita o formato antigo e tambem um payload enriquecido com dados do Asaas.

Exemplo:

```json
[
  {
    "id": "taxa_abril_2026_apto_101",
    "mes": 4,
    "ano": 2026,
    "valor": 350.0,
    "vencimento": "2026-04-10",
    "status": "PENDING",
    "descricao": "Taxa condominial abril/2026",
    "asaasPaymentId": "pay_080225913252",
    "asaasCustomerId": "cus_G7Dvo4iphUNk",
    "billingType": "PIX",
    "invoiceUrl": "https://www.asaas.com/i/123456789",
    "bankSlipUrl": null,
    "pixPayload": "00020126...",
    "pixEncodedImage": "iVBORw0KGgoAAAANSUhEUgAA...",
    "pixExpirationDate": "2026-04-10",
    "externalReference": "condominio-ap101-2026-04"
  }
]
```

Campos aceitos pelo app:

- `status`: pode vir como status local (`PAGA`, `PENDENTE`, `ATRASADA`) ou status do Asaas (`RECEIVED`, `CONFIRMED`, `PENDING`, `OVERDUE`, etc).
- `billingType`: `PIX`, `BOLETO`, `CREDIT_CARD`, `DEBIT_CARD` ou `UNDEFINED`.
- `invoiceUrl`: link da fatura do Asaas.
- `bankSlipUrl`: PDF do boleto.
- `pixPayload`: codigo copia e cola.
- `pixEncodedImage`: QR Code em Base64.
- `pixQrCodeUrl`: URL do QR Code, se o backend preferir nao enviar Base64.

## Webhooks recomendados

Configure o backend para receber pelo menos os eventos:

- `PAYMENT_CREATED`
- `PAYMENT_UPDATED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`
- `PAYMENT_OVERDUE`
- `PAYMENT_REFUNDED`
- `PAYMENT_DELETED`

Regra pratica:

- sempre trate webhooks como eventos idempotentes;
- atualize a taxa local pelo `payment.id` do Asaas;
- devolva ao app somente o estado consolidado da cobranca.

## O que o app ja faz

Com as mudancas desta branch, o app:

- normaliza status do Asaas para os status exibidos na interface;
- mostra forma de pagamento na lista de taxas;
- exibe QR Code Pix, copia e cola, link de fatura e boleto na tela de detalhe;
- continua funcionando com o retorno antigo de `GET /api/taxas`.
