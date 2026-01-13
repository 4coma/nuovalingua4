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
    },
    2: {
        domaines: [
            {
                id: 'lvl2-dom-house',
                title: 'La maison',
                pairs: [
                    { it: 'la cucina', fr: 'la cuisine', context: 'Pièce de la maison' },
                    { it: 'il bagno', fr: 'la salle de bain', context: 'Pièce de la maison' },
                    { it: 'la camera da letto', fr: 'la chambre', context: 'Pièce de la maison' },
                    { it: 'il salotto', fr: 'le salon', context: 'Pièce de la maison' },
                    { it: 'il letto', fr: 'le lit', context: 'Meuble' },
                    { it: 'il divano', fr: 'le canapé', context: 'Meuble' },
                    { it: 'l\'armadio', fr: 'l\'armoire', context: 'Meuble' },
                    { it: 'la lampada', fr: 'la lampe', context: 'Éclairage' },
                    { it: 'lo specchio', fr: 'le miroir', context: 'Accessoire' },
                    { it: 'il tappeto', fr: 'le tapis', context: 'Décoration' },
                    { it: 'le scale', fr: 'les escaliers', context: 'Structure' },
                    { it: 'il pavimento', fr: 'le sol', context: 'Structure' },
                    { it: 'il soffitto', fr: 'le plafond', context: 'Structure' },
                    { it: 'la parete', fr: 'le mur', context: 'Structure' },
                    { it: 'il giardino', fr: 'le jardin', context: 'Extérieur' }
                ]
            },
            {
                id: 'lvl2-dom-objects',
                title: 'Les objets usuels',
                pairs: [
                    { it: 'le chiavi', fr: 'les clés', context: 'Objet quotidien' },
                    { it: 'il portafoglio', fr: 'le portefeuille', context: 'Accessoire' },
                    { it: 'l\'orologio', fr: 'la montre', context: 'Accessoire' },
                    { it: 'gli occhiali', fr: 'les lunettes', context: 'Accessoire' },
                    { it: 'l\'ombrello', fr: 'le parapluie', context: 'Protection météo' },
                    { it: 'la borsa', fr: 'le sac', context: 'Accessoire' },
                    { it: 'lo zaino', fr: 'le sac à dos', context: 'Accessoire' },
                    { it: 'il computer', fr: 'l\'ordinateur', context: 'Technologie' },
                    { it: 'il cellulare', fr: 'le portable', context: 'Technologie' },
                    { it: 'la penna', fr: 'le stylo', context: 'Écriture' },
                    { it: 'il quaderno', fr: 'le cahier', context: 'Écriture' },
                    { it: 'il giornale', fr: 'le journal', context: 'Lecture' },
                    { it: 'il libro', fr: 'le livre', context: 'Lecture' },
                    { it: 'la spazzola', fr: 'la brosse', context: 'Hygiène' },
                    { it: 'l\'asciugamano', fr: 'la serviette', context: 'Hygiène' }
                ]
            },
            {
                id: 'lvl2-dom-needs',
                title: 'Les besoins primaires',
                pairs: [
                    { it: 'ho fame', fr: 'j\'ai faim', context: 'Besoin alimentaire' },
                    { it: 'ho sete', fr: 'j\'ai soif', context: 'Besoin hydrique' },
                    { it: 'ho sonno', fr: 'j\'ai sommeil', context: 'Besoin de repos' },
                    { it: 'sono stanco', fr: 'je suis fatigué', context: 'État physique' },
                    { it: 'ho freddo', fr: 'j\'ai froid', context: 'Sensation thermique' },
                    { it: 'ho caldo', fr: 'j\'ai chaud', context: 'Sensation thermique' },
                    { it: 'mangiare', fr: 'manger', context: 'Action alimentaire' },
                    { it: 'bere', fr: 'boire', context: 'Action hydrique' },
                    { it: 'dormire', fr: 'dormir', context: 'Action de repos' },
                    { it: 'riposare', fr: 'se reposer', context: 'Action de repos' },
                    { it: 'lavarsi', fr: 'se laver', context: 'Hygiène' },
                    { it: 'bisogno', fr: 'besoin', context: 'Nécessité' },
                    { it: 'voglio', fr: 'je veux', context: 'Désir' },
                    { it: 'devo', fr: 'je dois', context: 'Obligation' },
                    { it: 'posso', fr: 'je peux', context: 'Capacité' }
                ]
            },
            {
                id: 'lvl2-dom-habits',
                title: 'Les habitudes journalières',
                pairs: [
                    { it: 'mi sveglio', fr: 'je me réveille', context: 'Matin' },
                    { it: 'mi alzo', fr: 'je me lève', context: 'Matin' },
                    { it: 'faccio colazione', fr: 'je prends le petit-déjeuner', context: 'Matin' },
                    { it: 'mi lavo i denti', fr: 'je me brosse les dents', context: 'Hygiène' },
                    { it: 'mi vesto', fr: 'je m\'habille', context: 'Préparation' },
                    { it: 'esco di casa', fr: 'je sors de la maison', context: 'Départ' },
                    { it: 'vado al lavoro', fr: 'je vais au travail', context: 'Déplacement' },
                    { it: 'pranzo', fr: 'je déjeune', context: 'Midi' },
                    { it: 'torno a casa', fr: 'je rentre à la maison', context: 'Retour' },
                    { it: 'ceno', fr: 'je dîne', context: 'Soir' },
                    { it: 'guardo la TV', fr: 'je regarde la télé', context: 'Loisir' },
                    { it: 'mi rilasso', fr: 'je me détends', context: 'Repos' },
                    { it: 'vado a letto', fr: 'je vais au lit', context: 'Nuit' },
                    { it: 'ogni giorno', fr: 'chaque jour', context: 'Fréquence' },
                    { it: 'di solito', fr: 'd\'habitude', context: 'Fréquence' }
                ]
            }
        ],
        lexical: [
            {
                id: 'lvl2-lex-daily-objects',
                title: 'Objets du quotidien',
                pairs: [
                    { it: 'il piatto', fr: 'l\'assiette', context: 'Vaisselle' },
                    { it: 'la forchetta', fr: 'la fourchette', context: 'Couvert' },
                    { it: 'il coltello', fr: 'le couteau', context: 'Couvert' },
                    { it: 'il cucchiaio', fr: 'la cuillère', context: 'Couvert' },
                    { it: 'la pentola', fr: 'la casserole', context: 'Cuisine' },
                    { it: 'la padella', fr: 'la poêle', context: 'Cuisine' },
                    { it: 'il frigorifero', fr: 'le réfrigérateur', context: 'Électroménager' },
                    { it: 'il forno', fr: 'le four', context: 'Électroménager' },
                    { it: 'la lavatrice', fr: 'la machine à laver', context: 'Électroménager' },
                    { it: 'l\'aspirapolvere', fr: 'l\'aspirateur', context: 'Ménage' },
                    { it: 'la scopa', fr: 'le balai', context: 'Ménage' },
                    { it: 'il sapone', fr: 'le savon', context: 'Hygiène' },
                    { it: 'lo shampoo', fr: 'le shampoing', context: 'Hygiène' },
                    { it: 'il dentifricio', fr: 'le dentifrice', context: 'Hygiène' },
                    { it: 'lo spazzolino', fr: 'la brosse à dents', context: 'Hygiène' }
                ]
            },
            {
                id: 'lvl2-lex-food',
                title: 'Alimentation et boisson',
                pairs: [
                    { it: 'il pane', fr: 'le pain', context: 'Aliment de base' },
                    { it: 'la pasta', fr: 'les pâtes', context: 'Aliment de base' },
                    { it: 'il riso', fr: 'le riz', context: 'Aliment de base' },
                    { it: 'la carne', fr: 'la viande', context: 'Protéine' },
                    { it: 'il pesce', fr: 'le poisson', context: 'Protéine' },
                    { it: 'l\'uovo', fr: 'l\'œuf', context: 'Protéine' },
                    { it: 'il formaggio', fr: 'le fromage', context: 'Produit laitier' },
                    { it: 'il latte', fr: 'le lait', context: 'Boisson' },
                    { it: 'l\'acqua', fr: 'l\'eau', context: 'Boisson' },
                    { it: 'il vino', fr: 'le vin', context: 'Boisson' },
                    { it: 'la frutta', fr: 'les fruits', context: 'Aliment' },
                    { it: 'la verdura', fr: 'les légumes', context: 'Aliment' },
                    { it: 'il pomodoro', fr: 'la tomate', context: 'Légume' },
                    { it: 'la mela', fr: 'la pomme', context: 'Fruit' },
                    { it: 'il caffè', fr: 'le café', context: 'Boisson' }
                ]
            },
            {
                id: 'lvl2-lex-body',
                title: 'Corps humain (base)',
                pairs: [
                    { it: 'la testa', fr: 'la tête', context: 'Partie du corps' },
                    { it: 'il viso', fr: 'le visage', context: 'Partie du corps' },
                    { it: 'gli occhi', fr: 'les yeux', context: 'Visage' },
                    { it: 'il naso', fr: 'le nez', context: 'Visage' },
                    { it: 'la bocca', fr: 'la bouche', context: 'Visage' },
                    { it: 'le orecchie', fr: 'les oreilles', context: 'Visage' },
                    { it: 'i capelli', fr: 'les cheveux', context: 'Tête' },
                    { it: 'il collo', fr: 'le cou', context: 'Partie du corps' },
                    { it: 'le spalle', fr: 'les épaules', context: 'Partie du corps' },
                    { it: 'le braccia', fr: 'les bras', context: 'Partie du corps' },
                    { it: 'le mani', fr: 'les mains', context: 'Partie du corps' },
                    { it: 'le gambe', fr: 'les jambes', context: 'Partie du corps' },
                    { it: 'i piedi', fr: 'les pieds', context: 'Partie du corps' },
                    { it: 'la schiena', fr: 'le dos', context: 'Partie du corps' },
                    { it: 'la pancia', fr: 'le ventre', context: 'Partie du corps' }
                ]
            },
            {
                id: 'lvl2-lex-time',
                title: 'Moments de la journée',
                pairs: [
                    { it: 'la mattina', fr: 'le matin', context: 'Moment de la journée' },
                    { it: 'il pomeriggio', fr: 'l\'après-midi', context: 'Moment de la journée' },
                    { it: 'la sera', fr: 'le soir', context: 'Moment de la journée' },
                    { it: 'la notte', fr: 'la nuit', context: 'Moment de la journée' },
                    { it: 'il mezzogiorno', fr: 'midi', context: 'Heure précise' },
                    { it: 'la mezzanotte', fr: 'minuit', context: 'Heure précise' },
                    { it: 'oggi', fr: 'aujourd\'hui', context: 'Jour' },
                    { it: 'ieri', fr: 'hier', context: 'Jour' },
                    { it: 'domani', fr: 'demain', context: 'Jour' },
                    { it: 'adesso', fr: 'maintenant', context: 'Instant' },
                    { it: 'presto', fr: 'tôt', context: 'Temporalité' },
                    { it: 'tardi', fr: 'tard', context: 'Temporalité' },
                    { it: 'prima', fr: 'avant', context: 'Séquence' },
                    { it: 'dopo', fr: 'après', context: 'Séquence' },
                    { it: 'ora', fr: 'heure', context: 'Temps' }
                ]
            },
            {
                id: 'lvl2-lex-quantities',
                title: 'Quantités simples',
                pairs: [
                    { it: 'uno', fr: 'un', context: 'Nombre' },
                    { it: 'due', fr: 'deux', context: 'Nombre' },
                    { it: 'tre', fr: 'trois', context: 'Nombre' },
                    { it: 'quattro', fr: 'quatre', context: 'Nombre' },
                    { it: 'cinque', fr: 'cinq', context: 'Nombre' },
                    { it: 'molto', fr: 'beaucoup', context: 'Quantité' },
                    { it: 'poco', fr: 'peu', context: 'Quantité' },
                    { it: 'tutto', fr: 'tout', context: 'Totalité' },
                    { it: 'niente', fr: 'rien', context: 'Absence' },
                    { it: 'qualcosa', fr: 'quelque chose', context: 'Indéfini' },
                    { it: 'alcuni', fr: 'quelques', context: 'Quantité imprécise' },
                    { it: 'abbastanza', fr: 'assez', context: 'Suffisance' },
                    { it: 'troppo', fr: 'trop', context: 'Excès' },
                    { it: 'più', fr: 'plus', context: 'Addition' },
                    { it: 'meno', fr: 'moins', context: 'Soustraction' }
                ]
            }
        ],
        verbs: [
            {
                id: 'lvl2-verb-actions',
                title: 'Verbes d\'action courants au présent',
                pairs: [
                    { it: 'mangio', fr: 'je mange', context: 'Action quotidienne' },
                    { it: 'bevo', fr: 'je bois', context: 'Action quotidienne' },
                    { it: 'dormo', fr: 'je dors', context: 'Action quotidienne' },
                    { it: 'cammino', fr: 'je marche', context: 'Mouvement' },
                    { it: 'corro', fr: 'je cours', context: 'Mouvement' },
                    { it: 'parlo', fr: 'je parle', context: 'Communication' },
                    { it: 'ascolto', fr: 'j\'écoute', context: 'Perception' },
                    { it: 'guardo', fr: 'je regarde', context: 'Perception' },
                    { it: 'leggo', fr: 'je lis', context: 'Activité' },
                    { it: 'scrivo', fr: 'j\'écris', context: 'Activité' },
                    { it: 'apro', fr: 'j\'ouvre', context: 'Action' },
                    { it: 'chiudo', fr: 'je ferme', context: 'Action' },
                    { it: 'prendo', fr: 'je prends', context: 'Action' },
                    { it: 'metto', fr: 'je mets', context: 'Action' },
                    { it: 'faccio', fr: 'je fais', context: 'Action générale' }
                ]
            },
            {
                id: 'lvl2-verb-regular',
                title: 'Verbes réguliers au présent',
                pairs: [
                    { it: 'parlare', fr: 'parler', context: 'Infinitif -are' },
                    { it: 'io parlo', fr: 'je parle', context: 'Conjugaison -are' },
                    { it: 'tu parli', fr: 'tu parles', context: 'Conjugaison -are' },
                    { it: 'lui parla', fr: 'il parle', context: 'Conjugaison -are' },
                    { it: 'noi parliamo', fr: 'nous parlons', context: 'Conjugaison -are' },
                    { it: 'voi parlate', fr: 'vous parlez', context: 'Conjugaison -are' },
                    { it: 'loro parlano', fr: 'ils parlent', context: 'Conjugaison -are' },
                    { it: 'credere', fr: 'croire', context: 'Infinitif -ere' },
                    { it: 'io credo', fr: 'je crois', context: 'Conjugaison -ere' },
                    { it: 'dormire', fr: 'dormir', context: 'Infinitif -ire' },
                    { it: 'io dormo', fr: 'je dors', context: 'Conjugaison -ire' },
                    { it: 'finire', fr: 'finir', context: 'Infinitif -ire (isc)' },
                    { it: 'io finisco', fr: 'je finis', context: 'Conjugaison -ire (isc)' },
                    { it: 'mangiare', fr: 'manger', context: 'Verbe régulier' },
                    { it: 'lavorare', fr: 'travailler', context: 'Verbe régulier' }
                ]
            },
            {
                id: 'lvl2-verb-reflexive',
                title: 'Introduction aux verbes pronominaux (présent)',
                pairs: [
                    { it: 'mi chiamo', fr: 'je m\'appelle', context: 'Pronominal' },
                    { it: 'mi sveglio', fr: 'je me réveille', context: 'Pronominal' },
                    { it: 'mi alzo', fr: 'je me lève', context: 'Pronominal' },
                    { it: 'mi lavo', fr: 'je me lave', context: 'Pronominal' },
                    { it: 'mi vesto', fr: 'je m\'habille', context: 'Pronominal' },
                    { it: 'mi preparo', fr: 'je me prépare', context: 'Pronominal' },
                    { it: 'mi siedo', fr: 'je m\'assieds', context: 'Pronominal' },
                    { it: 'mi riposo', fr: 'je me repose', context: 'Pronominal' },
                    { it: 'ti svegli', fr: 'tu te réveilles', context: 'Pronominal 2e pers' },
                    { it: 'si sveglia', fr: 'il/elle se réveille', context: 'Pronominal 3e pers' },
                    { it: 'ci svegliamo', fr: 'nous nous réveillons', context: 'Pronominal 1e pers pl' },
                    { it: 'vi svegliate', fr: 'vous vous réveillez', context: 'Pronominal 2e pers pl' },
                    { it: 'si svegliano', fr: 'ils/elles se réveillent', context: 'Pronominal 3e pers pl' },
                    { it: 'mi diverto', fr: 'je m\'amuse', context: 'Pronominal' },
                    { it: 'mi annoio', fr: 'je m\'ennuie', context: 'Pronominal' }
                ]
            },
            {
                id: 'lvl2-verb-habitual',
                title: 'Présent de l\'habitude',
                pairs: [
                    { it: 'ogni mattina mi sveglio alle sette', fr: 'chaque matin je me réveille à sept heures', context: 'Routine' },
                    { it: 'di solito faccio colazione', fr: 'd\'habitude je prends le petit-déjeuner', context: 'Habitude' },
                    { it: 'spesso vado al lavoro in bici', fr: 'souvent je vais au travail à vélo', context: 'Fréquence' },
                    { it: 'sempre leggo prima di dormire', fr: 'je lis toujours avant de dormir', context: 'Régularité' },
                    { it: 'la sera guardo la TV', fr: 'le soir je regarde la télé', context: 'Routine' },
                    { it: 'il weekend mi riposo', fr: 'le week-end je me repose', context: 'Habitude' },
                    { it: 'normalmente pranzo a casa', fr: 'normalement je déjeune à la maison', context: 'Normalité' },
                    { it: 'generalmente', fr: 'généralement', context: 'Fréquence' },
                    { it: 'raramente', fr: 'rarement', context: 'Fréquence' },
                    { it: 'qualche volta', fr: 'parfois', context: 'Fréquence' },
                    { it: 'mai', fr: 'jamais', context: 'Fréquence nulle' },
                    { it: 'tutti i giorni', fr: 'tous les jours', context: 'Quotidien' },
                    { it: 'una volta al giorno', fr: 'une fois par jour', context: 'Fréquence' },
                    { it: 'due volte alla settimana', fr: 'deux fois par semaine', context: 'Fréquence' },
                    { it: 'quando posso', fr: 'quand je peux', context: 'Condition' }
                ]
            }
        ]
    },
    3: {
        domaines: [
            {
                id: 'lvl3-dom-movement',
                title: 'Déplacements',
                pairs: [
                    { it: 'andare', fr: 'aller', context: 'Mouvement de base' },
                    { it: 'venire', fr: 'venir', context: 'Mouvement vers' },
                    { it: 'partire', fr: 'partir', context: 'Départ' },
                    { it: 'arrivare', fr: 'arriver', context: 'Arrivée' },
                    { it: 'entrare', fr: 'entrer', context: 'Mouvement intérieur' },
                    { it: 'uscire', fr: 'sortir', context: 'Mouvement extérieur' },
                    { it: 'salire', fr: 'monter', context: 'Mouvement vertical' },
                    { it: 'scendere', fr: 'descendre', context: 'Mouvement vertical' },
                    { it: 'attraversare', fr: 'traverser', context: 'Passage' },
                    { it: 'passare', fr: 'passer', context: 'Transit' },
                    { it: 'tornare', fr: 'retourner', context: 'Retour' },
                    { it: 'fermarsi', fr: 's\'arrêter', context: 'Immobilisation' },
                    { it: 'camminare', fr: 'marcher', context: 'Déplacement à pied' },
                    { it: 'correre', fr: 'courir', context: 'Déplacement rapide' },
                    { it: 'muoversi', fr: 'se déplacer', context: 'Mouvement général' }
                ]
            },
            {
                id: 'lvl3-dom-orientation',
                title: 'Orientation',
                pairs: [
                    { it: 'a destra', fr: 'à droite', context: 'Direction' },
                    { it: 'a sinistra', fr: 'à gauche', context: 'Direction' },
                    { it: 'dritto', fr: 'tout droit', context: 'Direction' },
                    { it: 'dietro', fr: 'derrière', context: 'Position' },
                    { it: 'davanti', fr: 'devant', context: 'Position' },
                    { it: 'accanto a', fr: 'à côté de', context: 'Proximité' },
                    { it: 'vicino a', fr: 'près de', context: 'Proximité' },
                    { it: 'lontano da', fr: 'loin de', context: 'Distance' },
                    { it: 'in fondo', fr: 'au fond', context: 'Profondeur' },
                    { it: 'all\'angolo', fr: 'au coin', context: 'Intersection' },
                    { it: 'il nord', fr: 'le nord', context: 'Point cardinal' },
                    { it: 'il sud', fr: 'le sud', context: 'Point cardinal' },
                    { it: 'l\'est', fr: 'l\'est', context: 'Point cardinal' },
                    { it: 'l\'ovest', fr: 'l\'ouest', context: 'Point cardinal' },
                    { it: 'la strada', fr: 'la rue', context: 'Lieu' }
                ]
            },
            {
                id: 'lvl3-dom-interaction',
                title: 'Interaction de base',
                pairs: [
                    { it: 'salve', fr: 'bonjour (formel)', context: 'Salutation' },
                    { it: 'ciao', fr: 'salut', context: 'Salutation informelle' },
                    { it: 'buongiorno', fr: 'bonjour', context: 'Salutation matinale' },
                    { it: 'buonasera', fr: 'bonsoir', context: 'Salutation soirée' },
                    { it: 'buonanotte', fr: 'bonne nuit', context: 'Au revoir nocturne' },
                    { it: 'arrivederci', fr: 'au revoir', context: 'Départ' },
                    { it: 'per favore', fr: 's\'il vous plaît', context: 'Politesse' },
                    { it: 'grazie', fr: 'merci', context: 'Remerciement' },
                    { it: 'prego', fr: 'je vous en prie', context: 'Réponse à merci' },
                    { it: 'scusi', fr: 'excusez-moi (formel)', context: 'Excuse' },
                    { it: 'scusa', fr: 'excuse-moi (informel)', context: 'Excuse' },
                    { it: 'mi dispiace', fr: 'je suis désolé', context: 'Regret' },
                    { it: 'come sta?', fr: 'comment allez-vous ?', context: 'Question formelle' },
                    { it: 'come stai?', fr: 'comment vas-tu ?', context: 'Question informelle' },
                    { it: 'bene, grazie', fr: 'bien, merci', context: 'Réponse positive' }
                ]
            },
            {
                id: 'lvl3-dom-services',
                title: 'Services et commerces',
                pairs: [
                    { it: 'il negozio', fr: 'le magasin', context: 'Commerce' },
                    { it: 'il supermercato', fr: 'le supermarché', context: 'Commerce alimentaire' },
                    { it: 'la farmacia', fr: 'la pharmacie', context: 'Santé' },
                    { it: 'la banca', fr: 'la banque', context: 'Finance' },
                    { it: 'l\'ufficio postale', fr: 'la poste', context: 'Service postal' },
                    { it: 'il ristorante', fr: 'le restaurant', context: 'Restauration' },
                    { it: 'il bar', fr: 'le café', context: 'Restauration rapide' },
                    { it: 'l\'ospedale', fr: 'l\'hôpital', context: 'Santé' },
                    { it: 'la stazione', fr: 'la gare', context: 'Transport' },
                    { it: 'l\'aeroporto', fr: 'l\'aéroport', context: 'Transport aérien' },
                    { it: 'il mercato', fr: 'le marché', context: 'Commerce' },
                    { it: 'il panificio', fr: 'la boulangerie', context: 'Commerce alimentaire' },
                    { it: 'la libreria', fr: 'la librairie', context: 'Commerce culturel' },
                    { it: 'il cliente', fr: 'le client', context: 'Personne' },
                    { it: 'il commesso', fr: 'le vendeur', context: 'Personne' }
                ]
            }
        ],
        lexical: [
            {
                id: 'lvl3-lex-places',
                title: 'Lieux de la vie sociale',
                pairs: [
                    { it: 'la città', fr: 'la ville', context: 'Lieu urbain' },
                    { it: 'il paese', fr: 'le village', context: 'Lieu rural' },
                    { it: 'la piazza', fr: 'la place', context: 'Espace public' },
                    { it: 'il parco', fr: 'le parc', context: 'Espace vert' },
                    { it: 'la scuola', fr: 'l\'école', context: 'Éducation' },
                    { it: 'l\'università', fr: 'l\'université', context: 'Enseignement supérieur' },
                    { it: 'la biblioteca', fr: 'la bibliothèque', context: 'Culture' },
                    { it: 'il museo', fr: 'le musée', context: 'Culture' },
                    { it: 'il cinema', fr: 'le cinéma', context: 'Loisir' },
                    { it: 'il teatro', fr: 'le théâtre', context: 'Culture' },
                    { it: 'la chiesa', fr: 'l\'église', context: 'Lieu de culte' },
                    { it: 'l\'ufficio', fr: 'le bureau', context: 'Travail' },
                    { it: 'l\'hotel', fr: 'l\'hôtel', context: 'Hébergement' },
                    { it: 'la spiaggia', fr: 'la plage', context: 'Loisir' },
                    { it: 'la montagna', fr: 'la montagne', context: 'Nature' }
                ]
            },
            {
                id: 'lvl3-lex-transport',
                title: 'Transports',
                pairs: [
                    { it: 'l\'autobus', fr: 'le bus', context: 'Transport public' },
                    { it: 'il treno', fr: 'le train', context: 'Transport public' },
                    { it: 'la metro', fr: 'le métro', context: 'Transport public' },
                    { it: 'il tram', fr: 'le tramway', context: 'Transport public' },
                    { it: 'il taxi', fr: 'le taxi', context: 'Transport privé' },
                    { it: 'la macchina', fr: 'la voiture', context: 'Véhicule' },
                    { it: 'la moto', fr: 'la moto', context: 'Véhicule' },
                    { it: 'la bicicletta', fr: 'le vélo', context: 'Véhicule' },
                    { it: 'l\'aereo', fr: 'l\'avion', context: 'Transport aérien' },
                    { it: 'la nave', fr: 'le bateau', context: 'Transport maritime' },
                    { it: 'il biglietto', fr: 'le billet', context: 'Document de voyage' },
                    { it: 'la fermata', fr: 'l\'arrêt', context: 'Station' },
                    { it: 'la partenza', fr: 'le départ', context: 'Horaire' },
                    { it: 'l\'arrivo', fr: 'l\'arrivée', context: 'Horaire' },
                    { it: 'il viaggio', fr: 'le voyage', context: 'Déplacement' }
                ]
            },
            {
                id: 'lvl3-lex-directions',
                title: 'Directions et positions',
                pairs: [
                    { it: 'dove', fr: 'où', context: 'Question de lieu' },
                    { it: 'qui', fr: 'ici', context: 'Proximité' },
                    { it: 'lì', fr: 'là', context: 'Distance moyenne' },
                    { it: 'là', fr: 'là-bas', context: 'Distance éloignée' },
                    { it: 'sopra', fr: 'au-dessus', context: 'Position verticale' },
                    { it: 'sotto', fr: 'en dessous', context: 'Position verticale' },
                    { it: 'dentro', fr: 'dedans', context: 'Intérieur' },
                    { it: 'fuori', fr: 'dehors', context: 'Extérieur' },
                    { it: 'tra', fr: 'entre', context: 'Position intermédiaire' },
                    { it: 'verso', fr: 'vers', context: 'Direction' },
                    { it: 'fino a', fr: 'jusqu\'à', context: 'Limite' },
                    { it: 'da', fr: 'de/depuis', context: 'Origine' },
                    { it: 'a', fr: 'à', context: 'Destination' },
                    { it: 'su', fr: 'sur', context: 'Position' },
                    { it: 'in', fr: 'dans/en', context: 'Position' }
                ]
            },
            {
                id: 'lvl3-lex-politeness',
                title: 'Politesse et interaction',
                pairs: [
                    { it: 'per favore', fr: 's\'il vous plaît', context: 'Demande polie' },
                    { it: 'per piacere', fr: 's\'il te plaît', context: 'Demande informelle' },
                    { it: 'grazie mille', fr: 'merci beaucoup', context: 'Remerciement appuyé' },
                    { it: 'molto gentile', fr: 'très gentil', context: 'Compliment' },
                    { it: 'permesso', fr: 'pardon (pour passer)', context: 'Passage' },
                    { it: 'con piacere', fr: 'avec plaisir', context: 'Acceptation' },
                    { it: 'volentieri', fr: 'volontiers', context: 'Acceptation enthousiaste' },
                    { it: 'purtroppo', fr: 'malheureusement', context: 'Regret' },
                    { it: 'congratulazioni', fr: 'félicitations', context: 'Joie pour autrui' },
                    { it: 'auguri', fr: 'meilleurs vœux', context: 'Souhait' },
                    { it: 'buon compleanno', fr: 'bon anniversaire', context: 'Souhait' },
                    { it: 'buon viaggio', fr: 'bon voyage', context: 'Souhait' },
                    { it: 'buon appetito', fr: 'bon appétit', context: 'Souhait' },
                    { it: 'in bocca al lupo', fr: 'bonne chance', context: 'Encouragement' },
                    { it: 'crepi', fr: 'merci (réponse)', context: 'Réponse à encouragement' }
                ]
            },
            {
                id: 'lvl3-lex-questions',
                title: 'Questions essentielles',
                pairs: [
                    { it: 'chi', fr: 'qui', context: 'Personne' },
                    { it: 'che cosa', fr: 'quoi', context: 'Chose' },
                    { it: 'dove', fr: 'où', context: 'Lieu' },
                    { it: 'quando', fr: 'quand', context: 'Temps' },
                    { it: 'perché', fr: 'pourquoi', context: 'Raison' },
                    { it: 'come', fr: 'comment', context: 'Manière' },
                    { it: 'quanto', fr: 'combien', context: 'Quantité' },
                    { it: 'quale', fr: 'quel/lequel', context: 'Choix' },
                    { it: 'che ore sono?', fr: 'quelle heure est-il ?', context: 'Heure' },
                    { it: 'quanto costa?', fr: 'combien ça coûte ?', context: 'Prix' },
                    { it: 'dov\'è?', fr: 'où est-ce ?', context: 'Localisation' },
                    { it: 'come si chiama?', fr: 'comment s\'appelle-t-il ?', context: 'Nom' },
                    { it: 'posso?', fr: 'puis-je ?', context: 'Permission' },
                    { it: 'mi può aiutare?', fr: 'pouvez-vous m\'aider ?', context: 'Demande d\'aide' },
                    { it: 'che cosa significa?', fr: 'qu\'est-ce que ça veut dire ?', context: 'Signification' }
                ]
            }
        ],
        verbs: [
            {
                id: 'lvl3-verb-movement',
                title: 'Verbes de mouvement au présent',
                pairs: [
                    { it: 'vado', fr: 'je vais', context: 'Mouvement' },
                    { it: 'vai', fr: 'tu vas', context: 'Mouvement' },
                    { it: 'va', fr: 'il/elle va', context: 'Mouvement' },
                    { it: 'andiamo', fr: 'nous allons', context: 'Mouvement' },
                    { it: 'andate', fr: 'vous allez', context: 'Mouvement' },
                    { it: 'vanno', fr: 'ils/elles vont', context: 'Mouvement' },
                    { it: 'vengo', fr: 'je viens', context: 'Approche' },
                    { it: 'esco', fr: 'je sors', context: 'Sortie' },
                    { it: 'entro', fr: 'j\'entre', context: 'Entrée' },
                    { it: 'parto', fr: 'je pars', context: 'Départ' },
                    { it: 'arrivo', fr: 'j\'arrive', context: 'Arrivée' },
                    { it: 'torno', fr: 'je retourne', context: 'Retour' },
                    { it: 'salgo', fr: 'je monte', context: 'Ascension' },
                    { it: 'scendo', fr: 'je descends', context: 'Descente' },
                    { it: 'attraverso', fr: 'je traverse', context: 'Passage' }
                ]
            },
            {
                id: 'lvl3-verb-modals',
                title: 'Pouvoir / vouloir / devoir au présent',
                pairs: [
                    { it: 'posso', fr: 'je peux', context: 'Capacité/permission' },
                    { it: 'puoi', fr: 'tu peux', context: 'Capacité/permission' },
                    { it: 'può', fr: 'il/elle peut', context: 'Capacité/permission' },
                    { it: 'possiamo', fr: 'nous pouvons', context: 'Capacité/permission' },
                    { it: 'potete', fr: 'vous pouvez', context: 'Capacité/permission' },
                    { it: 'possono', fr: 'ils/elles peuvent', context: 'Capacité/permission' },
                    { it: 'voglio', fr: 'je veux', context: 'Volonté' },
                    { it: 'vuoi', fr: 'tu veux', context: 'Volonté' },
                    { it: 'vuole', fr: 'il/elle veut', context: 'Volonté' },
                    { it: 'devo', fr: 'je dois', context: 'Obligation' },
                    { it: 'devi', fr: 'tu dois', context: 'Obligation' },
                    { it: 'deve', fr: 'il/elle doit', context: 'Obligation' },
                    { it: 'dobbiamo', fr: 'nous devons', context: 'Obligation' },
                    { it: 'dovete', fr: 'vous devez', context: 'Obligation' },
                    { it: 'devono', fr: 'ils/elles doivent', context: 'Obligation' }
                ]
            },
            {
                id: 'lvl3-verb-interrogative',
                title: 'Construction interrogative',
                pairs: [
                    { it: 'parli italiano?', fr: 'parles-tu italien ?', context: 'Question simple' },
                    { it: 'dove vai?', fr: 'où vas-tu ?', context: 'Question avec où' },
                    { it: 'quando parti?', fr: 'quand pars-tu ?', context: 'Question avec quand' },
                    { it: 'perché studi?', fr: 'pourquoi études-tu ?', context: 'Question avec pourquoi' },
                    { it: 'come stai?', fr: 'comment vas-tu ?', context: 'Question avec comment' },
                    { it: 'quanto costa?', fr: 'combien ça coûte ?', context: 'Question avec combien' },
                    { it: 'che cosa fai?', fr: 'que fais-tu ?', context: 'Question avec quoi' },
                    { it: 'chi è?', fr: 'qui est-ce ?', context: 'Question avec qui' },
                    { it: 'quale preferisci?', fr: 'lequel préfères-tu ?', context: 'Question avec quel' },
                    { it: 'hai fame?', fr: 'as-tu faim ?', context: 'Question oui/non' },
                    { it: 'vuoi venire?', fr: 'veux-tu venir ?', context: 'Invitation' },
                    { it: 'posso aiutare?', fr: 'puis-je aider ?', context: 'Offre d\'aide' },
                    { it: 'dov\'è la stazione?', fr: 'où est la gare ?', context: 'Localisation' },
                    { it: 'a che ora?', fr: 'à quelle heure ?', context: 'Heure' },
                    { it: 'quanto tempo?', fr: 'combien de temps ?', context: 'Durée' }
                ]
            },
            {
                id: 'lvl3-verb-imperative',
                title: 'Impératif simple (instructions)',
                pairs: [
                    { it: 'parla!', fr: 'parle !', context: 'Ordre 2e sing' },
                    { it: 'ascolta!', fr: 'écoute !', context: 'Ordre 2e sing' },
                    { it: 'guarda!', fr: 'regarde !', context: 'Ordre 2e sing' },
                    { it: 'aspetta!', fr: 'attends !', context: 'Ordre 2e sing' },
                    { it: 'vieni!', fr: 'viens !', context: 'Ordre 2e sing' },
                    { it: 'vai!', fr: 'va !', context: 'Ordre 2e sing' },
                    { it: 'prendi!', fr: 'prends !', context: 'Ordre 2e sing' },
                    { it: 'apri!', fr: 'ouvre !', context: 'Ordre 2e sing' },
                    { it: 'chiudi!', fr: 'ferme !', context: 'Ordre 2e sing' },
                    { it: 'scusi!', fr: 'excusez-moi !', context: 'Politesse formelle' },
                    { it: 'scusa!', fr: 'excuse-moi !', context: 'Politesse informelle' },
                    { it: 'andiamo!', fr: 'allons-y !', context: 'Ordre 1e pl' },
                    { it: 'state attenti!', fr: 'faites attention !', context: 'Ordre 2e pl' },
                    { it: 'non parlare!', fr: 'ne parle pas !', context: 'Interdiction' },
                    { it: 'non correre!', fr: 'ne cours pas !', context: 'Interdiction' }
                ]
            }
        ]
    }
};
