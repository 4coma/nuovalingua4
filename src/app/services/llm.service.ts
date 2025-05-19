import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { VocabularyExercise, ComprehensionText, VocabularyItem } from '../models/vocabulary';
import { environment } from '../../environments/environment';

export interface WordPair {
  it: string;
  fr: string;
  context?: string;
}

export interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
    index: number;
    finish_reason: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class LlmService {
  private apiUrl = environment.openaiApiUrl;
  private apiKey = environment.openaiApiKey;
  private model = environment.openaiModel;

  constructor(private http: HttpClient) { }

  generateVocabularyExercise(category: string, topic: string): Observable<VocabularyExercise> {
    const prompt = `Generate an Italian vocabulary exercise for the category "${category}" related to "${topic}". 
    Return a JSON object with the following structure:
    {
      "items": [
        {"word": "italian_word", "translation": "french_translation"},
        // 10 items total
      ],
      "type": "${category}",
      "topic": "${topic}"
    }`;

    return this.callOpenAI<VocabularyExercise>(prompt);
  }

  generateComprehensionExercise(type: 'written' | 'oral', vocabularyItems: VocabularyItem[]): Observable<ComprehensionText> {
    const words = vocabularyItems.map(item => item.word).join(', ');
    
    const prompt = `Generate an Italian ${type === 'written' ? 'text' : 'dialogue'} that includes the following words: ${words}.
    The text should be suitable for a language learner at an intermediate level.
    Return a JSON object with the following structure:
    {
      "text": "the_generated_text_in_italian",
      "type": "${type}",
      "vocabularyItems": ${JSON.stringify(vocabularyItems)}
    }`;

    return this.callOpenAI<ComprehensionText>(prompt);
  }

  generateWordPairs(topic: string, category?: string): Observable<WordPair[]> {
    let prompt: string;
    
    if (category === 'conjugation') {
      prompt = `Génère 12 verbes en italien avec leur traduction en français pour pratiquer la conjugaison au temps "${topic}". 
      Varie les personnes. La traduction française doit inclure la personne (ex: "it": "mangio", "fr": "je mange").
      Pour la 3e personne du singulier et du pluriel, utilise uniquement le masculin. N'oublie pas les apostrophes quand nécessaire pour les traductions françaises (ex : "j'allais" et pas "je allais")
      Retourne uniquement un tableau JSON avec la structure suivante:
      [
        {"it": "verbe_italien", "fr": "traduction_française", "context": "exemple de phrase conjuguée au temps ${topic}"},
        // Répète pour 12 verbes au total.
      ]

      Exemple concret de réponse : 
      [
        {"it": "mangio", "fr": "je mange", "context": "je mange une pomme"},
        {"it": "vivi", "fr": "tu vis", "context": "il vit à Rome"},
        {"it": "dorma", "fr": "il dort", "context": "quelqu'un qui dort"},
        
      ] 
      N'inclus aucun texte avant ou après le JSON.`;
    } else {
      console.log("generateWordPairs", topic, category);
      
      prompt = `Génère 12 paires de mots en italien avec leur traduction en français sur le thème: "${topic}".
      Retourne uniquement un tableau JSON avec la structure suivante:
      [
        {"it": "mot_italien", "fr": "traduction_française", "context": "phrase d'exemple ou contexte d'utilisation (optionnel)"},
        // Répète pour 12 paires au total
      ]
      Exemple concret de réponse : 
      [
        {"it": "il", "fr": "le", "context": "il treno arriva"},
        {"it": "la", "fr": "la", "context": "la casa è bella"},        
      ] 
      Attention, le mot italien et le mot français doivent uniquement contenir la traduction de l'un et de l'autre.
      N'inclus aucun texte avant ou après le JSON.`;
    }

    return this.callOpenAI<WordPair[]>(prompt);
  }

  private callOpenAI<T>(prompt: string): Observable<T> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    });

    const body = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant d\'apprentissage de l\'italien qui génère du contenu éducatif structuré en JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    };

    return this.http.post<OpenAIResponse>(this.apiUrl, body, { headers }).pipe(
      map(response => {
        const content = response.choices[0].message.content;
        try {
          // Essayer de parser la réponse en JSON
          // Si la réponse contient du texte avant/après le JSON, essayer de l'extraire
          const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as T;
          }
          return JSON.parse(content) as T;
        } catch (error) {
          console.error('Erreur lors du parsing de la réponse JSON:', error);
          console.log('Contenu reçu:', content);
          throw new Error('Format de réponse invalide');
        }
      })
    );
  }
}
