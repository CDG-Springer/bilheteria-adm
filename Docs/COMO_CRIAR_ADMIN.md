# 🔐 Como Criar um Usuário Administrador

## 📋 Informações Importantes

**Não há login e senha pré-cadastrados.** É necessário criar um usuário administrador manualmente.

O painel administrativo verifica se o usuário tem a flag `isAdmin: true` no documento do Firestore na coleção `users`.

---

## 🎯 Método 1: Criar via Sistema Principal + Marcar como Admin

### Passo 1: Criar Usuário no Sistema Principal

1. Acesse o sistema principal (`event-tickets-now`)
2. Vá para a página de cadastro (`/auth`)
3. Crie uma conta normalmente com:
   - Nome completo
   - Email (ex: `admin@bilheteria.com`)
   - Senha (ex: `admin123456`)
   - Demais dados obrigatórios

### Passo 2: Marcar como Admin no Firestore

**Opção A: Via Firebase Console (Recomendado)**

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Firestore Database**
4. Encontre a coleção `users`
5. Localize o documento do usuário criado (pelo email ou UID)
6. Edite o documento e adicione/modifique o campo:
   ```json
   {
     "isAdmin": true
   }
   ```
7. Salve

**Opção B: Via Código (Script temporário)**

Crie um arquivo temporário `createAdmin.js` na raiz do projeto:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  // ... outros campos
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  try {
    // 1. Fazer login com o usuário criado
    const userCredential = await signInWithEmailAndPassword(
      auth,
      "admin@bilheteria.com", // Email do usuário
      "admin123456" // Senha
    );

    // 2. Marcar como admin
    await updateDoc(doc(db, "users", userCredential.user.uid), {
      isAdmin: true,
    });

    console.log("✅ Usuário marcado como admin com sucesso!");
    console.log("UID:", userCredential.user.uid);
  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

createAdmin();
```

---

## 🎯 Método 2: Criar Diretamente no Firebase Console

### Passo 1: Criar Usuário no Firebase Authentication

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Authentication** > **Users**
4. Clique em **Add user**
5. Preencha:
   - Email: `admin@bilheteria.com`
   - Senha: `admin123456` (ou outra senha segura)
6. Clique em **Add user**

### Passo 2: Criar Documento no Firestore

1. Vá em **Firestore Database**
2. Clique em **Start collection** (se não existir) ou selecione a coleção `users`
3. Clique em **Add document**
4. No campo **Document ID**, cole o **UID** do usuário criado (encontrado em Authentication > Users)
5. Adicione os campos:
   ```json
   {
     "displayName": "Administrador",
     "email": "admin@bilheteria.com",
     "isAdmin": true,
     "isProducer": false,
     "createdAt": [Timestamp - data atual],
     "updatedAt": [Timestamp - data atual]
   }
   ```
6. Clique em **Save**

---

## 🎯 Método 3: Usar o Painel de Usuários (Se já tiver acesso)

Se você já tiver acesso ao painel administrativo:

1. Acesse a página **Usuários** (`/users`)
2. Localize o usuário que deseja tornar admin
3. Edite o documento no Firestore manualmente para adicionar `isAdmin: true`

**Nota:** Atualmente o painel não tem botão para tornar usuário admin, então precisa ser feito manualmente no Firestore.

---

## ✅ Verificação

Após criar o usuário admin:

1. Acesse o painel administrativo: `http://localhost:5173/login` (ou a porta do painel)
2. Faça login com:
   - **Email:** `admin@bilheteria.com` (ou o email que você usou)
   - **Senha:** `admin123456` (ou a senha que você definiu)
3. Se tudo estiver correto, você será redirecionado para o dashboard

---

## 🔒 Credenciais Padrão Sugeridas

Se você quiser usar credenciais padrão para desenvolvimento:

- **Email:** `admin@bilheteria.com`
- **Senha:** `admin123456`

**⚠️ IMPORTANTE:** Altere essas credenciais em produção!

---

## 🛠️ Script de Criação Automática

Se preferir, posso criar um script Node.js que automatiza todo o processo. Basta me avisar!

---

## 📝 Estrutura do Documento no Firestore

O documento do usuário admin deve ter esta estrutura mínima:

```json
{
  "displayName": "Nome do Admin",
  "email": "admin@bilheteria.com",
  "isAdmin": true,
  "isProducer": false,
  "createdAt": [Timestamp],
  "updatedAt": [Timestamp]
}
```

**Campo obrigatório:** `isAdmin: true`

---

## ❓ Problemas Comuns

### "Acesso negado. Você não tem permissão de administrador."

**Causa:** O usuário não tem `isAdmin: true` no Firestore.

**Solução:**
1. Verifique se o documento existe na coleção `users`
2. Verifique se o campo `isAdmin` está definido como `true` (não apenas presente)
3. Verifique se está usando o UID correto do usuário

### "Email ou senha incorretos."

**Causa:** Credenciais incorretas ou usuário não existe no Firebase Auth.

**Solução:**
1. Verifique se o usuário foi criado no Firebase Authentication
2. Verifique se o email e senha estão corretos
3. Tente resetar a senha no Firebase Console

---

**Última atualização:** 27/01/2025
