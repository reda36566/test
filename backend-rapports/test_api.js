require('dotenv').config();

async function testerCle() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
      console.log("❌ Erreur : Aucune clé API trouvée dans le fichier .env");
      return;
  }
  
  console.log(`🔑 Test de la clé : ${apiKey.substring(0, 5)}...`);

  try {
    // On demande directement à l'API la liste des modèles disponibles
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.error) {
        console.log("\n❌ ERREUR API GOOGLE :");
        console.log(data.error.message);
    } else {
        console.log("\n✅ SUCCÈS ! Voici les modèles disponibles pour ta clé :");
        console.log("------------------------------------------------");
        // On filtre pour n'afficher que les modèles de génération de texte (gemini)
        const models = data.models.filter(m => m.name.includes('gemini'));
        
        if (models.length === 0) {
            console.log("Aucun modèle Gemini trouvé. Essayez de recréer une clé sur aistudio.google.com");
        }
        
        models.forEach(m => {
            // On affiche le nom exact qu'il faut mettre dans le code
            console.log(`Nom à utiliser : "${m.name.replace('models/', '')}"`);
        });
        console.log("------------------------------------------------");
    }
  } catch (error) {
    console.error("❌ Erreur de connexion :", error.message);
  }
}

testerCle();