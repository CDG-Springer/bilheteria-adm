import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho da service account: variável GOOGLE_APPLICATION_CREDENTIALS ou arquivo na raiz do projeto
const defaultFileName = "teste-9ed53-firebase-adminsdk-fbsvc-269158e9d6.json";
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  join(__dirname, "..", defaultFileName);

// Categorias padrão que estavam hardcoded no sistema
const defaultCategories = ["Evento", "Festival", "Show"];

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

  initializeApp({
    credential: cert(serviceAccount),
  });

  const db = getFirestore();

  const createDefaultCategories = async () => {
    console.log("🚀 Iniciando criação de categorias padrão...\n");

    try {
      // Buscar categorias existentes
      const categoriesSnapshot = await db.collection("categories").get();
      const existingCategories = categoriesSnapshot.docs.map(
        (doc) => doc.data().name
      );

      console.log(`📋 Categorias existentes: ${existingCategories.length}`);
      if (existingCategories.length > 0) {
        console.log(`   - ${existingCategories.join(", ")}\n`);
      }

      const now = new Date();
      let created = 0;
      let skipped = 0;

      // Criar categorias que não existem
      for (const categoryName of defaultCategories) {
        // Verificar se já existe (case-insensitive)
        const exists = existingCategories.some(
          (existing) => existing.toLowerCase() === categoryName.toLowerCase()
        );

        if (exists) {
          console.log(`⏭️  Categoria "${categoryName}" já existe. Pulando...`);
          skipped++;
        } else {
          await db.collection("categories").add({
            name: categoryName,
            createdAt: now,
            updatedAt: now,
          });
          console.log(`✅ Categoria "${categoryName}" criada com sucesso!`);
          created++;
        }
      }

      console.log("\n" + "=".repeat(50));
      console.log("📊 Resumo:");
      console.log(`   ✅ Criadas: ${created}`);
      console.log(`   ⏭️  Puladas: ${skipped}`);
      console.log(`   📦 Total: ${defaultCategories.length}`);
      console.log("=".repeat(50));

      if (created > 0) {
        console.log("\n✨ Categorias padrão criadas com sucesso!");
        console.log(
          "💡 Agora você pode gerenciar as categorias pelo painel administrativo."
        );
      } else {
        console.log("\n✨ Todas as categorias padrão já existem!");
      }
    } catch (error) {
      console.error("❌ Erro ao criar categorias:", error);
      process.exit(1);
    }
  };

  createDefaultCategories();
} catch (error) {
  console.error("❌ Erro ao ler credenciais ou inicializar:", error);
  console.error(
    "Verifique se o arquivo de service account existe em:",
    serviceAccountPath
  );
  process.exit(1);
}
