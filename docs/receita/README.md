# 💰 Documentação - Sistema de Receita

**Categoria:** Receita Movimentada  
**Data de Criação:** 02 de Fevereiro de 2025  
**Projeto:** Painel de Administrador

---

## 📚 Documentos Disponíveis

### 1. [Sistema de Receita Completo](./SISTEMA_RECEITA_COMPLETO.md)

Documentação completa e detalhada sobre o sistema de receita movimentada no TicketPulse.

**Conteúdo:**
- ✅ Visão geral do sistema
- ✅ Fontes de receita
- ✅ Cálculo de receita (fórmulas e exemplos)
- ✅ Armazenamento de dados
- ✅ Visualizações e relatórios
- ✅ Fluxo completo de receita
- ✅ Métricas e KPIs
- ✅ Estrutura técnica
- ✅ Exemplos práticos
- ✅ Troubleshooting

### 2. [Página de Detalhes de Receita](./PAGINA_DETALHES_RECEITA.md)

Documentação da página de detalhes de receita no painel administrativo.

**Conteúdo:**
- ✅ Visão geral da página
- ✅ Funcionalidades e filtros
- ✅ Estrutura da página
- ✅ Métricas exibidas
- ✅ Gráficos e visualizações
- ✅ Tabelas de dados
- ✅ Estrutura técnica
- ✅ Exemplos de uso

---

## 🎯 Resumo Rápido

### O que é rastreado?

- **Receita Total** - Soma de todos os pedidos pagos
- **Receita Mensal** - Agrupada por mês
- **Receita por Evento** - Calculada por evento
- **Receita por Produtor** - Soma de eventos do produtor

### Onde é exibido?

1. **Painel Administrativo** (`/dashboard`)
   - Card "Receita Total"
   - Gráfico "Receita Mensal"

2. **Dashboard do Produtor** (`/producer-dashboard`)
   - Card "Receita Total"
   - Receita por evento

### Como é calculado?

**Método 1 (Admin):**
```typescript
receitaTotal = Σ (pedido.total) onde status === "paid"
```

**Método 2 (Produtor):**
```typescript
receitaEvento = Σ (vendidos × preço) por setor
receitaTotal = Σ (receitaEvento) para todos os eventos
```

---

## 📖 Como Usar Esta Documentação

### Para Desenvolvedores

1. **Comece por:** [Sistema de Receita Completo](./SISTEMA_RECEITA_COMPLETO.md)
2. **Seção 8:** Estrutura Técnica (código e funções)
3. **Seção 10:** Troubleshooting (problemas comuns)

### Para Gestores

1. **Seção 1:** Visão Geral
2. **Seção 7:** Métricas e KPIs
3. **Seção 9:** Exemplos Práticos

### Para Analistas

1. **Seção 3:** Cálculo de Receita
2. **Seção 6:** Fluxo Completo
3. **Seção 7:** Métricas e KPIs

---

## 🔗 Links Relacionados

- [Dashboard do Admin](../CHANGELOG_2025-02-02.md) - Melhorias no gráfico de receita
- [Estrutura de Banco de Dados](../../event-tickets-now/docs/firebase/estrutura_banco_dados.md)

---

**Última Atualização:** 02 de Fevereiro de 2025
