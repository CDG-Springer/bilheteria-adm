# 📊 Página de Detalhes de Receita - Painel Administrativo

**Data de Criação:** 02 de Fevereiro de 2025  
**Versão:** 1.0.0  
**Status:** ✅ Implementado e Funcional

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Funcionalidades](#2-funcionalidades)
3. [Estrutura da Página](#3-estrutura-da-página)
4. [Filtros e Períodos](#4-filtros-e-períodos)
5. [Métricas Exibidas](#5-métricas-exibidas)
6. [Gráficos e Visualizações](#6-gráficos-e-visualizações)
7. [Tabelas de Dados](#7-tabelas-de-dados)
8. [Estrutura Técnica](#8-estrutura-técnica)

---

## 1. Visão Geral

A página de **Detalhes de Receita** é uma subcategoria completa do painel administrativo que fornece uma análise detalhada e abrangente de toda a receita movimentada no sistema TicketPulse.

### 1.1 Objetivo

- ✅ Visualizar receita total e detalhada
- ✅ Analisar receita por período (mensal, trimestral, anual)
- ✅ Identificar receita por categoria de evento
- ✅ Analisar receita por método de pagamento
- ✅ Identificar top produtores por receita
- ✅ Visualizar pedidos recentes

### 1.2 Localização

**Rota:** `/revenue`  
**Menu:** Sidebar → "Receita" (ícone DollarSign)  
**Acesso:** Apenas administradores

---

## 2. Funcionalidades

### 2.1 Filtros de Período

- ✅ **Todos** - Exibe toda a receita histórica
- ✅ **Último Mês** - Receita dos últimos 30 dias
- ✅ **Último Trimestre** - Receita dos últimos 3 meses
- ✅ **Último Ano** - Receita dos últimos 12 meses
- ✅ **Período Customizado** - Seleção de data inicial e final

### 2.2 Métricas Principais

- ✅ **Receita Total** - Soma de todos os pedidos pagos
- ✅ **Ticket Médio** - Valor médio por pedido
- ✅ **Total de Pedidos** - Quantidade de pedidos pagos
- ✅ **Categorias** - Número de categorias com receita

### 2.3 Visualizações

- ✅ **Gráfico de Receita Mensal** - Barras com gradiente roxo
- ✅ **Receita por Categoria** - Gráfico de pizza
- ✅ **Receita por Método de Pagamento** - Gráfico de pizza
- ✅ **Top 10 Produtores** - Lista ordenada por receita
- ✅ **Tabela de Pedidos Recentes** - Últimos 10 pedidos pagos

### 2.4 Ações

- ✅ **Atualizar Dados** - Botão de refresh
- ✅ **Exportar** - Botão para exportar dados (em desenvolvimento)

---

## 3. Estrutura da Página

### 3.1 Layout

```
┌─────────────────────────────────────────────────┐
│ Header (Título + Botões)                        │
├─────────────────────────────────────────────────┤
│ Filtros (Período + Data Customizada)            │
├─────────────────────────────────────────────────┤
│ Cards de Resumo (4 cards)                      │
├─────────────────────────────────────────────────┤
│ Gráficos (2x2 grid)                             │
│  ├─ Receita Mensal (Bar Chart)                 │
│  ├─ Receita por Categoria (Pie Chart)          │
│  ├─ Receita por Método (Pie Chart)             │
│  └─ Top 10 Produtores (Lista)                  │
├─────────────────────────────────────────────────┤
│ Tabela de Pedidos Recentes                      │
└─────────────────────────────────────────────────┘
```

### 3.2 Seções

#### 3.2.1 Header

- **Título:** "Detalhes de Receita" com ícone DollarSign
- **Descrição:** "Análise completa da receita movimentada no sistema"
- **Botões:**
  - Atualizar (RefreshCw)
  - Exportar (Download)

#### 3.2.2 Filtros

- **Período:** Dropdown com opções (Todos, Último Mês, Trimestre, Ano)
- **Período Customizado:** Dois inputs de data (início e fim)

#### 3.2.3 Cards de Resumo

4 cards em grid responsivo:
1. Receita Total (ícone DollarSign, cor amber)
2. Ticket Médio (ícone TrendingUp, cor purple)
3. Total de Pedidos (ícone BarChart3, cor blue)
4. Categorias (ícone PieChart, cor green)

#### 3.2.4 Gráficos

Grid 2x2 com:
1. **Receita Mensal** - Bar Chart com gradiente
2. **Receita por Categoria** - Pie Chart colorido
3. **Receita por Método de Pagamento** - Pie Chart colorido
4. **Top 10 Produtores** - Lista ordenada

#### 3.2.5 Tabela de Pedidos

Tabela com colunas:
- ID (truncado)
- Cliente (email)
- Valor (formatado)
- Data (formatada)
- Status (badge)

---

## 4. Filtros e Períodos

### 4.1 Filtro por Período

```typescript
type PeriodFilter = "all" | "month" | "quarter" | "year";
```

**Lógica de Filtro:**
```typescript
if (periodFilter === "month") {
  // Últimos 30 dias
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  return orderDate >= monthAgo;
}

if (periodFilter === "quarter") {
  // Últimos 3 meses
  const quarterAgo = new Date(now);
  quarterAgo.setMonth(quarterAgo.getMonth() - 3);
  return orderDate >= quarterAgo;
}

if (periodFilter === "year") {
  // Últimos 12 meses
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  return orderDate >= yearAgo;
}
```

### 4.2 Período Customizado

```typescript
interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}
```

**Lógica:**
```typescript
if (dateRange.start && dateRange.end) {
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  end.setHours(23, 59, 59); // Incluir todo o dia final
  return orderDate >= start && orderDate <= end;
}
```

### 4.3 Aplicação de Filtros

Os filtros são aplicados em tempo real através de `useEffect`:

```typescript
useEffect(() => {
  fetchRevenueData();
}, [periodFilter, dateRange]);
```

---

## 5. Métricas Exibidas

### 5.1 Receita Total

```typescript
const totalRevenue = paidOrders.reduce(
  (acc, order) => acc + (order.total || 0),
  0
);
```

**Exibição:**
- Valor formatado: `R$ 3.990,00`
- Contador de pedidos: `X pedidos`

### 5.2 Ticket Médio

```typescript
const averageOrderValue = totalOrders > 0 
  ? totalRevenue / totalOrders 
  : 0;
```

**Exibição:**
- Valor formatado: `R$ 125,50`
- Label: "Por pedido"

### 5.3 Total de Pedidos

```typescript
const totalOrders = paidOrders.length;
```

**Exibição:**
- Número: `150`
- Label: "Pedidos pagos"

### 5.4 Categorias

```typescript
const categoriesCount = stats.revenueByCategory.length;
```

**Exibição:**
- Número: `8`
- Label: "Com receita"

---

## 6. Gráficos e Visualizações

### 6.1 Receita Mensal (Bar Chart)

**Tipo:** Bar Chart (Recharts)

**Características:**
- ✅ Gradiente roxo nas barras
- ✅ Tooltip com valor formatado
- ✅ Formatação inteligente do eixo Y (R$ 1k, R$ 1M)
- ✅ Grid horizontal apenas

**Dados:**
```typescript
{
  name: "Jan", // Mês capitalizado
  revenue: 5000.00 // Arredondado para 2 casas decimais
}
```

**Ordenação:**
- Ordenado por mês (jan, fev, mar, etc.)
- Usa `monthMap` para ordenação numérica

### 6.2 Receita por Categoria (Pie Chart)

**Tipo:** Pie Chart (Recharts)

**Características:**
- ✅ Cores diferentes por categoria
- ✅ Labels com percentual
- ✅ Tooltip com valor formatado
- ✅ Legend

**Cálculo:**
```typescript
// Para cada evento, calcular receita
const eventRevenue = 
  (soldPista × pricePistaInteira) +
  (soldPremium × pricePremiumInteira) +
  (soldVip × priceVipInteira) +
  (soldCamarote × priceCamaroteInteira);

// Agrupar por categoria
revenueByCategory[category] += eventRevenue;
```

**Ordenação:**
- Ordenado por valor (maior para menor)

### 6.3 Receita por Método de Pagamento (Pie Chart)

**Tipo:** Pie Chart (Recharts)

**Características:**
- ✅ Cores diferentes por método
- ✅ Labels com percentual
- ✅ Tooltip com valor formatado
- ✅ Legend

**Cálculo:**
```typescript
paidOrders.forEach((order) => {
  const method = order.paymentMethod || "unknown";
  revenueByPaymentMethod[method] += order.total;
});
```

**Métodos:**
- `pix` → "PIX"
- `credit` → "Cartão"
- `unknown` → "Desconhecido"

### 6.4 Top 10 Produtores (Lista)

**Tipo:** Lista ordenada

**Características:**
- ✅ Top 10 produtores por receita
- ✅ Ranking numérico (1-10)
- ✅ Nome do produtor
- ✅ Número de eventos
- ✅ Receita total
- ✅ Percentual do total

**Cálculo:**
```typescript
// Para cada evento, calcular receita
const eventRevenue = /* cálculo por evento */;

// Agrupar por produtor
revenueByProducer[producerId].value += eventRevenue;
revenueByProducer[producerId].events += 1;

// Buscar nome do produtor em users collection
// Ordenar por receita (maior para menor)
// Limitar a top 10
```

**Exibição:**
```
┌─────────────────────────────────────┐
│ 1  Produtor A    R$ 5.000,00       │
│    3 evento(s)   25.0%              │
├─────────────────────────────────────┤
│ 2  Produtor B    R$ 3.500,00       │
│    2 evento(s)   17.5%              │
└─────────────────────────────────────┘
```

---

## 7. Tabelas de Dados

### 7.1 Tabela de Pedidos Recentes

**Colunas:**
1. **ID** - Primeiros 8 caracteres do ID do pedido
2. **Cliente** - Email do usuário
3. **Valor** - Total do pedido formatado
4. **Data** - Data de criação formatada
5. **Status** - Badge colorido (verde para "paid")

**Ordenação:**
- Ordenado por data (mais recente primeiro)
- Limitado a 10 pedidos

**Formatação:**
```typescript
// ID
order.id.slice(0, 8) + "..."

// Data
formatDate(order.createdAt.toDate())
// Resultado: "02/02/2025, 14:30"

// Status
<span className="bg-green-500/20 text-green-400">
  Pago
</span>
```

---

## 8. Estrutura Técnica

### 8.1 Arquivo Principal

**Localização:** `painel-bilheteria/src/pages/Revenue.tsx`

**Tamanho:** ~700 linhas

**Dependências:**
- `react` - Hooks (useState, useEffect)
- `firebase/firestore` - getDocs, collection, query
- `recharts` - Gráficos
- `lucide-react` - Ícones
- `@/lib/utils` - formatCurrency, formatDate

### 8.2 Interface TypeScript

```typescript
interface RevenueStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  monthlyRevenue: Array<{ name: string; revenue: number }>;
  revenueByCategory: Array<{ name: string; value: number }>;
  revenueByPaymentMethod: Array<{ name: string; value: number }>;
  revenueByProducer: Array<{
    name: string;
    value: number;
    events: number;
  }>;
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: any;
    userEmail: string;
  }>;
}
```

### 8.3 Função Principal

```typescript
const fetchRevenueData = async () => {
  // 1. Buscar pedidos
  // 2. Aplicar filtros
  // 3. Calcular métricas
  // 4. Agrupar dados
  // 5. Buscar eventos e usuários
  // 6. Calcular receita por categoria/produtor
  // 7. Atualizar estado
};
```

### 8.4 Rotas

**Adicionado em:** `painel-bilheteria/src/App.tsx`

```typescript
<Route path="/revenue" element={<Revenue />} />
```

### 8.5 Menu

**Adicionado em:** `painel-bilheteria/src/components/AdminSidebar.tsx`

```typescript
{ icon: DollarSign, label: "Receita", path: "/revenue" }
```

**Posição:** Após "Dashboard", antes de "Usuários"

---

## 9. Performance

### 9.1 Otimizações

- ✅ Filtros aplicados no frontend (após buscar dados)
- ✅ Limitação de top 10 produtores
- ✅ Limitação de 10 pedidos recentes
- ✅ Cálculos realizados uma vez por renderização

### 9.2 Melhorias Futuras

- [ ] Cache de dados com React Query
- [ ] Paginação na tabela de pedidos
- [ ] Lazy loading de gráficos
- [ ] Filtros aplicados no backend (queries do Firestore)

---

## 10. Exemplos de Uso

### 10.1 Visualizar Receita do Mês

1. Acessar `/revenue`
2. Selecionar "Último Mês" no filtro
3. Visualizar cards e gráficos atualizados

### 10.2 Analisar Receita por Categoria

1. Acessar `/revenue`
2. Visualizar gráfico "Receita por Categoria"
3. Identificar categoria com maior receita
4. Ver percentual no tooltip

### 10.3 Identificar Top Produtores

1. Acessar `/revenue`
2. Visualizar seção "Top 10 Produtores"
3. Ver receita total e número de eventos
4. Ver percentual da receita total

---

## 11. Troubleshooting

### 11.1 Dados Não Carregam

**Sintomas:**
- Loading infinito
- Cards vazios

**Solução:**
```typescript
// Verificar console para erros
console.error("Error fetching revenue data:", error);

// Verificar se Firebase está configurado
if (!db) {
  console.error("Firebase não configurado");
}
```

### 11.2 Gráficos Vazios

**Sintomas:**
- Gráficos mostram "Nenhuma receita"

**Causas:**
- Nenhum pedido com `status: "paid"`
- Filtro muito restritivo
- Período sem pedidos

**Solução:**
- Verificar filtros aplicados
- Tentar período mais amplo
- Verificar pedidos no Firestore

---

## 12. Conclusão

A página de **Detalhes de Receita** fornece uma visão completa e detalhada de toda a receita movimentada no sistema, permitindo:

- ✅ Análise por período
- ✅ Visualização por categoria
- ✅ Identificação de top produtores
- ✅ Análise de métodos de pagamento
- ✅ Acompanhamento de pedidos recentes

**Status:** ✅ Implementado e Funcional

---

**Última Atualização:** 02 de Fevereiro de 2025  
**Próxima Revisão:** Após implementação de exportação
