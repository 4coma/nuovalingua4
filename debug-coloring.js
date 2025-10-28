// Script de débogage pour vérifier la coloration des mots
console.log('=== DÉBOGAGE COLORATION MOTS ===');

// Vérifier le localStorage
const storedWords = localStorage.getItem('personalDictionary');
console.log('Mots stockés dans localStorage:', storedWords);

if (storedWords) {
  try {
    const words = JSON.parse(storedWords);
    console.log('Nombre de mots dans le dictionnaire:', words.length);
    console.log('Premiers mots:', words.slice(0, 5));
    
    // Vérifier les mots italiens
    const italianWords = words.filter(w => w.sourceLang === 'it');
    console.log('Mots italiens:', italianWords.length);
    console.log('Exemples de mots italiens:', italianWords.slice(0, 3).map(w => w.sourceWord));
  } catch (e) {
    console.error('Erreur parsing:', e);
  }
} else {
  console.log('Aucun dictionnaire personnel trouvé dans localStorage');
}

// Vérifier les méthodes du service
console.log('=== TEST DES MÉTHODES ===');

// Simuler le texte de l'image
const testText = "L'Italia continua a guidare l'Europa in un momento di tensione internazionale. Le nuove misure innovative hanno portato segnali significativi di ripresa, con un aumento del PIL del 3,2% nel terzo trimestre, trainato dal settore tecnologico e dalle esportazioni.";

console.log('Texte de test:', testText);

// Extraire les mots du texte
const words = testText.match(/\b\w+\b/g) || [];
console.log('Mots extraits du texte:', words.slice(0, 10));

// Vérifier si des mots communs sont dans le dictionnaire
const commonWords = ['Italia', 'Europa', 'nuove', 'misure', 'innovative', 'PIL', 'settore', 'tecnologico'];
console.log('Mots communs à vérifier:', commonWords);
