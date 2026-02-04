# Scripts de Administração e Publicação de Regras

**Data:** 2025-01-27  
**Status:** ✅ Implementado

## 🎯 Objetivo

Criar scripts utilitários para gerenciar usuários administradores e resolver problemas de permissões no Firestore, além de publicar as regras do Firestore para permitir que administradores gerenciem categorias.

## ✨ Implementação

### Problema Identificado
- Erro "Missing or insufficient permissions" ao tentar criar categorias no painel
- Necessidade de verificar se usuário é admin
- Necessidade de promover usuários a admin
- Regras do Firestore não estavam publicadas

### Solução Implementada

#### 1. Scripts Criados

**`scripts/verify-admin.js`**
- Verifica se um usuário está configurado como administrador
- Mostra status detalhado do usuário (Auth, Firestore, isAdmin)

**`scripts/promote-admin.js`**
- Promove um usuário existente a administrador
- Atualiza o documento no Firestore para `isAdmin: true`

**`scripts/create-admin.js`** (já existia)
- Cria um novo usuário administrador
- Cria usuário no Firebase Auth e documento no Firestore

#### 2. Publicação das Regras do Firestore

As regras do Firestore foram publicadas via Firebase CLI para permitir que administradores gerenciem categorias.

## 📋 Arquivos Criados

### Scripts

1. **`scripts/verify-admin.js`**
   ```javascript
   // Verifica se usuário é admin
   // Uso: npm run verify-admin <email>
   ```

2. **`scripts/promote-admin.js`**
   ```javascript
   // Promove usuário a admin
   // Uso: npm run promote-admin <email>
   ```

### Documentação

1. **`docs/2025-01-27_SOLUCAO_RAPIDA_CATEGORIAS.md`**
   - Guia rápido para resolver erro de permissões

2. **`docs/2025-01-27_RESOLVER_ERRO_CATEGORIAS.md`**
   - Guia detalhado com troubleshooting

## 📋 Arquivos Modificados

### `package.json`

**Adicionado:**
```json
{
  "scripts": {
    "verify-admin": "node scripts/verify-admin.js",
    "promote-admin": "node scripts/promote-admin.js",
    "create-admin": "node scripts/create-admin.js",
    "create-categories": "node scripts/create-default-categories.js"
  }
}
```

### `scripts/README.md`

**Adicionado:**
- Documentação dos novos scripts `verify-admin.js` e `promote-admin.js`

## 🔄 Fluxo de Uso

### Verificar se Usuário é Admin

```bash
cd painel-bilheteria
npm run verify-admin admin@bilheteria.com
```

**Saída esperada:**
```
🔍 Verificando status de admin para: admin@bilheteria.com

✅ Usuário encontrado no Firebase Auth
   UID: abc123...
✅ Documento encontrado no Firestore
   Email: admin@bilheteria.com
   isAdmin: ✅ true
   Role: admin

✅ TUDO OK! O usuário está configurado como administrador.
```

### Promover Usuário a Admin

```bash
npm run promote-admin usuario@exemplo.com
```

**Saída esperada:**
```
🔧 Promovendo usuário a admin: usuario@exemplo.com

✅ Usuário encontrado: xyz789...
✅ Usuário promovido a administrador com sucesso!

📋 Próximos passos:
   1. Faça logout e login novamente no painel
   2. Verifique se as regras do Firestore foram publicadas
   3. Tente criar uma categoria novamente
```

### Publicar Regras do Firestore

```bash
cd event-tickets-now
firebase use teste-9ed53
firebase deploy --only firestore:rules
```

**Saída esperada:**
```
=== Deploying to 'teste-9ed53'...

i  deploying firestore
+  cloud.firestore: rules file firebase.rules compiled successfully
+  firestore: released rules firebase.rules to cloud.firestore

+  Deploy complete!
```

## ✅ Resultado

- ✅ **Scripts utilitários criados** para gerenciar admins
- ✅ **Regras do Firestore publicadas** via Firebase CLI
- ✅ **Documentação criada** para resolver problemas de permissões
- ✅ **Sistema funcionando** para criar/editar/deletar categorias

## 🔍 Detalhes Técnicos

### Estrutura das Regras do Firestore

```javascript
// Categorias - leitura pública, escrita apenas para administradores
match /categories/{categoryId} {
  allow read: if true; // Qualquer um pode ler categorias
  allow create, update, delete: if isAdmin(); // Apenas admins podem criar/editar/deletar
}
```

### Função isAdmin()

```javascript
function isAdmin() {
  return request.auth != null
    && exists(/databases/$(database)/documents/users/$(request.auth.uid))
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('isAdmin', false) == true;
}
```

### Estrutura do Documento de Usuário Admin

```javascript
{
  email: "admin@bilheteria.com",
  isAdmin: true,
  role: "admin",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 📝 Notas Importantes

- As regras do Firestore precisam ser publicadas no Firebase Console ou via CLI
- Usuários precisam ter `isAdmin: true` no documento `users/{uid}` do Firestore
- Após publicar regras, aguarde 10-30 segundos para elas serem aplicadas
- Faça logout e login novamente após promover usuário a admin

## 🐛 Problemas Resolvidos

1. **Erro "Missing or insufficient permissions"**
   - ✅ Resolvido publicando regras do Firestore
   - ✅ Verificando se usuário é admin antes de operações

2. **Dificuldade em verificar status de admin**
   - ✅ Script `verify-admin.js` criado

3. **Dificuldade em promover usuário a admin**
   - ✅ Script `promote-admin.js` criado

## 📚 Documentação Relacionada

- `docs/2025-01-27_SOLUCAO_RAPIDA_CATEGORIAS.md` - Guia rápido
- `docs/2025-01-27_RESOLVER_ERRO_CATEGORIAS.md` - Guia detalhado
- `scripts/README.md` - Documentação dos scripts
- `event-tickets-now/firebase.rules` - Regras do Firestore

---

**Última atualização:** 2025-01-27
