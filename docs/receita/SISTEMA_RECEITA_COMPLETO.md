# 💰 Sistema de Receita Movimentada - TicketPulse

**Data de Criação:** 02 de Fevereiro de 2025  
**Versão:** 1.0.0  
**Status:** ✅ Implementado e Funcional  
**Projeto:** Painel de Administrador

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Fontes de Receita](#2-fontes-de-receita)
3. [Cálculo de Receita](#3-cálculo-de-receita)
4. [Armazenamento de Dados](#4-armazenamento-de-dados)
5. [Visualizações e Relatórios](#5-visualizações-e-relatórios)
6. [Fluxo Completo de Receita](#6-fluxo-completo-de-receita)
7. [Métricas e KPIs](#7-métricas-e-kpis)
8. [Estrutura Técnica](#8-estrutura-técnica)
9. [Exemplos Práticos](#9-exemplos-práticos)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Visão Geral

O sistema de receita do TicketPulse rastreia **toda movimentação financeira** gerada através da venda de ingressos no site. A receita é calculada em tempo real e exibida em múltiplos pontos do sistema para diferentes níveis de acesso.

### 1.1 Objetivo

- ✅ Rastrear receita total do sistema
- ✅ Calcular receita por evento
- ✅ Calcular receita por produtor
- ✅ Gerar relatórios mensais
- ✅ Fornecer métricas para tomada de decisão

### 1.2 Escopo

A receita é calculada a partir de:
- **Pedidos pagos** (`orders` com `status: "paid"`)
- **Vendas de ingressos** por setor (Pista, Premium, VIP, Camarote)
- **Tipos de ingresso** (Inteira e Meia Entrada)

---

## 2. Fontes de Receita

### 2.1 Vendas de Ingressos

A receita é gerada exclusivamente através da venda de ingressos para eventos. Cada venda gera:

1. **Pedido** (`orders` collection)
   - Contém total do pedido
   - Status: `paid`, `pending`, `cancelled`
   - Método de pagamento: `pix`, `credit`

2. **Ingressos** (`tickets` collection)
   - Código único por ingresso
   - Vinculado ao pedido
   - Status: `active`, `used`, `cancelled`

### 2.2 Setores de Ingressos

O sistema suporta **4 setores** diferentes, cada um com preços próprios:

| Setor | Descrição | Preço Inteira | Preço Meia |
|-------|-----------|---------------|------------|
| **Pista** | Área geral do evento | Obrigatório | Opcional |
| **Pista Premium** | Área premium | Opcional | Opcional |
| **VIP** | Área exclusiva | Opcional | Opcional |
| **Camarote** | Vista privilegiada | Opcional | Opcional |

### 2.3 Tipos de Ingresso

Cada setor pode ter dois tipos:

- **Inteira** - Preço completo
- **Meia Entrada** - Preço reduzido (50% do preço inteira)

---

## 3. Cálculo de Receita

### 3.1 Fórmula Base

A receita é calculada usando a seguinte fórmula:

```typescript
Receita Total = Σ (Vendidos × Preço)

Onde:
- Vendidos = Quantidade de ingressos vendidos por setor
- Preço = Preço do ingresso (Inteira ou Meia)
```

### 3.2 Cálculo por Setor

Para cada setor, a receita é calculada:

```typescript
// Pista
receitaPista = soldPista × pricePistaInteira

// Pista Premium
receitaPremium = soldPremium × pricePremiumInteira

// VIP
receitaVip = soldVip × priceVipInteira

// Camarote
receitaCamarote = soldCamarote × priceCamaroteInteira
```

**Nota:** O sistema atualmente calcula receita usando apenas preços **Inteira**. A diferenciação entre Inteira e Meia Entrada no cálculo de receita pode ser implementada no futuro.

### 3.3 Cálculo Total por Evento

```typescript
receitaEvento = receitaPista + receitaPremium + receitaVip + receitaCamarote
```

### 3.4 Cálculo Total do Sistema

```typescript
receitaTotal = Σ (receitaEvento) para todos os eventos
```

**OU** (método alternativo usando pedidos):

```typescript
receitaTotal = Σ (order.total) para todos os pedidos com status = "paid"
```

---

## 4. Armazenamento de Dados

### 4.1 Collection `orders`

Armazena pedidos completos com valor total:

```typescript
{
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  total: number; // ✅ RECEITA DO PEDIDO
  status: "paid" | "pending" | "cancelled";
  paymentMethod: "pix" | "credit";
  pixPayer?: {
    name: string;
    documentType: "cpf" | "cnpj";
    document: string;
    email: string;
  };
  createdAt: Timestamp;
}
```

**Campo Chave:** `total` - Representa a receita do pedido quando `status === "paid"`

### 4.2 Collection `events`

Armazena informações de vendas por evento:

```typescript
{
  id: string;
  eventName: string;
  producerId: string;
  
  // Preços (Inteira)
  pricePistaInteira: number;
  pricePremiumInteira?: number;
  priceVipInteira?: number;
  priceCamaroteInteira?: number;
  
  // Preços (Meia)
  pricePistaMeia?: number;
  pricePremiumMeia?: number;
  priceVipMeia?: number;
  priceCamaroteMeia?: number;
  
  // Vendidos
  soldPista: number; // ✅ Usado para calcular receita
  soldPremium?: number;
  soldVip?: number;
  soldCamarote?: number;
  
  // Capacidades
  capacityPista: number;
  capacityPremium?: number;
  capacityVip?: number;
  capacityCamarote?: number;
  
  createdAt: Timestamp;
}
```

**Campos Chave para Receita:**
- `soldPista`, `soldPremium`, `soldVip`, `soldCamarote` - Quantidade vendida
- `pricePistaInteira`, `pricePremiumInteira`, etc. - Preços unitários

### 4.3 Collection `tickets`

Armazena ingressos individuais:

```typescript
{
  id: string;
  code: string; // Código único de 20 caracteres
  eventId: string;
  eventName: string;
  ticketType: string; // "Pista - Inteira", "VIP - Meia", etc.
  price: number; // ✅ Preço unitário do ingresso
  orderId: string;
  userId: string;
  status: "active" | "used" | "cancelled";
  createdAt: Timestamp;
}
```

**Campo Chave:** `price` - Preço unitário do ingresso

---

## 5. Visualizações e Relatórios

### 5.1 Painel Administrativo (`painel-bilheteria`)

**Localização:** `/dashboard`

#### 5.1.1 Card de Receita Total

```typescript
// painel-bilheteria/src/pages/Dashboard.tsx
{
  label: "Receita Total",
  value: formatCurrency(stats.totalRevenue),
  icon: DollarSign,
  color: "bg-amber-500",
  change: "+18%"
}
```

**Cálculo:**
```typescript
let totalRevenue = 0;
ordersSnap.docs.forEach((doc) => {
  const data = doc.data();
  if (data.status === "paid") {
    totalRevenue += data.total || 0;
  }
});
```

#### 5.1.2 Gráfico de Receita Mensal

**Tipo:** Bar Chart (Recharts)

**Características:**
- ✅ Gradiente roxo nas barras
- ✅ Tooltip com valor formatado e percentual do total
- ✅ Linha de referência mostrando média mensal
- ✅ Header com receita total
- ✅ Formatação inteligente (R$ 1k, R$ 1M)

**Cálculo:**
```typescript
const monthlyRevenue: Record<string, number> = {};

ordersSnap.docs.forEach((doc) => {
  const data = doc.data();
  if (data.status === "paid") {
    const date = data.createdAt?.toDate?.() || new Date();
    const month = date.toLocaleDateString("pt-BR", { month: "short" });
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (data.total || 0);
  }
});
```

**Visualização:**
- Eixo X: Meses (Jan, Fev, Mar, etc.)
- Eixo Y: Receita em R$ (formatado: R$ 1k, R$ 1M)
- Barras: Receita mensal com gradiente
- Linha: Média mensal (referência)

### 5.2 Dashboard do Produtor (`event-tickets-now`)

**Localização:** `/producer-dashboard`

#### 5.2.1 Card de Receita Total

```typescript
// event-tickets-now/src/pages/ProducerDashboard.tsx
{
  label: "Receita Total",
  value: `R$ ${totalRevenue.toFixed(2)}`,
  icon: DollarSign,
  color: "text-green-500"
}
```

**Cálculo:**
```typescript
const totalRevenue = events.reduce((acc, event) => {
  const revenuePista = (event.soldPista || 0) * (event.pricePistaInteira || event.pricePista || 0);
  const revenuePremium = (event.soldPremium || 0) * (event.pricePremiumInteira || event.pricePremium || 0);
  const revenueVip = (event.soldVip || 0) * (event.priceVipInteira || event.priceVip || 0);
  const revenueCamarote = (event.soldCamarote || 0) * (event.priceCamaroteInteira || event.priceCamarote || 0);
  return acc + revenuePista + revenuePremium + revenueVip + revenueCamarote;
}, 0);
```

#### 5.2.2 Receita por Evento

Cada card de evento mostra:

```typescript
// Receita do evento específico
const eventRevenue = 
  (event.soldPista || 0) * (event.pricePistaInteira || event.pricePista || 0) +
  (event.soldPremium || 0) * (event.pricePremiumInteira || event.pricePremium || 0) +
  (event.soldVip || 0) * (event.priceVipInteira || event.priceVip || 0) +
  (event.soldCamarote || 0) * (event.priceCamaroteInteira || event.priceCamarote || 0);
```

**Exibição:**
```
Total: R$ 1.250,00
```

### 5.3 Página de Pedidos (`painel-bilheteria`)

**Localização:** `/orders`

Lista todos os pedidos com:
- Valor total do pedido
- Status (paid, pending, cancelled)
- Data de criação
- Método de pagamento

**Filtros:**
- Por status
- Por busca (email, ID do pedido)

---

## 6. Fluxo Completo de Receita

### 6.1 Fluxo de Compra

```
1. Usuário adiciona ingressos ao carrinho
   └─> Carrinho calcula subtotal por item
       └─> Subtotal = quantidade × preço

2. Usuário vai para checkout
   └─> Sistema calcula total do pedido
       └─> Total = Σ (subtotal de cada item)

3. Usuário finaliza compra
   └─> Sistema cria pedido (orders collection)
       ├─> total: valor total do pedido
       ├─> status: "paid" (ou "pending")
       └─> createdAt: timestamp

4. Sistema atualiza estoque do evento
   └─> Incrementa soldPista, soldPremium, etc.
       └─> Baseado no ticketType de cada item

5. Sistema gera ingressos
   └─> Cria documentos em tickets collection
       └─> Cada ingresso tem price individual
```

### 6.2 Fluxo de Cálculo de Receita

#### 6.2.1 Método 1: Via Pedidos (Painel Admin)

```typescript
// 1. Buscar todos os pedidos
const ordersSnap = await getDocs(collection(db, "orders"));

// 2. Filtrar apenas pedidos pagos
let totalRevenue = 0;
ordersSnap.docs.forEach((doc) => {
  const data = doc.data();
  if (data.status === "paid") {
    totalRevenue += data.total || 0;
  }
});

// 3. Agrupar por mês (para gráfico)
const monthlyRevenue: Record<string, number> = {};
ordersSnap.docs.forEach((doc) => {
  const data = doc.data();
  if (data.status === "paid") {
    const date = data.createdAt?.toDate?.() || new Date();
    const month = date.toLocaleDateString("pt-BR", { month: "short" });
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (data.total || 0);
  }
});
```

**Vantagens:**
- ✅ Dados precisos (valor real pago)
- ✅ Inclui apenas pedidos confirmados
- ✅ Fácil agrupar por período

**Desvantagens:**
- ⚠️ Não diferencia Inteira/Meia no cálculo

#### 6.2.2 Método 2: Via Eventos (Dashboard Produtor)

```typescript
// 1. Buscar eventos do produtor
const eventsSnap = await getDocs(
  query(
    collection(db, "events"),
    where("producerId", "==", currentUser.uid)
  )
);

// 2. Calcular receita por evento
const totalRevenue = events.reduce((acc, event) => {
  const revenuePista = (event.soldPista || 0) * (event.pricePistaInteira || 0);
  const revenuePremium = (event.soldPremium || 0) * (event.pricePremiumInteira || 0);
  const revenueVip = (event.soldVip || 0) * (event.priceVipInteira || 0);
  const revenueCamarote = (event.soldCamarote || 0) * (event.priceCamaroteInteira || 0);
  return acc + revenuePista + revenuePremium + revenueVip + revenueCamarote;
}, 0);
```

**Vantagens:**
- ✅ Permite ver receita por evento
- ✅ Permite ver receita por setor
- ✅ Mais granular

**Desvantagens:**
- ⚠️ Usa apenas preço Inteira (não diferencia Meia)
- ⚠️ Pode divergir se houver cancelamentos

### 6.3 Sincronização

**Problema Potencial:**
Os dois métodos podem gerar valores diferentes se:
- Pedidos foram cancelados (orders tem `status: "cancelled"`, mas eventos ainda têm `soldX` incrementado)
- Há diferença entre preço Inteira e Meia

**Solução Atual:**
- Painel Admin usa **Método 1** (via pedidos) - mais preciso
- Dashboard Produtor usa **Método 2** (via eventos) - mais granular

**Recomendação Futura:**
- Implementar diferenciação Inteira/Meia no cálculo
- Adicionar campo `revenue` calculado em cada pedido
- Criar função de reconciliação entre métodos

---

## 7. Métricas e KPIs

### 7.1 Métricas Principais

#### 7.1.1 Receita Total

```typescript
// Total de receita movimentada no sistema
totalRevenue = Σ (pedidos pagos)
```

**Onde é exibido:**
- ✅ Painel Admin - Card "Receita Total"
- ✅ Dashboard Produtor - Card "Receita Total"

#### 7.1.2 Receita Mensal

```typescript
// Receita agrupada por mês
monthlyRevenue = {
  "Jan": 5000,
  "Fev": 7500,
  "Mar": 12000,
  // ...
}
```

**Onde é exibido:**
- ✅ Painel Admin - Gráfico de Barras "Receita Mensal"

#### 7.1.3 Receita por Evento

```typescript
// Receita de um evento específico
eventRevenue = 
  (soldPista × pricePistaInteira) +
  (soldPremium × pricePremiumInteira) +
  (soldVip × priceVipInteira) +
  (soldCamarote × priceCamaroteInteira)
```

**Onde é exibido:**
- ✅ Dashboard Produtor - Card de cada evento

#### 7.1.4 Receita por Produtor

```typescript
// Receita total de um produtor
producerRevenue = Σ (receitaEvento) para eventos do produtor
```

**Onde é exibido:**
- ✅ Dashboard Produtor - Card "Receita Total"

### 7.2 KPIs Derivados

#### 7.2.1 Ticket Médio

```typescript
ticketMedio = totalRevenue / totalTicketsSold
```

#### 7.2.2 Receita Média Mensal

```typescript
receitaMediaMensal = totalRevenue / numeroDeMeses
```

#### 7.2.3 Taxa de Conversão

```typescript
taxaConversao = (pedidosPagos / pedidosTotais) × 100
```

---

## 8. Estrutura Técnica

### 8.1 Arquivos Envolvidos

#### 8.1.1 Painel Administrativo

- `painel-bilheteria/src/pages/Dashboard.tsx`
  - Cálculo de receita total
  - Gráfico de receita mensal
  - Formatação de valores

- `painel-bilheteria/src/pages/Orders.tsx`
  - Listagem de pedidos
  - Filtros por status
  - Detalhes de cada pedido

#### 8.1.2 Site (Produtor)

- `event-tickets-now/src/pages/ProducerDashboard.tsx`
  - Cálculo de receita por evento
  - Receita total do produtor
  - Gráfico de vendas

- `event-tickets-now/src/pages/Checkout.tsx`
  - Criação de pedidos
  - Cálculo de total do pedido
  - Atualização de estoque

#### 8.1.3 Utilitários

- `painel-bilheteria/src/lib/utils.ts`
  - `formatCurrency()` - Formatação de valores em R$

- `event-tickets-now/src/lib/utils.ts`
  - `formatCurrency()` - Formatação de valores em R$

### 8.2 Funções Principais

#### 8.2.1 Cálculo de Receita Total (Admin)

```typescript
// painel-bilheteria/src/pages/Dashboard.tsx
const fetchStats = async () => {
  const ordersSnap = await getDocs(collection(db, "orders"));
  let totalRevenue = 0;
  
  ordersSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.status === "paid") {
      totalRevenue += data.total || 0;
    }
  });
  
  return totalRevenue;
};
```

#### 8.2.2 Cálculo de Receita por Evento (Produtor)

```typescript
// event-tickets-now/src/pages/ProducerDashboard.tsx
const calculateEventRevenue = (event: EventStats): number => {
  const revenuePista = (event.soldPista || 0) * (event.pricePistaInteira || event.pricePista || 0);
  const revenuePremium = (event.soldPremium || 0) * (event.pricePremiumInteira || event.pricePremium || 0);
  const revenueVip = (event.soldVip || 0) * (event.priceVipInteira || event.priceVip || 0);
  const revenueCamarote = (event.soldCamarote || 0) * (event.priceCamaroteInteira || event.priceCamarote || 0);
  
  return revenuePista + revenuePremium + revenueVip + revenueCamarote;
};
```

#### 8.2.3 Formatação de Moeda

```typescript
// src/lib/utils.ts
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};
```

**Exemplos:**
- `formatCurrency(3990)` → `"R$ 3.990,00"`
- `formatCurrency(1250.5)` → `"R$ 1.250,50"`

---

## 9. Exemplos Práticos

### 9.1 Exemplo 1: Evento Simples

**Evento:** Show de Rock
- **Pista Inteira:** R$ 50,00
- **Pista Meia:** R$ 25,00
- **Vendidos Pista:** 100 ingressos

**Cálculo de Receita:**
```typescript
// Método atual (usa apenas Inteira)
receita = 100 × 50 = R$ 5.000,00

// Método ideal (diferencia Inteira/Meia)
// Assumindo 70 inteiras e 30 meias:
receita = (70 × 50) + (30 × 25) = 3.500 + 750 = R$ 4.250,00
```

**Diferença:** R$ 750,00 (15% de diferença)

### 9.2 Exemplo 2: Evento Completo

**Evento:** Festival de Música
- **Pista Inteira:** R$ 80,00 | Vendidos: 200
- **Premium Inteira:** R$ 120,00 | Vendidos: 50
- **VIP Inteira:** R$ 200,00 | Vendidos: 20
- **Camarote Inteira:** R$ 500,00 | Vendidos: 5

**Cálculo de Receita:**
```typescript
receitaPista = 200 × 80 = R$ 16.000,00
receitaPremium = 50 × 120 = R$ 6.000,00
receitaVip = 20 × 200 = R$ 4.000,00
receitaCamarote = 5 × 500 = R$ 2.500,00

receitaTotal = 16.000 + 6.000 + 4.000 + 2.500 = R$ 28.500,00
```

### 9.3 Exemplo 3: Receita Mensal

**Janeiro:**
- Pedido 1: R$ 500,00 (paid)
- Pedido 2: R$ 1.200,00 (paid)
- Pedido 3: R$ 300,00 (pending) ❌ Não conta

**Receita Janeiro:**
```typescript
receitaJaneiro = 500 + 1.200 = R$ 1.700,00
```

**Fevereiro:**
- Pedido 4: R$ 800,00 (paid)
- Pedido 5: R$ 2.000,00 (paid)

**Receita Fevereiro:**
```typescript
receitaFevereiro = 800 + 2.000 = R$ 2.800,00
```

**Receita Total:**
```typescript
receitaTotal = 1.700 + 2.800 = R$ 4.500,00
```

---

## 10. Troubleshooting

### 10.1 Problemas Comuns

#### 10.1.1 Receita Zero no Dashboard

**Sintomas:**
- Card mostra "R$ 0,00"
- Gráfico vazio

**Causas Possíveis:**
1. Nenhum pedido com `status: "paid"`
2. Erro ao buscar pedidos do Firestore
3. Firebase não configurado

**Solução:**
```typescript
// Verificar pedidos
const ordersSnap = await getDocs(collection(db, "orders"));
console.log("Total de pedidos:", ordersSnap.size);

ordersSnap.docs.forEach((doc) => {
  const data = doc.data();
  console.log("Pedido:", doc.id, "Status:", data.status, "Total:", data.total);
});
```

#### 10.1.2 Divergência entre Métodos

**Sintomas:**
- Receita no Painel Admin ≠ Receita no Dashboard Produtor

**Causas Possíveis:**
1. Pedidos cancelados ainda contam nos eventos
2. Diferença entre preço Inteira e Meia
3. Erro no cálculo

**Solução:**
```typescript
// Reconciliar receita
const ordersRevenue = // Calcular via pedidos
const eventsRevenue = // Calcular via eventos
const difference = Math.abs(ordersRevenue - eventsRevenue);

if (difference > 0.01) {
  console.warn("Divergência detectada:", difference);
  // Investigar pedidos cancelados ou preços diferentes
}
```

#### 10.1.3 Gráfico Não Atualiza

**Sintomas:**
- Gráfico mostra dados antigos
- Novos pedidos não aparecem

**Causas Possíveis:**
1. Cache do React Query
2. `useEffect` não re-executa
3. Dados não são recarregados

**Solução:**
```typescript
// Forçar atualização
const [refreshKey, setRefreshKey] = useState(0);

useEffect(() => {
  fetchStats();
}, [refreshKey]);

// Botão de refresh
<button onClick={() => setRefreshKey(prev => prev + 1)}>
  Atualizar
</button>
```

### 10.2 Validações

#### 10.2.1 Validar Receita Calculada

```typescript
// Verificar se receita é positiva
if (totalRevenue < 0) {
  console.error("Receita negativa detectada!");
}

// Verificar se receita não é NaN
if (isNaN(totalRevenue)) {
  console.error("Receita é NaN!");
}

// Verificar se receita não é Infinity
if (!isFinite(totalRevenue)) {
  console.error("Receita é Infinity!");
}
```

#### 10.2.2 Validar Dados de Pedidos

```typescript
ordersSnap.docs.forEach((doc) => {
  const data = doc.data();
  
  // Validar campos obrigatórios
  if (!data.total || data.total <= 0) {
    console.warn("Pedido sem total válido:", doc.id);
  }
  
  if (!data.status) {
    console.warn("Pedido sem status:", doc.id);
  }
  
  if (!data.createdAt) {
    console.warn("Pedido sem data:", doc.id);
  }
});
```

---

## 11. Melhorias Futuras

### 11.1 Diferenciação Inteira/Meia

**Problema Atual:**
- Receita calculada usando apenas preço Inteira
- Não diferencia vendas de Meia Entrada

**Solução Proposta:**
```typescript
// Adicionar campo revenue em cada pedido
{
  total: 500,
  revenue: {
    inteira: 400,  // 8 ingressos × R$ 50
    meia: 100      // 4 ingressos × R$ 25
  }
}
```

### 11.2 Relatórios Avançados

- Receita por categoria de evento
- Receita por método de pagamento
- Receita por período (diário, semanal, mensal, anual)
- Comparação período a período
- Previsão de receita

### 11.3 Exportação de Dados

- Exportar receita para CSV
- Exportar receita para PDF
- Enviar relatórios por email

---

## 12. Conclusão

O sistema de receita do TicketPulse é **robusto e funcional**, rastreando toda movimentação financeira através de:

1. ✅ **Pedidos pagos** - Fonte primária de receita
2. ✅ **Vendas por evento** - Granularidade por evento
3. ✅ **Relatórios mensais** - Visualização temporal
4. ✅ **Múltiplas visualizações** - Admin e Produtor

**Próximos Passos:**
- Implementar diferenciação Inteira/Meia
- Adicionar relatórios avançados
- Criar exportação de dados

---

**Última Atualização:** 02 de Fevereiro de 2025  
**Próxima Revisão:** Após implementação de diferenciação Inteira/Meia
