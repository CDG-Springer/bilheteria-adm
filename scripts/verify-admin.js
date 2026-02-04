import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho da service account
const defaultFileName = "teste-9ed53-firebase-adminsdk-fbsvc-269158e9d6.json";
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  join(__dirname, "..", defaultFileName);

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

  initializeApp({
    credential: cert(serviceAccount),
  });

  const auth = getAuth();
  const db = getFirestore();

  const verifyAdmin = async () => {
    const args = process.argv.slice(2);
    const email = args[0];

    if (!email) {
      console.error("Uso: node scripts/verify-admin.js <email>");
      console.error("Exemplo: node scripts/verify-admin.js admin@bilheteria.com");
      process.exit(1);
    }

    try {
      console.log(`\n🔍 Verificando status de admin para: ${email}\n`);

      // 1. Verificar se usuário existe no Auth
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
        console.log("✅ Usuário encontrado no Firebase Auth");
        console.log(`   UID: ${userRecord.uid}`);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          console.error("❌ Usuário NÃO encontrado no Firebase Auth");
          console.error("   Crie o usuário primeiro com: node scripts/create-admin.js <email> <password>");
          process.exit(1);
        } else {
          throw error;
        }
      }

      // 2. Verificar documento no Firestore
      const userDoc = await db.collection("users").doc(userRecord.uid).get();

      if (!userDoc.exists) {
        console.error("❌ Documento NÃO encontrado na coleção 'users' do Firestore");
        console.error("   O documento precisa existir com isAdmin: true");
        console.error("\n💡 Solução: Execute:");
        console.error(`   node scripts/create-admin.js ${email} <senha>`);
        process.exit(1);
      }

      const userData = userDoc.data();
      console.log("✅ Documento encontrado no Firestore");
      console.log(`   Email: ${userData.email || "N/A"}`);
      console.log(`   isAdmin: ${userData.isAdmin === true ? "✅ true" : "❌ false"}`);
      console.log(`   Role: ${userData.role || "N/A"}`);

      if (userData.isAdmin !== true) {
        console.error("\n❌ PROBLEMA ENCONTRADO: isAdmin não está como 'true'");
        console.error("\n💡 Solução: Execute para promover a admin:");
        console.error(`   node scripts/promote-admin.js ${email}`);
        process.exit(1);
      }

      console.log("\n✅ TUDO OK! O usuário está configurado como administrador.");
      console.log("\n📋 Próximos passos:");
      console.log("   1. Verifique se as regras do Firestore foram publicadas");
      console.log("   2. Tente criar uma categoria novamente no painel");
      console.log("\n");

    } catch (error) {
      console.error("❌ Erro ao verificar admin:", error.message);
      if (error.code) {
        console.error(`   Código do erro: ${error.code}`);
      }
      process.exit(1);
    }
  };

  verifyAdmin();
} catch (error) {
  console.error("❌ Erro ao ler credenciais ou inicializar:", error);
  console.error(
    "Verifique se o arquivo de service account existe em:",
    serviceAccountPath,
  );
  process.exit(1);
}
