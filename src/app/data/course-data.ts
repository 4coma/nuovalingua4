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
    },
    4: {
        domaines: [
            {
                id: 'lvl4-dom-family',
                title: 'Vie familiale',
                pairs: [
                    { it: 'i genitori', fr: 'les parents', context: 'Famille proche' },
                    { it: 'i fratelli', fr: 'les frères et sœurs', context: 'Fratrie' },
                    { it: 'il cugino', fr: 'le cousin', context: 'Famille élargie' },
                    { it: 'il suocero', fr: 'le beau-père', context: 'Belle-famille' },
                    { it: 'la nuora', fr: 'la belle-fille', context: 'Belle-famille' },
                    { it: 'convivere', fr: 'vivre ensemble', context: 'Vie commune' },
                    { it: 'sposarsi', fr: 'se marier', context: 'Événement familial' },
                    { it: 'separarsi', fr: 'se séparer', context: 'Événement familial' },
                    { it: 'andare a trovare', fr: 'rendre visite', context: 'Visite' },
                    { it: 'prendersi cura di', fr: 'prendre soin de', context: 'Soutien' },
                    { it: 'litigare', fr: 'se disputer', context: 'Conflit' },
                    { it: 'fare pace', fr: 'se réconcilier', context: 'Résolution' }
                ]
            },
            {
                id: 'lvl4-dom-friends',
                title: 'Amitiés et rencontres',
                pairs: [
                    { it: 'un amico stretto', fr: 'un ami proche', context: 'Lien fort' },
                    { it: 'una conoscenza', fr: 'une connaissance', context: 'Lien faible' },
                    { it: 'fare nuove amicizie', fr: 'se faire de nouveaux amis', context: 'Rencontres' },
                    { it: 'incontrarsi per un caffè', fr: 'se retrouver pour un café', context: 'Rendez-vous' },
                    { it: 'organizzare una cena', fr: 'organiser un dîner', context: 'Invitation' },
                    { it: 'festeggiare', fr: 'fêter', context: 'Événement festif' },
                    { it: 'mantenere i contatti', fr: 'garder le contact', context: 'Relation' },
                    { it: 'fare networking', fr: 'réseauter', context: 'Relation pro' },
                    { it: 'rompere il ghiaccio', fr: 'briser la glace', context: 'Entrée en matière' },
                    { it: 'mettersi d\'accordo', fr: 'se mettre d’accord', context: 'Coordination' }
                ]
            },
            {
                id: 'lvl4-dom-conflict',
                title: 'Accords et désaccords',
                pairs: [
                    { it: 'sono d\'accordo', fr: 'je suis d\'accord', context: 'Accord' },
                    { it: 'non sono d\'accordo', fr: 'je ne suis pas d\'accord', context: 'Désaccord' },
                    { it: 'capisco il tuo punto', fr: 'je comprends ton point', context: 'Empathie' },
                    { it: 'possiamo trovare un compromesso', fr: 'on peut trouver un compromis', context: 'Négociation' },
                    { it: 'mi dispiace se ti ho ferito', fr: 'désolé si je t\'ai blessé', context: 'Excuse' },
                    { it: 'non era mia intenzione', fr: 'ce n’était pas mon intention', context: 'Clarification' },
                    { it: 'parliamone con calma', fr: 'parlons-en calmement', context: 'Apaisement' },
                    { it: 'mettere i limiti', fr: 'poser des limites', context: 'Assertivité' },
                    { it: 'rispettare le differenze', fr: 'respecter les différences', context: 'Tolérance' },
                    { it: 'chiarire un malinteso', fr: 'clarifier un malentendu', context: 'Résolution' }
                ]
            },
            {
                id: 'lvl4-dom-events',
                title: 'Vie sociale et sorties',
                pairs: [
                    { it: 'uscire la sera', fr: 'sortir le soir', context: 'Loisir' },
                    { it: 'prenotare un tavolo', fr: 'réserver une table', context: 'Organisation' },
                    { it: 'partecipare a un concerto', fr: 'assister à un concert', context: 'Culture' },
                    { it: 'andare a una mostra', fr: 'aller à une exposition', context: 'Culture' },
                    { it: 'fare volontariato', fr: 'faire du bénévolat', context: 'Engagement' },
                    { it: 'un aperitivo', fr: 'un apéritif', context: 'Moment social' },
                    { it: 'un brindisi', fr: 'un toast', context: 'Célébration' },
                    { it: 'mettersi elegante', fr: 's\'habiller chic', context: 'Tenue' },
                    { it: 'rientrare tardi', fr: 'rentrer tard', context: 'Organisation' },
                    { it: 'accompagnare qualcuno', fr: 'accompagner quelqu’un', context: 'Soutien' }
                ]
            }
        ],
        lexical: [
            {
                id: 'lvl4-lex-emotions',
                title: 'Émotions et sentiments',
                pairs: [
                    { it: 'entusiasta', fr: 'enthousiaste', context: 'Émotion positive' },
                    { it: 'sollevato', fr: 'soulagé', context: 'Émotion positive' },
                    { it: 'deluso', fr: 'déçu', context: 'Émotion négative' },
                    { it: 'geloso', fr: 'jaloux', context: 'Relation' },
                    { it: 'orgoglioso', fr: 'fier', context: 'Émotion' },
                    { it: 'imbarazzato', fr: 'gêné', context: 'Émotion sociale' },
                    { it: 'grato', fr: 'reconnaissant', context: 'Émotion' },
                    { it: 'preoccupato', fr: 'inquiet', context: 'Émotion' },
                    { it: 'rassicurante', fr: 'rassurant', context: 'Ton' },
                    { it: 'delicato', fr: 'délicat', context: 'Sujet sensible' },
                    { it: 'affettuoso', fr: 'affectueux', context: 'Lien' },
                    { it: 'rancoroso', fr: 'rancunier', context: 'Caractère' }
                ]
            },
            {
                id: 'lvl4-lex-traits',
                title: 'Qualités et défauts',
                pairs: [
                    { it: 'affidabile', fr: 'fiable', context: 'Qualité' },
                    { it: 'premuroso', fr: 'prévenant', context: 'Qualité' },
                    { it: 'socievole', fr: 'sociable', context: 'Qualité' },
                    { it: 'introverso', fr: 'introverti', context: 'Caractère' },
                    { it: 'estroverso', fr: 'extraverti', context: 'Caractère' },
                    { it: 'puntuale', fr: 'ponctuel', context: 'Habitude' },
                    { it: 'altruista', fr: 'altruiste', context: 'Qualité' },
                    { it: 'testardo', fr: 'têtu', context: 'Défaut' },
                    { it: 'disponibile', fr: 'disponible', context: 'Relation' },
                    { it: 'superficiale', fr: 'superficiel', context: 'Défaut' },
                    { it: 'generoso', fr: 'généreux', context: 'Qualité' },
                    { it: 'invidioso', fr: 'envieux', context: 'Défaut' }
                ]
            },
            {
                id: 'lvl4-lex-social-actions',
                title: 'Actions sociales',
                pairs: [
                    { it: 'presentare qualcuno', fr: 'présenter quelqu’un', context: 'Présentation' },
                    { it: 'fare un complimento', fr: 'faire un compliment', context: 'Interaction' },
                    { it: 'chiedere scusa', fr: 'demander pardon', context: 'Réparation' },
                    { it: 'ringraziare', fr: 'remercier', context: 'Politesse' },
                    { it: 'consolare', fr: 'consoler', context: 'Soutien' },
                    { it: 'incoraggiare', fr: 'encourager', context: 'Soutien' },
                    { it: 'consigliare', fr: 'conseiller', context: 'Aide' },
                    { it: 'sconsigliare', fr: 'déconseiller', context: 'Aide' },
                    { it: 'evitare un argomento', fr: 'éviter un sujet', context: 'Gestion' },
                    { it: 'cambiare discorso', fr: 'changer de sujet', context: 'Gestion' }
                ]
            },
            {
                id: 'lvl4-lex-phrases',
                title: 'Expressions de politesse avancée',
                pairs: [
                    { it: 'la ringrazio in anticipo', fr: 'je vous remercie d’avance', context: 'Politesse formelle' },
                    { it: 'mi permetto di chiederle', fr: 'je me permets de vous demander', context: 'Demande formelle' },
                    { it: 'ci tenevo a dirti', fr: 'je tenais à te dire', context: 'Message personnel' },
                    { it: 'fammi sapere', fr: 'fais-moi savoir', context: 'Suivi' },
                    { it: 'restiamo in contatto', fr: 'on reste en contact', context: 'Clôture' },
                    { it: 'scusa il disturbo', fr: 'désolé du dérangement', context: 'Excuse' },
                    { it: 'non volevo importunarti', fr: 'je ne voulais pas te déranger', context: 'Excuse' },
                    { it: 'sei stato di grande aiuto', fr: 'tu as été d’une grande aide', context: 'Reconnaissance' },
                    { it: 'a disposizione', fr: 'à disposition', context: 'Offre d’aide' },
                    { it: 'gradirei', fr: 'j\'aimerais (cond.)', context: 'Demande polie' }
                ]
            },
            {
                id: 'lvl4-lex-connectors',
                title: 'Connecteurs conversationnels',
                pairs: [
                    { it: 'innanzitutto', fr: 'tout d’abord', context: 'Organisation' },
                    { it: 'tra l\'altro', fr: 'd\'ailleurs', context: 'Digression' },
                    { it: 'comunque', fr: 'de toute façon', context: 'Redirection' },
                    { it: 'a proposito', fr: 'à propos', context: 'Transition' },
                    { it: 'in ogni caso', fr: 'en tout cas', context: 'Conclusion partielle' },
                    { it: 'da una parte', fr: 'd’un côté', context: 'Nuance' },
                    { it: 'dall\'altra', fr: 'de l’autre', context: 'Nuance' },
                    { it: 'nel frattempo', fr: 'entre-temps', context: 'Temps' },
                    { it: 'per quanto riguarda', fr: 'en ce qui concerne', context: 'Thème' },
                    { it: 'alla fine', fr: 'au final', context: 'Conclusion' }
                ]
            }
        ],
        verbs: [
            {
                id: 'lvl4-verb-reciprocal',
                title: 'Verbes pronominaux réciproques',
                pairs: [
                    { it: 'ci vediamo', fr: 'on se voit', context: 'Planification' },
                    { it: 'ci sentiamo', fr: 'on se tient au courant', context: 'Contact' },
                    { it: 'ci abbracciamo', fr: 'on se serre dans les bras', context: 'Affection' },
                    { it: 'ci sposiamo', fr: 'nous nous marions', context: 'Événement' },
                    { it: 'ci lasciamo', fr: 'nous nous quittons', context: 'Séparation' },
                    { it: 'ci aiutiamo', fr: 'nous nous aidons', context: 'Soutien' },
                    { it: 'ci capiamo', fr: 'nous nous comprenons', context: 'Empathie' },
                    { it: 'ci rispettiamo', fr: 'nous nous respectons', context: 'Respect' },
                    { it: 'ci perdoniamo', fr: 'nous nous pardonnons', context: 'Réconciliation' },
                    { it: 'ci frequentiamo', fr: 'nous nous fréquentons', context: 'Relation' }
                ]
            },
            {
                id: 'lvl4-verb-polite',
                title: 'Formes polies (condizionale presente)',
                pairs: [
                    { it: 'vorrei', fr: 'je voudrais', context: 'Demande polie' },
                    { it: 'potrei', fr: 'je pourrais', context: 'Proposition polie' },
                    { it: 'le piacerebbe', fr: 'voudriez-vous', context: 'Invitation' },
                    { it: 'gradirei', fr: 'j\'apprécierais', context: 'Souhait' },
                    { it: 'mi servirebbe', fr: 'il me faudrait', context: 'Besoin' },
                    { it: 'avrei bisogno di', fr: 'j’aurais besoin de', context: 'Demande' },
                    { it: 'sarebbe possibile?', fr: 'serait-il possible ?', context: 'Permission' },
                    { it: 'potremmo fissare', fr: 'pourrions-nous fixer', context: 'Organisation' },
                    { it: 'dovremmo parlare', fr: 'nous devrions parler', context: 'Suggestion' },
                    { it: 'non vorrei disturbare', fr: 'je ne voudrais pas déranger', context: 'Politesse' }
                ]
            },
            {
                id: 'lvl4-verb-discourse',
                title: 'Rapporter une parole (présent)',
                pairs: [
                    { it: 'dice che', fr: 'il dit que', context: 'Discours rapporté' },
                    { it: 'mi ha chiesto di', fr: 'il m’a demandé de', context: 'Demande indirecte' },
                    { it: 'mi ha detto che', fr: 'il m’a dit que', context: 'Information' },
                    { it: 'secondo lui', fr: 'd’après lui', context: 'Opinion' },
                    { it: 'pare che', fr: 'il paraît que', context: 'Ouï-dire' },
                    { it: 'sembra che', fr: 'il semble que', context: 'Ouï-dire' },
                    { it: 'mi ha invitato a', fr: 'il m’a invité à', context: 'Invitation' },
                    { it: 'ha promesso di', fr: 'il a promis de', context: 'Engagement' },
                    { it: 'ha proposto di', fr: 'il a proposé de', context: 'Proposition' },
                    { it: 'ha consigliato di', fr: 'il a conseillé de', context: 'Conseil' }
                ]
            }
        ]
    },
    5: {
        domaines: [
            {
                id: 'lvl5-dom-trip',
                title: 'Raconter un voyage',
                pairs: [
                    { it: 'sono partito all\'alba', fr: 'je suis parti à l’aube', context: 'Passato prossimo' },
                    { it: 'ho preso il treno', fr: 'j’ai pris le train', context: 'Transport' },
                    { it: 'sono arrivato in ritardo', fr: 'je suis arrivé en retard', context: 'Incident' },
                    { it: 'abbiamo visitato il centro storico', fr: 'nous avons visité le centre historique', context: 'Activité' },
                    { it: 'mi sono perso', fr: 'je me suis perdu', context: 'Imprévu' },
                    { it: 'ha piovuto tutto il giorno', fr: 'il a plu toute la journée', context: 'Météo' },
                    { it: 'ho assaggiato piatti tipici', fr: 'j’ai goûté des plats typiques', context: 'Gastronomie' },
                    { it: 'la serata è finita bene', fr: 'la soirée s’est bien terminée', context: 'Clôture' },
                    { it: 'il viaggio è stato faticoso', fr: 'le voyage a été fatigant', context: 'Ressenti' },
                    { it: 'ci siamo divertiti un sacco', fr: 'on s’est beaucoup amusés', context: 'Bilan' }
                ]
            },
            {
                id: 'lvl5-dom-childhood',
                title: 'Souvenirs d’enfance',
                pairs: [
                    { it: 'da bambino giocavo in strada', fr: 'enfant je jouais dans la rue', context: 'Imperfetto' },
                    { it: 'passavo le estati dai nonni', fr: 'je passais les étés chez mes grands-parents', context: 'Habitude' },
                    { it: 'avevo un cane', fr: 'j’avais un chien', context: 'Possession passée' },
                    { it: 'sognavo di viaggiare', fr: 'je rêvais de voyager', context: 'Rêve' },
                    { it: 'stavo ore a leggere', fr: 'je passais des heures à lire', context: 'Durée' },
                    { it: 'una volta mi sono perso al mercato', fr: 'une fois je me suis perdu au marché', context: 'Épisode' },
                    { it: 'mi ricordo il profumo del pane', fr: 'je me souviens de l’odeur du pain', context: 'Souvenir sensoriel' },
                    { it: 'la scuola era vicina', fr: 'l’école était proche', context: 'Description passée' },
                    { it: 'gli amici venivano a casa', fr: 'les amis venaient à la maison', context: 'Habitude' },
                    { it: 'non avevamo internet', fr: 'nous n’avions pas internet', context: 'Contexte' }
                ]
            },
            {
                id: 'lvl5-dom-incidents',
                title: 'Imprévus et galères',
                pairs: [
                    { it: 'mi si è rotto il telefono', fr: 'mon téléphone s’est cassé', context: 'Incident' },
                    { it: 'ho perso il portafoglio', fr: 'j’ai perdu mon portefeuille', context: 'Perte' },
                    { it: 'ci hanno cancellato il volo', fr: 'ils ont annulé notre vol', context: 'Transport' },
                    { it: 'ho dovuto aspettare ore', fr: 'j’ai dû attendre des heures', context: 'Attente' },
                    { it: 'non funzionava la carta', fr: 'la carte ne marchait pas', context: 'Paiement' },
                    { it: 'si è scaricata la batteria', fr: 'la batterie s’est vidée', context: 'Technique' },
                    { it: 'mi sono fatto male', fr: 'je me suis fait mal', context: 'Santé' },
                    { it: 'alla fine abbiamo trovato una soluzione', fr: 'au final on a trouvé une solution', context: 'Résolution' },
                    { it: 'è stato un incubo', fr: 'ça a été un cauchemar', context: 'Ressenti' },
                    { it: 'ora ci rido sopra', fr: 'maintenant j’en ris', context: 'Bilan' }
                ]
            },
            {
                id: 'lvl5-dom-workstudy',
                title: 'Parcours pro et études',
                pairs: [
                    { it: 'mi sono laureato nel 2020', fr: 'j’ai été diplômé en 2020', context: 'Études' },
                    { it: 'ho fatto uno stage', fr: 'j’ai fait un stage', context: 'Expérience' },
                    { it: 'lavoravo part-time', fr: 'je travaillais à temps partiel', context: 'Habitude' },
                    { it: 'ho cambiato lavoro', fr: 'j’ai changé de travail', context: 'Transition' },
                    { it: 'gestivo un piccolo team', fr: 'je gérais une petite équipe', context: 'Responsabilité' },
                    { it: 'ho imparato tanto', fr: 'j’ai beaucoup appris', context: 'Bilan' },
                    { it: 'mi occupavo di clienti', fr: 'je m’occupais des clients', context: 'Tâche' },
                    { it: 'ho fallito un progetto', fr: 'j’ai raté un projet', context: 'Échec' },
                    { it: 'poi ho riprovato', fr: 'puis j’ai recommencé', context: 'Persévérance' },
                    { it: 'alla fine sono cresciuto', fr: 'au final j’ai grandi', context: 'Bilan' }
                ]
            }
        ],
        lexical: [
            {
                id: 'lvl5-lex-time-past',
                title: 'Marqueurs temporels du passé',
                pairs: [
                    { it: 'ieri', fr: 'hier', context: 'Récent' },
                    { it: 'l\'altro ieri', fr: 'avant-hier', context: 'Récent' },
                    { it: 'la settimana scorsa', fr: 'la semaine dernière', context: 'Période' },
                    { it: 'un mese fa', fr: 'il y a un mois', context: 'Distance' },
                    { it: 'qualche anno fa', fr: 'il y a quelques années', context: 'Distance' },
                    { it: 'all\'improvviso', fr: 'soudain', context: 'Rupture' },
                    { it: 'nel frattempo', fr: 'pendant ce temps', context: 'Simultanéité' },
                    { it: 'mentre', fr: 'pendant que', context: 'Imperfetto' },
                    { it: 'poi', fr: 'puis', context: 'Séquence' },
                    { it: 'alla fine', fr: 'à la fin', context: 'Clôture' }
                ]
            },
            {
                id: 'lvl5-lex-connectors-story',
                title: 'Connecteurs narratifs',
                pairs: [
                    { it: 'prima', fr: 'd’abord', context: 'Séquence' },
                    { it: 'dopo', fr: 'ensuite', context: 'Séquence' },
                    { it: 'in seguito', fr: 'par la suite', context: 'Séquence' },
                    { it: 'improvvisamente', fr: 'soudainement', context: 'Rupture' },
                    { it: 'per fortuna', fr: 'heureusement', context: 'Commentaire' },
                    { it: 'purtroppo', fr: 'malheureusement', context: 'Commentaire' },
                    { it: 'infatti', fr: 'en effet', context: 'Justification' },
                    { it: 'così', fr: 'ainsi', context: 'Conséquence' },
                    { it: 'quindi', fr: 'donc', context: 'Conséquence' },
                    { it: 'in conclusione', fr: 'en conclusion', context: 'Clôture' }
                ]
            },
            {
                id: 'lvl5-lex-feelings-after',
                title: 'Ressentis après coup',
                pairs: [
                    { it: 'ero esausto', fr: 'j’étais épuisé', context: 'Imperfetto' },
                    { it: 'mi sono sentito sollevato', fr: 'je me suis senti soulagé', context: 'Passato prossimo' },
                    { it: 'ero agitato', fr: 'j’étais agité', context: 'Imperfetto' },
                    { it: 'mi sono vergognato', fr: 'j’ai eu honte', context: 'Émotion' },
                    { it: 'ero orgoglioso', fr: 'j’étais fier', context: 'Émotion' },
                    { it: 'mi sono pentito', fr: 'je l’ai regretté', context: 'Émotion' },
                    { it: 'ero tranquillo', fr: 'j’étais tranquille', context: 'État' },
                    { it: 'mi sentivo al sicuro', fr: 'je me sentais en sécurité', context: 'État' },
                    { it: 'ero frustrato', fr: 'j’étais frustré', context: 'Émotion' },
                    { it: 'mi è sembrato interminabile', fr: 'cela m’a semblé interminable', context: 'Perception' }
                ]
            },
            {
                id: 'lvl5-lex-transport',
                title: 'Transport et déplacement',
                pairs: [
                    { it: 'il volo è in ritardo', fr: 'le vol est en retard', context: 'Avion' },
                    { it: 'ho perso la coincidenza', fr: 'j’ai raté la correspondance', context: 'Train/avion' },
                    { it: 'il bagaglio', fr: 'le bagage', context: 'Voyage' },
                    { it: 'il biglietto', fr: 'le billet', context: 'Voyage' },
                    { it: 'la prenotazione', fr: 'la réservation', context: 'Voyage' },
                    { it: 'l\'albergo era pieno', fr: 'l’hôtel était complet', context: 'Hébergement' },
                    { it: 'abbiamo noleggiato un\'auto', fr: 'nous avons loué une voiture', context: 'Transport' },
                    { it: 'sono rimasto bloccato nel traffico', fr: 'je suis resté bloqué dans le trafic', context: 'Incident' },
                    { it: 'il treno era affollato', fr: 'le train était bondé', context: 'Contexte' },
                    { it: 'abbiamo fatto autostop', fr: 'nous avons fait de l’auto-stop', context: 'Solution' }
                ]
            },
            {
                id: 'lvl5-lex-weather',
                title: 'Météo pour un récit',
                pairs: [
                    { it: 'c\'era nebbia', fr: 'il y avait du brouillard', context: 'Imperfetto' },
                    { it: 'tirava vento', fr: 'il y avait du vent', context: 'Imperfetto' },
                    { it: 'ha nevicato tutta la notte', fr: 'il a neigé toute la nuit', context: 'Passato prossimo' },
                    { it: 'faceva un caldo tremendo', fr: 'il faisait une chaleur terrible', context: 'Imperfetto' },
                    { it: 'il cielo era coperto', fr: 'le ciel était couvert', context: 'Imperfetto' },
                    { it: 'è scoppiato un temporale', fr: 'un orage a éclaté', context: 'Passato prossimo' },
                    { it: 'la strada era ghiacciata', fr: 'la route était verglacée', context: 'Description' },
                    { it: 'l\'aria era umida', fr: 'l’air était humide', context: 'Description' },
                    { it: 'si è alzato il vento', fr: 'le vent s’est levé', context: 'Évolution' },
                    { it: 'si è rasserenato', fr: 'le temps s’est éclairci', context: 'Évolution' }
                ]
            }
        ],
        verbs: [
            {
                id: 'lvl5-verb-passato-prossimo',
                title: 'Passato prossimo (régulier/irrégulier)',
                pairs: [
                    { it: 'ho mangiato', fr: 'j’ai mangé', context: 'Régulier' },
                    { it: 'ho visto', fr: 'j’ai vu', context: 'Irrégulier' },
                    { it: 'ho fatto', fr: 'j’ai fait', context: 'Irrégulier' },
                    { it: 'ho detto', fr: 'j’ai dit', context: 'Irrégulier' },
                    { it: 'sono andato', fr: 'je suis allé', context: 'Verbe de mouvement' },
                    { it: 'sono arrivato', fr: 'je suis arrivé', context: 'Verbe de mouvement' },
                    { it: 'sono rimasto', fr: 'je suis resté', context: 'État' },
                    { it: 'sono diventato', fr: 'je suis devenu', context: 'Changement' },
                    { it: 'ho preso', fr: 'j’ai pris', context: 'Irrégulier' },
                    { it: 'ho scritto', fr: 'j’ai écrit', context: 'Irrégulier' }
                ]
            },
            {
                id: 'lvl5-verb-imperfetto',
                title: 'Imperfetto pour le décor',
                pairs: [
                    { it: 'ero', fr: 'j’étais', context: 'Être' },
                    { it: 'avevo', fr: 'j’avais', context: 'Avoir' },
                    { it: 'faceva caldo', fr: 'il faisait chaud', context: 'Météo' },
                    { it: 'camminavo spesso', fr: 'je marchais souvent', context: 'Habitude' },
                    { it: 'aspettavo', fr: 'j’attendais', context: 'Action longue' },
                    { it: 'leggevo', fr: 'je lisais', context: 'Action longue' },
                    { it: 'stavamo parlando', fr: 'nous étions en train de parler', context: 'Progressif' },
                    { it: 'giocavano fuori', fr: 'ils jouaient dehors', context: 'Habitude' },
                    { it: 'c\'era silenzio', fr: 'il y avait du silence', context: 'Décor' },
                    { it: 'la città era vuota', fr: 'la ville était vide', context: 'Décor' }
                ]
            },
            {
                id: 'lvl5-verb-sequencing',
                title: 'Enchaîner passé composé et imparfait',
                pairs: [
                    { it: 'stavo cenando quando è arrivato', fr: 'je dînais quand il est arrivé', context: 'Action longue + rupture' },
                    { it: 'pioveva ma siamo usciti', fr: 'il pleuvait mais nous sommes sortis', context: 'Concession' },
                    { it: 'leggevo e mi sono addormentato', fr: 'je lisais et je me suis endormi', context: 'Succession' },
                    { it: 'mi annoiavo, allora ho chiamato', fr: 'je m’ennuyais, alors j’ai appelé', context: 'Conséquence' },
                    { it: 'aspettavamo quando hanno annunciato', fr: 'nous attendions quand ils ont annoncé', context: 'Rupture' },
                    { it: 'faceva freddo, quindi ho chiuso', fr: 'il faisait froid, donc j’ai fermé', context: 'Conséquence' },
                    { it: 'parlavamo quando è suonato il telefono', fr: 'nous parlions quand le téléphone a sonné', context: 'Interruption' },
                    { it: 'stava andando bene finché', fr: 'ça allait bien jusqu’à ce que', context: 'Limite' },
                    { it: 'pensavo a lui e mi ha scritto', fr: 'je pensais à lui et il m’a écrit', context: 'Hasard' },
                    { it: 'viaggiavo spesso, poi mi sono fermato', fr: 'je voyageais souvent, puis je me suis arrêté', context: 'Changement' }
                ]
            }
        ]
    },
    6: {
        domaines: [
            {
                id: 'lvl6-dom-places',
                title: 'Décrire des lieux avec nuance',
                pairs: [
                    { it: 'un quartiere vivace', fr: 'un quartier vivant', context: 'Ambiance' },
                    { it: 'una strada alberata', fr: 'une rue bordée d’arbres', context: 'Détail visuel' },
                    { it: 'un interno luminoso', fr: 'un intérieur lumineux', context: 'Lumière' },
                    { it: 'un atmosfera ovattata', fr: 'une ambiance feutrée', context: 'Sensation' },
                    { it: 'rumore di fondo', fr: 'bruit de fond', context: 'Perception' },
                    { it: 'profumo di pane caldo', fr: 'parfum de pain chaud', context: 'Odeur' },
                    { it: 'vista mozzafiato', fr: 'vue à couper le souffle', context: 'Évaluation' },
                    { it: 'un contrasto netto', fr: 'un contraste marqué', context: 'Analyse' },
                    { it: 'spazi ariosi', fr: 'espaces aérés', context: 'Volume' },
                    { it: 'illuminazione tenue', fr: 'éclairage tamisé', context: 'Lumière' }
                ]
            },
            {
                id: 'lvl6-dom-people',
                title: 'Portraits nuancés',
                pairs: [
                    { it: 'ha uno sguardo attento', fr: 'il a un regard attentif', context: 'Observation' },
                    { it: 'parla con calma', fr: 'il parle calmement', context: 'Manière' },
                    { it: 'ha un senso dell\'umorismo sottile', fr: 'il a un humour subtil', context: 'Caractère' },
                    { it: 'è riservato ma empatico', fr: 'il est réservé mais empathique', context: 'Nuance' },
                    { it: 'sa mediare', fr: 'il sait faire médiation', context: 'Compétence sociale' },
                    { it: 'è schietto senza essere brusco', fr: 'il est franc sans être brusque', context: 'Nuance' },
                    { it: 'porta con sé un\'aria serena', fr: 'il dégage une atmosphère sereine', context: 'Impression' },
                    { it: 'ha reazioni misurate', fr: 'il a des réactions mesurées', context: 'Comportement' },
                    { it: 'è esigente con se stesso', fr: 'il est exigeant avec lui-même', context: 'Caractère' },
                    { it: 'tende a rimandare', fr: 'il a tendance à procrastiner', context: 'Habitude' }
                ]
            },
            {
                id: 'lvl6-dom-objects',
                title: 'Objet, art, sensation',
                pairs: [
                    { it: 'trama avvincente', fr: 'intrigue captivante', context: 'Livre/film' },
                    { it: 'colore pastello', fr: 'couleur pastel', context: 'Couleur' },
                    { it: 'texture ruvida', fr: 'texture rugueuse', context: 'Toucher' },
                    { it: 'linee essenziali', fr: 'lignes épurées', context: 'Design' },
                    { it: 'suono ovattato', fr: 'son feutré', context: 'Audio' },
                    { it: 'odore pungente', fr: 'odeur piquante', context: 'Odeur' },
                    { it: 'gusto deciso', fr: 'goût prononcé', context: 'Goût' },
                    { it: 'un ritmo incalzante', fr: 'un rythme soutenu', context: 'Narration' },
                    { it: 'un finale aperto', fr: 'une fin ouverte', context: 'Analyse' },
                    { it: 'sfumature di significato', fr: 'nuances de sens', context: 'Langage' }
                ]
            },
            {
                id: 'lvl6-dom-opinion',
                title: 'Exprimer et nuancer une opinion',
                pairs: [
                    { it: 'a mio avviso', fr: 'à mon avis', context: 'Opinion' },
                    { it: 'personalmente trovo che', fr: 'personnellement je trouve que', context: 'Opinion' },
                    { it: 'non necessariamente', fr: 'pas nécessairement', context: 'Restriction' },
                    { it: 'dipende dal contesto', fr: 'ça dépend du contexte', context: 'Condition' },
                    { it: 'per quanto mi riguarda', fr: 'en ce qui me concerne', context: 'Opinion' },
                    { it: 'fino a un certo punto', fr: 'jusqu’à un certain point', context: 'Nuance' },
                    { it: 'in linea di massima', fr: 'dans l’ensemble', context: 'Nuance' },
                    { it: 'con le dovute eccezioni', fr: 'avec les exceptions nécessaires', context: 'Restriction' },
                    { it: 'non è così semplice', fr: 'ce n’est pas si simple', context: 'Mise en garde' },
                    { it: 'vale la pena considerare', fr: 'il vaut la peine de considérer', context: 'Suggestion' }
                ]
            }
        ],
        lexical: [
            {
                id: 'lvl6-lex-adjectives',
                title: 'Adjectifs précis et intensité',
                pairs: [
                    { it: 'nitido', fr: 'net (image)', context: 'Visuel' },
                    { it: 'soffuso', fr: 'diffus', context: 'Lumière' },
                    { it: 'acre', fr: 'âcre', context: 'Odeur' },
                    { it: 'delicato', fr: 'délicat', context: 'Goût/odeur' },
                    { it: 'untuoso', fr: 'gras/huileux', context: 'Texture' },
                    { it: 'croccante', fr: 'croquant', context: 'Texture' },
                    { it: 'abbastanza', fr: 'assez', context: 'Intensité' },
                    { it: 'piuttosto', fr: 'plutôt', context: 'Intensité' },
                    { it: 'parecchio', fr: 'pas mal', context: 'Intensité' },
                    { it: 'estremamente', fr: 'extrêmement', context: 'Intensité' }
                ]
            },
            {
                id: 'lvl6-lex-concessive',
                title: 'Connecteurs de nuance et concession',
                pairs: [
                    { it: 'anche se', fr: 'même si', context: 'Concession' },
                    { it: 'nonostante', fr: 'malgré', context: 'Concession' },
                    { it: 'sebbene', fr: 'bien que', context: 'Subjonctif' },
                    { it: 'pure', fr: 'quand même', context: 'Concession' },
                    { it: 'a patto che', fr: 'à condition que', context: 'Condition' },
                    { it: 'purché', fr: 'pourvu que', context: 'Condition' },
                    { it: 'salvo che', fr: 'sauf si', context: 'Restriction' },
                    { it: 'tranne che', fr: 'excepté que', context: 'Restriction' },
                    { it: 'al contrario', fr: 'au contraire', context: 'Opposition' },
                    { it: 'invece', fr: 'en revanche', context: 'Opposition' }
                ]
            },
            {
                id: 'lvl6-lex-register',
                title: 'Registre et reformulation',
                pairs: [
                    { it: 'formalmente', fr: 'formellement', context: 'Registre' },
                    { it: 'in modo informale', fr: 'de manière informelle', context: 'Registre' },
                    { it: 'per dirla in breve', fr: 'pour le dire brièvement', context: 'Synthèse' },
                    { it: 'in altre parole', fr: 'en d’autres termes', context: 'Reformulation' },
                    { it: 'cioè', fr: 'c’est-à-dire', context: 'Reformulation' },
                    { it: 'vale a dire', fr: 'à savoir', context: 'Précision' },
                    { it: 'più o meno', fr: 'plus ou moins', context: 'Approximation' },
                    { it: 'a grandi linee', fr: 'à grands traits', context: 'Approximation' },
                    { it: 'in sostanza', fr: 'en substance', context: 'Synthèse' },
                    { it: 'in pratica', fr: 'en pratique', context: 'Clarification' }
                ]
            },
            {
                id: 'lvl6-lex-analogy',
                title: 'Comparaisons et analogies',
                pairs: [
                    { it: 'come se', fr: 'comme si', context: 'Comparaison' },
                    { it: 'assomiglia a', fr: 'ressemble à', context: 'Comparaison' },
                    { it: 'ricorda', fr: 'rappelle', context: 'Comparaison' },
                    { it: 'paragonabile a', fr: 'comparable à', context: 'Comparaison' },
                    { it: 'più che altro', fr: 'plutôt', context: 'Nuance' },
                    { it: 'quasi', fr: 'presque', context: 'Approximation' },
                    { it: 'come dire', fr: 'comment dire', context: 'Recherche' },
                    { it: 'fa pensare a', fr: 'ça fait penser à', context: 'Référence' },
                    { it: 'somiglia vagamente', fr: 'ça ressemble vaguement', context: 'Approximation' },
                    { it: 'è l\'equivalente di', fr: 'c’est l’équivalent de', context: 'Comparaison' }
                ]
            },
            {
                id: 'lvl6-lex-structures',
                title: 'Structures descriptives',
                pairs: [
                    { it: 'si compone di', fr: 'se compose de', context: 'Composition' },
                    { it: 'è caratterizzato da', fr: 'est caractérisé par', context: 'Description' },
                    { it: 'si distingue per', fr: 'se distingue par', context: 'Spécificité' },
                    { it: 'consiste in', fr: 'consiste en', context: 'Définition' },
                    { it: 'si basa su', fr: 'se base sur', context: 'Fondement' },
                    { it: 'è collegato a', fr: 'est lié à', context: 'Relation' },
                    { it: 'deriva da', fr: 'provient de', context: 'Origine' },
                    { it: 'porta a', fr: 'conduit à', context: 'Conséquence' },
                    { it: 'si manifesta con', fr: 'se manifeste par', context: 'Manifestation' },
                    { it: 'si inserisce in', fr: 's’inscrit dans', context: 'Contexte' }
                ]
            }
        ],
        verbs: [
            {
                id: 'lvl6-verb-conditionnel',
                title: 'Conditionnel pour nuancer',
                pairs: [
                    { it: 'sarebbe meglio', fr: 'ce serait mieux', context: 'Suggestion' },
                    { it: 'potrei considerare', fr: 'je pourrais envisager', context: 'Hypothèse' },
                    { it: 'dovresti forse', fr: 'tu devrais peut-être', context: 'Conseil nuancé' },
                    { it: 'preferirei', fr: 'je préférerais', context: 'Préférence' },
                    { it: 'mi piacerebbe', fr: 'ça me plairait', context: 'Souhait' },
                    { it: 'non sarebbe male', fr: 'ce ne serait pas mal', context: 'Atténuation' },
                    { it: 'sarebbe opportuno', fr: 'il serait opportun', context: 'Recommandation' },
                    { it: 'potrebbe darsi', fr: 'il se pourrait', context: 'Probabilité' },
                    { it: 'servirebbe', fr: 'il faudrait', context: 'Nécessité' },
                    { it: 'sarebbe da valutare', fr: 'ce serait à évaluer', context: 'Prudence' }
                ]
            },
            {
                id: 'lvl6-verb-sembrare',
                title: 'Verbes d\'apparence et d\'opinion',
                pairs: [
                    { it: 'sembra', fr: 'il semble', context: 'Apparence' },
                    { it: 'pare', fr: 'il paraît', context: 'Apparence' },
                    { it: 'risulta', fr: 'il ressort', context: 'Constat' },
                    { it: 'mi pare che', fr: 'il me semble que', context: 'Opinion' },
                    { it: 'mi sembra di', fr: 'il me semble', context: 'Opinion' },
                    { it: 'a quanto pare', fr: 'apparemment', context: 'Ouï-dire' },
                    { it: 'si dice che', fr: 'on dit que', context: 'Ouï-dire' },
                    { it: 'ritengo che', fr: 'je considère que', context: 'Opinion' },
                    { it: 'suppongo che', fr: 'je suppose que', context: 'Hypothèse' },
                    { it: 'immagino che', fr: 'j’imagine que', context: 'Hypothèse' }
                ]
            },
            {
                id: 'lvl6-verb-congiuntivo',
                title: 'Subjonctif présent (bases)',
                pairs: [
                    { it: 'penso che sia', fr: 'je pense qu’il soit', context: 'Opinion incertaine' },
                    { it: 'credo che abbia', fr: 'je crois qu’il ait', context: 'Opinion incertaine' },
                    { it: 'sebbene sia tardi', fr: 'bien qu’il soit tard', context: 'Concession' },
                    { it: 'prima che parta', fr: 'avant qu’il parte', context: 'Antériorité' },
                    { it: 'benché faccia freddo', fr: 'bien qu’il fasse froid', context: 'Concession' },
                    { it: 'temo che succeda', fr: 'je crains que ça arrive', context: 'Crainte' },
                    { it: 'voglio che tu venga', fr: 'je veux que tu viennes', context: 'Volonté' },
                    { it: 'affinché capiscano', fr: 'afin qu’ils comprennent', context: 'But' },
                    { it: 'qualunque cosa dicano', fr: 'quoi qu’ils disent', context: 'Indéfini' },
                    { it: 'nonostante tu sia stanco', fr: 'malgré que tu sois fatigué', context: 'Concession' }
                ]
            }
        ]
    }
};
