# NEXUS — Sistema de Gestão Condominial

Portal do Morador: app mobile (Expo) + API backend (Node.js + Prisma + PostgreSQL).

---

## Estrutura do projeto

```
NEXUS-MOBILE/
├── backend/          # API REST Node.js + Express + Prisma
└── mobile/           # App React Native (Expo)
```

---

## Backend

> O backend é o projeto **NEXUS-WEBSITE** (`/home/psant/NEXUS-WEBSITE/backend`).
> A pasta `backend/` dentro deste repositório foi criada por engano e deve ser ignorada.

### Iniciar o backend (NEXUS-WEBSITE)

```bash
cd ../NEXUS-WEBSITE/backend
npm run dev   # porta 3000
```

### Endpoints da API usados pelo app

| Método | Rota                              | Descrição                                  |
|--------|-----------------------------------|--------------------------------------------|
| POST   | /api/auth/login                   | Login (retorna token + refreshToken)       |
| GET    | /api/moradores/me                 | Perfil completo do morador logado          |
| GET    | /api/taxas                        | Taxas do morador (filtrado pelo JWT)       |
| GET    | /api/ocorrencias                  | Ocorrências do morador                     |
| GET    | /api/ocorrencias/:id              | Detalhe de ocorrência                      |
| POST   | /api/ocorrencias                  | Criar ocorrência                           |
| GET    | /api/areas-lazer                  | Listar áreas disponíveis                   |
| GET    | /api/reservas                     | Reservas do morador                        |
| POST   | /api/reservas                     | Criar reserva (periodo: MANHA/TARDE/DIA_INTEIRO) |
| PATCH  | /api/reservas/:id/cancelar        | Cancelar reserva                           |
| GET    | /api/reservas/disponibilidade     | Períodos disponíveis por data              |

---

## Mobile (Expo)

### Pré-requisitos
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go instalado no celular (ou emulador Android/iOS)

### Setup

```bash
cd mobile
npm install
```

### Configurar URL da API

Edite `src/api/client.js` e altere `BASE_URL`:

- **Emulador Android:** `http://10.0.2.2:3333`
- **Emulador iOS / Web:** `http://localhost:3333`
- **Dispositivo físico:** `http://SEU_IP_LOCAL:3333`
  (descubra seu IP com `ipconfig` no Windows ou `ifconfig` no Linux/Mac)

### Iniciar

```bash
npm start
# ou
npx expo start
```

Escaneie o QR Code com o Expo Go.

---

## Telas do app

1. **Login** — autenticação com e-mail e senha
2. **Dashboard** — saudação, cards de acesso rápido, alertas de taxa em atraso / ocorrência aberta
3. **Financeiro** — lista de mensalidades com status colorido (Paga/Pendente/Atrasada) + detalhe
4. **Ocorrências** — lista com filtros por status, detalhe, formulário para nova ocorrência
5. **Reservas** — próximas reservas + histórico, fluxo de 4 passos para nova reserva, cancelamento
6. **Perfil** — dados do morador e logout
