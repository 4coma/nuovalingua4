import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface WebExtractionRequest {
  url: string;
}

export interface WebExtractionResponse {
  success: boolean;
  content: string;
  title: string;
  url: string;
  extractedAt: string;
}

export interface TestResponse {
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebExtractionService {
  constructor() {
  }

  /**
   * Extrait le contenu textuel d'une URL
   * Version simulée réaliste - remplace par la vraie Firebase Function quand tu upgrade vers Blaze
   */
  extractContent(url: string): Observable<WebExtractionResponse> {
    
    // Simulation d'extraction avec délai réaliste
    return of({
      success: true,
      content: this.generateRealisticContent(url),
      title: this.extractTitleFromUrl(url),
      url: url,
      extractedAt: new Date().toISOString()
    }).pipe(delay(1500 + Math.random() * 1000)); // Délai variable 1.5-2.5s
  }

  /**
   * Génère un contenu réaliste basé sur l'URL
   */
  private generateRealisticContent(url: string): string {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Contenu adapté selon le domaine
    if (domain.includes('corriere')) {
      return `Articolo estratto da Corriere della Sera\n\nMilano, 14 ottobre 2025 - In un momento di grande tensione internazionale, l'Italia continua a dimostrare la sua capacità di leadership nel panorama europeo. Il governo ha annunciato oggi una serie di misure innovative per affrontare le sfide economiche del prossimo decennio.\n\nSecondo le ultime analisi, il paese sta mostrando segni di ripresa significativi, con un aumento del 3.2% del PIL nel terzo trimestre. Gli esperti sottolineano come questa crescita sia trainata principalmente dal settore tecnologico e dalle esportazioni.\n\nIl ministro dell'Economia ha dichiarato: "Siamo orgogliosi dei risultati ottenuti, ma non possiamo permetterci di rallentare. L'innovazione e la sostenibilità rimangono le nostre priorità assolute."\n\nLe nuove politiche includono investimenti significativi nelle energie rinnovabili e nella digitalizzazione della pubblica amministrazione. Queste iniziative sono state accolte con entusiasmo dalle principali associazioni imprenditoriali del paese.`;
    }
    
    if (domain.includes('repubblica')) {
      return `Articolo estratto da La Repubblica\n\nRoma, 14 ottobre 2025 - Una giornata storica per la democrazia italiana. Il parlamento ha approvato con una maggioranza schiacciante la nuova legge sulla transizione ecologica, un provvedimento che segna una svolta decisiva nelle politiche ambientali del paese.\n\nLa legge, che prevede investimenti per oltre 50 miliardi di euro nei prossimi cinque anni, è stata definita "rivoluzionaria" dal presidente del consiglio. L'obiettivo principale è quello di raggiungere la neutralità carbonica entro il 2040, anticipando di dieci anni gli obiettivi europei.\n\n"Questa è una vittoria per tutti gli italiani e per le future generazioni", ha commentato il ministro dell'Ambiente durante la conferenza stampa. "Abbiamo dimostrato che è possibile conciliare sviluppo economico e rispetto per l'ambiente."\n\nIl provvedimento include anche misure per la creazione di nuovi posti di lavoro nel settore green, con stime che parlano di oltre 200.000 nuove occupazioni nei prossimi tre anni.`;
    }
    
    if (domain.includes('ansa')) {
      return `Notizia estratta da ANSA\n\nMilano, 14 ottobre 2025 - L'Italia conferma la sua posizione di leader europeo nell'innovazione tecnologica. Il nuovo centro di ricerca artificiale inaugurato oggi a Milano rappresenta un investimento di 200 milioni di euro e impiegherà oltre 500 ricercatori.\n\nIl centro, sviluppato in collaborazione con le principali università italiane e aziende internazionali, si concentrerà sullo sviluppo di tecnologie AI per il settore sanitario e la mobilità sostenibile. "Siamo orgogliosi di questo traguardo che posiziona l'Italia all'avanguardia mondiale", ha dichiarato il rettore dell'Università Statale.\n\nL'iniziativa rientra nel piano nazionale per l'innovazione, che prevede investimenti per oltre 2 miliardi di euro nei prossimi tre anni. Il governo ha sottolineato l'importanza di questa strategia per mantenere la competitività italiana nel mercato globale.\n\nTra i progetti pilota già in corso, spicca lo sviluppo di un sistema di diagnostica medica basato sull'intelligenza artificiale, che potrebbe rivoluzionare la medicina preventiva in Italia e in Europa.`;
    }
    
    // Contenu générique pour les autres sites
    return `Contenu extrait de ${url}\n\nArticolo in italiano estratto automaticamente dal sito web. Questo testo rappresenta un esempio di come il sistema di estrazione web funzionerebbe con le Firebase Functions attive.\n\nIl contenuto è stato elaborato per rimuovere elementi di navigazione, pubblicità e altri elementi non essenziali, mantenendo solo il testo principale dell'articolo. Questa tecnologia permette di concentrarsi esclusivamente sul contenuto informativo.\n\nLa qualità dell'estrazione dipende dalla struttura del sito web di origine. I siti con una struttura HTML ben organizzata producono risultati migliori rispetto a quelli con layout complessi o contenuto generato dinamicamente.\n\nQuesto sistema è particolarmente utile per l'apprendimento delle lingue, permettendo di estrarre testi autentici da fonti reali per esercizi di comprensione e analisi linguistica.`;
  }

  /**
   * Extrait un titre réaliste basé sur l'URL
   */
  private extractTitleFromUrl(url: string): string {
    const domain = new URL(url).hostname.toLowerCase();
    
    if (domain.includes('corriere')) {
      return 'Corriere della Sera - Notizie e approfondimenti';
    }
    if (domain.includes('repubblica')) {
      return 'La Repubblica - Giornale italiano';
    }
    if (domain.includes('ansa')) {
      return 'ANSA - Agenzia Nazionale Stampa Associata';
    }
    
    return 'Articolo estratto da ' + domain;
  }

  /**
   * Teste la connectivité avec les Firebase Functions
   * Version simulée en attendant la configuration Firebase Functions
   */
  testConnection(): Observable<TestResponse> {
    
    return of({
      message: 'Service d\'extraction web opérationnel (version simulée)',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Valide une URL
   */
  isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Gère les erreurs Firebase Functions
   */
  private handleError(error: any): string {
    console.error('🔍 [WebExtractionService] Erreur détaillée:', error);
    
    if (error.code) {
      switch (error.code) {
        case 'invalid-argument':
          return 'URL invalide ou manquante';
        case 'failed-precondition':
          return 'Impossible d\'extraire du contenu de cette URL';
        case 'unavailable':
          return 'URL inaccessible ou site indisponible';
        case 'internal':
          return 'Erreur interne lors de l\'extraction';
        default:
          return `Erreur: ${error.message || 'Erreur inconnue'}`;
      }
    }
    
    return error.message || 'Erreur inconnue lors de l\'extraction';
  }
}
