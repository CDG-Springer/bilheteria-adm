# Changelog - Painel Bilheteria

## [2025-01-27] - Remoção do Botão "Criar Categorias Padrão"

### ✨ Ajustes Implementados
- **Remoção do botão "Criar Categorias Padrão"** da interface
- **Remoção da função `initializeDefaultCategoriesMutation`** e `initializeDefaultCategories`
- **Interface simplificada** com apenas o botão "Nova Categoria"

### Motivo
- As categorias padrão (Evento, Festival, Show) já foram criadas via script
- O botão causava confusão e não era necessário após a migração inicial
- A interface agora é focada apenas em gerenciar categorias existentes

### Arquivos Modificados
- `src/pages/Categories.tsx` - Removido botão e funções relacionadas

### Resultado
- ✅ Interface mais limpa e focada
- ✅ Apenas botão "Nova Categoria" disponível
- ✅ Sistema funcionando normalmente

---

## [2025-01-27] - Scripts de Administração e Publicação de Regras

### ✨ Adicionado
- **Script `verify-admin.js`**: Verifica se um usuário está configurado como administrador
- **Script `promote-admin.js`**: Promove um usuário existente a administrador
- **Publicação das regras do Firestore** via Firebase CLI
- **Documentação completa** para resolver problemas de permissões

### Problema Resolvido
- Erro "Missing or insufficient permissions" ao tentar criar categorias
- Dificuldade em verificar/promover usuários a admin

### Arquivos Criados
- `scripts/verify-admin.js` - Script para verificar status de admin
- `scripts/promote-admin.js` - Script para promover usuário a admin
- `docs/2025-01-27_SOLUCAO_RAPIDA_CATEGORIAS.md` - Guia rápido
- `docs/2025-01-27_RESOLVER_ERRO_CATEGORIAS.md` - Guia detalhado
- `docs/2025-01-27_SCRIPTS_ADMIN_E_PUBLICAÇÃO_REGRAS.md` - Documentação completa

### Arquivos Modificados
- `package.json` - Adicionados scripts `verify-admin` e `promote-admin`
- `scripts/README.md` - Documentação dos novos scripts

### Como Usar

**Verificar se usuário é admin:**
```bash
npm run verify-admin <email>
```

**Promover usuário a admin:**
```bash
npm run promote-admin <email>
```

**Publicar regras do Firestore:**
```bash
cd ../event-tickets-now
firebase deploy --only firestore:rules
```

### Resultado
- ✅ Scripts utilitários criados
- ✅ Regras do Firestore publicadas
- ✅ Sistema funcionando para criar/editar/deletar categorias

---

## [2025-01-27] - Organização da Documentação

### ✨ Implementado
- **Consolidação de toda documentação** na pasta `docs/`
- **Renomeação de arquivos** com data `2025-01-27` quando aplicável
- **Criação de README.md** explicando a estrutura

### Arquivos Organizados
- Todos os arquivos `.md` da raiz movidos para `docs/`
- Arquivos renomeados com data quando não tinham data específica
- README.md criado explicando a estrutura

### Resultado
- ✅ Documentação centralizada e organizada
- ✅ Fácil localização de documentos por data
- ✅ Estrutura clara e mantível

---

**Última atualização:** 2025-01-27
