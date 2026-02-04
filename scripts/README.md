# Scripts do Painel Administrativo

Este diretório contém scripts utilitários para gerenciar o sistema.

## Scripts Disponíveis

### 1. `verify-admin.js`

Verifica se um usuário está configurado como administrador.

**Uso:**
```bash
npm run verify-admin <email>
```

**Exemplo:**
```bash
npm run verify-admin admin@bilheteria.com
```

**O que faz:**
- Verifica se o usuário existe no Firebase Auth
- Verifica se o documento existe na coleção `users` do Firestore
- Verifica se `isAdmin: true` está configurado
- Mostra status detalhado do usuário

---

### 2. `promote-admin.js`

Promove um usuário existente a administrador.

**Uso:**
```bash
npm run promote-admin <email>
```

**Exemplo:**
```bash
npm run promote-admin admin@bilheteria.com
```

**O que faz:**
- Busca o usuário no Firebase Auth pelo email
- Atualiza o documento no Firestore para `isAdmin: true`
- Útil quando você já tem um usuário mas ele não é admin

---

### 3. `create-admin.js`

Cria um usuário administrador no sistema.

**Uso:**
```bash
npm run create-admin <email> <password>
```

**Exemplo:**
```bash
npm run create-admin admin@bilheteria.com MinhaSenha123
```

**O que faz:**
- Cria um usuário no Firebase Authentication
- Cria um documento no Firestore com `isAdmin: true`
- Permite login no painel administrativo

---

### 2. `create-default-categories.js`

Cria as categorias padrão de eventos no Firestore.

**Uso:**
```bash
npm run create-categories
```

**O que faz:**
- Cria as categorias padrão: "Evento", "Festival", "Show"
- Verifica se as categorias já existem antes de criar
- Evita duplicatas (case-insensitive)

**Categorias criadas:**
- Evento
- Festival
- Show

**Nota:** Este script também pode ser executado através da interface do painel. Se não houver categorias cadastradas, um botão "Criar Categorias Padrão" aparecerá automaticamente.

---

## Requisitos

Todos os scripts requerem:
- Arquivo de service account do Firebase (`teste-9ed53-firebase-adminsdk-fbsvc-269158e9d6.json`) na raiz do projeto
- Ou variável de ambiente `GOOGLE_APPLICATION_CREDENTIALS` apontando para o arquivo

---

## Estrutura dos Scripts

Os scripts usam:
- **Firebase Admin SDK** para acesso administrativo ao Firestore
- **ES Modules** (import/export)
- **TypeScript/JavaScript** moderno

---

**Última atualização:** 2025-01-27
