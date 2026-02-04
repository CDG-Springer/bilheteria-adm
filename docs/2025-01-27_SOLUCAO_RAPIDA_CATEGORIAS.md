# 🚨 SOLUÇÃO RÁPIDA: Erro ao Criar Categorias

## ⚠️ Erro: "Missing or insufficient permissions"

Este erro acontece porque **as regras do Firestore precisam ser publicadas** no Firebase Console.

## ✅ Solução em 3 Passos

### 1️⃣ Verificar se você é admin

```bash
cd painel-bilheteria
npm run verify-admin <seu-email>
```

**Se não for admin, promova:**
```bash
npm run promote-admin <seu-email>
```

### 2️⃣ Publicar Regras no Firebase Console

1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto
3. Menu lateral → **Firestore Database** → Aba **Rules**
4. **APAGUE** tudo e **COLE** o conteúdo de `event-tickets-now/docs/raiz/2025-01-27_REGRAS_PARA_COPIAR.txt`
5. Clique em **"Publicar"** (Publish)
6. Aguarde 30 segundos

### 3️⃣ Testar Novamente

1. Faça **logout e login** no painel
2. Tente criar categoria novamente

---

**💡 Dica:** Se ainda não funcionar, verifique se você está logado com o email que tem `isAdmin: true` no Firestore.
