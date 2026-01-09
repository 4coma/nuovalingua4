export interface StaticWordPair {
    it: string;
    fr: string;
    context: string;
}

export interface StaticLesson {
    id: string; // ex: 'lvl1-dom-self'
    title: string;
    pairs: StaticWordPair[];
}

export interface StaticCourseData {
    [levelId: number]: {
        domaines: StaticLesson[];
        lexical: StaticLesson[];
        verbs: StaticLesson[];
    }
}

export const COURSE_DATA: StaticCourseData = {
    1: {
        domaines: [
            {
                id: 'lvl1-dom-self',
                title: 'Se désigner soi-même',
                pairs: [
                    { it: 'Io', fr: 'Je', context: 'Pronom sujet de base' },
                    { it: 'Io sono', fr: 'Je suis', context: 'Se présenter avec l\'être' },
                    { it: 'Mi chiamo', fr: 'Je m\'appelle', context: 'Donner son nom' },
                    { it: 'Io ho', fr: 'J\'ai', context: 'Possession ou âge' },
                    { it: 'Il mio nome è', fr: 'Mon nom est', context: 'Forme plus formelle' },
                    { it: 'Io vado', fr: 'Je vais', context: 'Mouvement simple' },
                    { it: 'Ecco a me', fr: 'Voici pour moi', context: 'Désignation de soi' },
                    { it: 'Io qui', fr: 'Moi ici', context: 'Positionnement' },
                    { it: 'Sono io', fr: 'C\'est moi', context: 'S\'identifier' },
                    { it: 'Piacere, io sono', fr: 'Enchanté, je suis', context: 'Salutation' },
                    { it: 'Me stesso', fr: 'Moi-même', context: 'Forme réflexive' },
                    { it: 'Da parte mia', fr: 'De mon côté', context: 'Opinion personnelle' },
                    { it: 'Per me', fr: 'Pour moi', context: 'Choix ou avis' },
                    { it: 'Io faccio', fr: 'Je fais', context: 'Action de base' },
                    { it: 'Come me', fr: 'Comme moi', context: 'Comparaison' }
                ]
            },
            {
                id: 'lvl1-dom-others',
                title: 'Désigner les autres',
                pairs: [
                    { it: 'Tu', fr: 'Tu', context: 'Pronom de deuxième personne' },
                    { it: 'Lui', fr: 'Il', context: 'Troisième personne du singulier masculin' },
                    { it: 'Lei', fr: 'Elle', context: 'Troisième personne du singulier féminin' },
                    { it: 'Lei (formale)', fr: 'Vous (poli)', context: 'Vouvoiement régulier' },
                    { it: 'Voi', fr: 'Vous', context: 'Deuxième personne du pluriel' },
                    { it: 'Loro', fr: 'Ils', context: 'Troisième personne du pluriel' }
                ]
            },
            {
                id: 'lvl1-dom-objects',
                title: 'Nommer les objets visibles',
                pairs: [
                    { it: 'il libro', fr: 'le livre', context: 'Objet d\'étude' },
                    { it: 'la sedia', fr: 'la chaise', context: 'Mobilier' },
                    { it: 'il tavolo', fr: 'la table', context: 'Mobilier' },
                    { it: 'la penna', fr: 'le stylo', context: 'Écriture' },
                    { it: 'la borsa', fr: 'le sac', context: 'Accessoire' },
                    { it: 'la porta', fr: 'la porte', context: 'Maison' },
                    { it: 'la finestra', fr: 'la fenêtre', context: 'Maison' },
                    { it: 'il telefono', fr: 'le téléphone', context: 'Technologie' },
                    { it: 'la tazza', fr: 'la tasse', context: 'Cuisine' },
                    { it: 'il bicchiere', fr: 'le verre', context: 'Cuisine' }
                ]
            },
            {
                id: 'lvl1-dom-space',
                title: 'Situer dans l’espace immédiat',
                pairs: [
                    { it: 'qui', fr: 'ici', context: 'Position proche' },
                    { it: 'lì', fr: 'là', context: 'Position éloignée' },
                    { it: 'sopra', fr: 'dessus', context: 'Position verticale positive' },
                    { it: 'sotto', fr: 'dessous', context: 'Position verticale négative' },
                    { it: 'davanti', fr: 'devant', context: 'Position frontale' },
                    { it: 'dietro', fr: 'derrière', context: 'Position postérieure' },
                    { it: 'a destra', fr: 'à droite', context: 'Direction' },
                    { it: 'a sinistra', fr: 'à gauche', context: 'Direction' },
                    { it: 'vicino', fr: 'proche', context: 'Proximité' },
                    { it: 'lontano', fr: 'loin', context: 'Distance' }
                ]
            },
            {
                id: 'lvl1-dom-affirmation',
                title: 'Affirmer ou nier',
                pairs: [
                    { it: 'sì', fr: 'oui', context: 'Affirmation' },
                    { it: 'no', fr: 'non', context: 'Négation' },
                    { it: 'forse', fr: 'peut-être', context: 'Incertitude' },
                    { it: 'certo', fr: 'bien sûr', context: 'Certitude' },
                    { it: 'd\'accordo', fr: 'd\'accord', context: 'Accord' },
                    { it: 'mai', fr: 'jamais', context: 'Fréquence nulle' },
                    { it: 'ancora', fr: 'encore', context: 'Continuité' },
                    { it: 'non ancora', fr: 'pas encore', context: 'Attente' },
                    { it: 'proprio così', fr: 'tout à fait', context: 'Confirmation forte' },
                    { it: 'neanche', fr: 'non plus', context: 'Négation additionnelle' }
                ]
            }
        ],
        lexical: [
            {
                id: 'lvl1-lex-pronouns',
                title: 'Pronoms personnels sujets',
                pairs: [
                    { it: 'Io', fr: 'Je', context: '1ère personne du singulier' },
                    { it: 'Tu', fr: 'Tu', context: '2ème personne du singulier' },
                    { it: 'Lui', fr: 'Il', context: '3ème personne du singulier masculin' },
                    { it: 'Lei', fr: 'Elle', context: '3ème personne du singulier féminin' },
                    { it: 'Noi', fr: 'Nous', context: '1ère personne du pluriel' },
                    { it: 'Voi', fr: 'Vous', context: '2ème personne du pluriel' },
                    { it: 'Loro', fr: 'Ils', context: '3ème personne du pluriel' }
                ]
            },
            {
                id: 'lvl1-lex-nouns',
                title: 'Noms concrets très fréquents',
                pairs: [
                    { it: 'il pane', fr: 'le pain', context: 'Alimentation' },
                    { it: 'l\'acqua', fr: 'l\'eau', context: 'Boisson' },
                    { it: 'il caffè', fr: 'le café', context: 'Boisson' },
                    { it: 'la casa', fr: 'la maison', context: 'Bâtiment' },
                    { it: 'la macchina', fr: 'la voiture', context: 'Transport' },
                    { it: 'il gatto', fr: 'le chat', context: 'Animal' },
                    { it: 'il cane', fr: 'le chien', context: 'Animal' },
                    { it: 'il ragazzo', fr: 'le garçon', context: 'Personne' },
                    { it: 'la ragazza', fr: 'la fille', context: 'Personne' },
                    { it: 'la città', fr: 'la ville', context: 'Lieu' }
                ]
            },
            {
                id: 'lvl1-lex-adverbs',
                title: 'Adverbes de lieu simples',
                pairs: [
                    { it: 'dentro', fr: 'dedans', context: 'Position intérieure' },
                    { it: 'fuori', fr: 'dehors', context: 'Position extérieure' },
                    { it: 'su', fr: 'en haut', context: 'Direction ascendante' },
                    { it: 'giù', fr: 'en bas', context: 'Direction descendante' },
                    { it: 'ovunque', fr: 'partout', context: 'Lieu indéterminé' },
                    { it: 'altrove', fr: 'ailleurs', context: 'Autre lieu' },
                    { it: 'intorno', fr: 'autour', context: 'Position circulaire' },
                    { it: 'accanto', fr: 'à côté', context: 'Position latérale' },
                    { it: 'di fronte', fr: 'en face', context: 'Position opposée' },
                    { it: 'oltre', fr: 'au-delà', context: 'Dépassement' }
                ]
            },
            {
                id: 'lvl1-lex-articles',
                title: 'Articles définis et indéfinis',
                pairs: [
                    { it: 'il', fr: 'le', context: 'Article masculin singulier' },
                    { it: 'lo', fr: 'le', context: 'Article masculin singulier spécial' },
                    { it: 'la', fr: 'la', context: 'Article féminin singulier' },
                    { it: 'i', fr: 'les', context: 'Article masculin pluriel' },
                    { it: 'gli', fr: 'les', context: 'Article masculin pluriel spécial' },
                    { it: 'le', fr: 'les', context: 'Article féminin pluriel' },
                    { it: 'un', fr: 'un', context: 'Article indéfini masculin' },
                    { it: 'uno', fr: 'un', context: 'Article indéfini masculin spécial' },
                    { it: 'una', fr: 'une', context: 'Article indéfini féminin' },
                    { it: 'un\'', fr: 'une', context: 'Article indéfini féminin voyelle' }
                ]
            },
            {
                id: 'lvl1-lex-tools',
                title: 'Mots outils fondamentaux',
                pairs: [
                    { it: 'e', fr: 'et', context: 'Coordination' },
                    { it: 'ma', fr: 'mais', context: 'Opposition' },
                    { it: 'o', fr: 'ou', context: 'Choix' },
                    { it: 'che', fr: 'que', context: 'Relatif' },
                    { it: 'anche', fr: 'aussi', context: 'Addition' },
                    { it: 'sempre', fr: 'toujours', context: 'Temps' },
                    { it: 'molto', fr: 'beaucoup', context: 'Quantité' },
                    { it: 'poco', fr: 'peu', context: 'Quantité' },
                    { it: 'perché', fr: 'parce que', context: 'Cause' },
                    { it: 'come', fr: 'comme', context: 'Comparaison' }
                ]
            }
        ],
        verbs: [
            {
                id: 'lvl1-verb-essere',
                title: 'Verbes d’état au présent (être, avoir)',
                pairs: [
                    { it: 'essere', fr: 'être', context: 'Infinitif auxiliaire' },
                    { it: 'avere', fr: 'avoir', context: 'Infinitif auxiliaire' },
                    { it: 'io sono', fr: 'je suis', context: 'Présent indicatif' },
                    { it: 'tu sei', fr: 'tu es', context: 'Présent indicatif' },
                    { it: 'lui è', fr: 'il est', context: 'Présent indicatif' },
                    { it: 'noi siamo', fr: 'nous sommes', context: 'Présent indicatif' },
                    { it: 'voi siete', fr: 'vous êtes', context: 'Présent indicatif' },
                    { it: 'loro sono', fr: 'ils sont', context: 'Présent indicatif' }
                ]
            },
            {
                id: 'lvl1-verb-existence',
                title: 'Verbes d’existence et de possession au présent',
                pairs: [
                    { it: 'c\'è', fr: 'il y a', context: 'Existence singulier' },
                    { it: 'ci sono', fr: 'il y a', context: 'Existence pluriel' },
                    { it: 'io ho', fr: 'j\'ai', context: 'Possession' },
                    { it: 'tu hai', fr: 'tu as', context: 'Possession' },
                    { it: 'lui ha', fr: 'il a', context: 'Possession' },
                    { it: 'lei ha', fr: 'elle a', context: 'Possession' },
                    { it: 'noi abbiamo', fr: 'nous avons', context: 'Possession' },
                    { it: 'voi avete', fr: 'vous avez', context: 'Possession' },
                    { it: 'loro hanno', fr: 'ils ont', context: 'Possession' },
                    { it: 'esiste', fr: 'cela existe', context: 'Existence' }
                ]
            },
            {
                id: 'lvl1-verb-negation',
                title: 'Formes affirmatives et négatives simples',
                pairs: [
                    { it: 'io sono', fr: 'je suis', context: 'Affirmatif' },
                    { it: 'io non sono', fr: 'je ne suis pas', context: 'Négatif' },
                    { it: 'io ho', fr: 'j\'ai', context: 'Affirmatif' },
                    { it: 'io non ho', fr: 'je n\'ai pas', context: 'Négatif' },
                    { it: 'va bene', fr: 'ça va', context: 'Réponse affirmative' },
                    { it: 'non va bene', fr: 'ça ne va pas', context: 'Réponse négative' },
                    { it: 'scrivo', fr: 'j\'écris', context: 'Action présente' },
                    { it: 'non scrivo', fr: 'je n\'écris pas', context: 'Action négative' },
                    { it: 'parlo', fr: 'je parle', context: 'Action présente' },
                    { it: 'non parlo', fr: 'je ne parle pas', context: 'Action négative' }
                ]
            }
        ]
    }
};
