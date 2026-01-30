# Publicar regras do Firestore (necessário para o painel)

O painel precisa que as **regras do Firestore** estejam publicadas no Firebase. Sem isso, ao carregar Usuários, Produtores ou Pedidos aparece: *"Erro ao carregar usuários"* ou *"Missing or insufficient permissions"*.

## Onde estão as regras

As regras ficam no projeto **event-tickets-now** (mesmo projeto Firebase que o painel usa):

- Arquivo: `event-tickets-now/firebase.rules`
- Elas já permitem que usuários com `isAdmin: true` leiam/escrevam em `users` e `orders`.

## Como publicar

1. Abra o terminal na pasta **event-tickets-now** (não na do painel):

   ```powershell
   cd c:\Users\Lebar\Documents\1projetos\bilheteria\event-tickets-now
   ```

2. Se ainda não tiver o Firebase CLI instalado:

   ```powershell
   npm install -g firebase-tools
   ```

3. Faça login (se ainda não fez):

   ```powershell
   firebase login
   ```

4. Associe o projeto (se ainda não fez):

   ```powershell
   firebase use --add
   ```
   Escolha o projeto que a bilheteria e o painel usam.

5. Publique só as regras do Firestore:

   ```powershell
   firebase deploy --only firestore:rules --project teste-9ed53
   ```

   Se você já tiver associado o projeto com `firebase use --add`, pode usar apenas:

   ```powershell
   firebase deploy --only firestore:rules
   ```

6. Quando aparecer *"Deploy complete"*, recarregue a página de Usuários no painel.

## Conferir se deu certo

- Faça login no painel com uma conta que tenha `isAdmin: true` no Firestore.
- Acesse **Usuários**. A lista deve carregar sem erro.

Se ainda der erro, confira no Firebase Console se o documento do seu usuário em **Firestore → users → {seu UID}** tem o campo **isAdmin: true**.
