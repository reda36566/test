import {
  Role,
  Utilisateur,
  Departement,
  Filiere,
  Niveau,
  AnneeAcademique,
  Module,
  Entreprise,
  Etudiant,
  Encadrant,
  Rapport,
  VersionRapport,
  Commentaire,
  Note,
  Plagiat,
  Notification,
  HistoriqueAction,
  StatutConfig,
  TypeRapportConfig,
  RoleType,
  StatutRapport,
} from '@/types';

// ============================================
// ROLES
// ============================================
export const roles: Role[] = [
  { id: 'role-1', code: 'ADMIN', libelle: 'Administrateur', description: 'Accès complet au système' },
  { id: 'role-2', code: 'ETUDIANT', libelle: 'Étudiant', description: 'Gestion de ses propres rapports' },
  { id: 'role-3', code: 'ENCADRANT', libelle: 'Encadrant', description: 'Supervision et évaluation des rapports' },
];

// ============================================
// DEPARTEMENTS
// ============================================
export const departements: Departement[] = [
  { id: 'dep-1', code: 'INFO', nom: 'Informatique', description: 'Département Génie Informatique', actif: true },
  { id: 'dep-2', code: 'ELEC', nom: 'Électronique', description: 'Département Génie Électronique', actif: true },
  { id: 'dep-3', code: 'MECA', nom: 'Mécanique', description: 'Département Génie Mécanique', actif: true },
  { id: 'dep-4', code: 'CIVIL', nom: 'Génie Civil', description: 'Département Génie Civil', actif: true },
  { id: 'dep-5', code: 'INDUS', nom: 'Génie Industriel', description: 'Département Génie Industriel', actif: false },
];

// ============================================
// FILIERES
// ============================================
export const filieres: Filiere[] = [
  { id: 'fil-1', code: 'GL', nom: 'Génie Logiciel', departement_id: 'dep-1', description: 'Développement logiciel et architecture', actif: true },
  { id: 'fil-2', code: 'SI', nom: 'Systèmes d\'Information', departement_id: 'dep-1', description: 'Conception et gestion des SI', actif: true },
  { id: 'fil-3', code: 'RSI', nom: 'Réseaux et Systèmes Informatiques', departement_id: 'dep-1', description: 'Administration réseau et sécurité', actif: true },
  { id: 'fil-4', code: 'SE', nom: 'Systèmes Embarqués', departement_id: 'dep-2', description: 'Conception de systèmes embarqués', actif: true },
  { id: 'fil-5', code: 'AUTO', nom: 'Automatique', departement_id: 'dep-2', description: 'Automatisation et contrôle', actif: true },
  { id: 'fil-6', code: 'CM', nom: 'Conception Mécanique', departement_id: 'dep-3', description: 'CAO et conception mécanique', actif: true },
];

// ============================================
// NIVEAUX
// ============================================
export const niveaux: Niveau[] = [
  { id: 'niv-1', code: '1A', nom: 'Première Année', ordre: 1, actif: true },
  { id: 'niv-2', code: '2A', nom: 'Deuxième Année', ordre: 2, actif: true },
  { id: 'niv-3', code: '3A', nom: 'Troisième Année', ordre: 3, actif: true },
  { id: 'niv-4', code: '4A', nom: 'Quatrième Année', ordre: 4, actif: true },
  { id: 'niv-5', code: '5A', nom: 'Cinquième Année', ordre: 5, actif: true },
];

// ============================================
// ANNEES ACADEMIQUES
// ============================================
export const anneesAcademiques: AnneeAcademique[] = [
  { id: 'annee-1', libelle: '2021-2022', date_debut: '2021-09-01', date_fin: '2022-07-31', actuelle: false },
  { id: 'annee-2', libelle: '2022-2023', date_debut: '2022-09-01', date_fin: '2023-07-31', actuelle: false },
  { id: 'annee-3', libelle: '2023-2024', date_debut: '2023-09-01', date_fin: '2024-07-31', actuelle: false },
  { id: 'annee-4', libelle: '2024-2025', date_debut: '2024-09-01', date_fin: '2025-07-31', actuelle: true },
];

// ============================================
// MODULES
// ============================================
export const modules: Module[] = [
  { id: 'mod-1', code: 'DEV-WEB', nom: 'Développement Web', filiere_id: 'fil-1', niveau_id: 'niv-3', semestre: 1, credits: 4, actif: true },
  { id: 'mod-2', code: 'BDD', nom: 'Bases de Données', filiere_id: 'fil-1', niveau_id: 'niv-2', semestre: 2, credits: 3, actif: true },
  { id: 'mod-3', code: 'POO', nom: 'Programmation Orientée Objet', filiere_id: 'fil-1', niveau_id: 'niv-2', semestre: 1, credits: 4, actif: true },
  { id: 'mod-4', code: 'ALGO', nom: 'Algorithmique Avancée', filiere_id: 'fil-1', niveau_id: 'niv-3', semestre: 1, credits: 3, actif: true },
  { id: 'mod-5', code: 'SECU', nom: 'Sécurité Informatique', filiere_id: 'fil-3', niveau_id: 'niv-4', semestre: 1, credits: 3, actif: true },
];

// ============================================
// ENTREPRISES
// ============================================
export const entreprises: Entreprise[] = [
  { id: 'ent-1', nom: 'OCP Group', secteur: 'Industrie', ville: 'Casablanca', telephone: '0522123456', email: 'contact@ocpgroup.ma', site_web: 'https://www.ocpgroup.ma', actif: true },
  { id: 'ent-2', nom: 'Maroc Telecom', secteur: 'Télécommunications', ville: 'Rabat', telephone: '0537123456', email: 'contact@iam.ma', site_web: 'https://www.iam.ma', actif: true },
  { id: 'ent-3', nom: 'CGI Maroc', secteur: 'IT Services', ville: 'Casablanca', telephone: '0522789012', email: 'info@cgi.com', site_web: 'https://www.cgi.com', actif: true },
  { id: 'ent-4', nom: 'Capgemini Maroc', secteur: 'IT Consulting', ville: 'Casablanca', telephone: '0522345678', email: 'morocco@capgemini.com', site_web: 'https://www.capgemini.com', actif: true },
  { id: 'ent-5', nom: 'ONEE', secteur: 'Énergie', ville: 'Casablanca', telephone: '0522567890', email: 'contact@onee.ma', site_web: 'https://www.onee.ma', actif: true },
  { id: 'ent-6', nom: 'Bank of Africa', secteur: 'Finance', ville: 'Casablanca', telephone: '0522111222', email: 'contact@bankofafrica.ma', site_web: 'https://www.bankofafrica.ma', actif: true },
];

// ============================================
// UTILISATEURS
// ============================================
export const utilisateurs: Utilisateur[] = [
  // Admin
  { id: 'user-1', email: 'admin@ensa.ma', nom: 'Alami', prenom: 'Mohammed', role_id: 'role-1', role: 'ADMIN', telephone: '0612345678', actif: true, date_creation: '2020-01-01', derniere_connexion: '2024-01-15T10:30:00Z' },
  
  // Encadrants
  { id: 'user-2', email: 'prof.benali@ensa.ma', nom: 'Benali', prenom: 'Fatima', role_id: 'role-3', role: 'ENCADRANT', telephone: '0623456789', actif: true, date_creation: '2020-03-15', derniere_connexion: '2024-01-14T14:20:00Z' },
  { id: 'user-3', email: 'prof.hamidi@ensa.ma', nom: 'Hamidi', prenom: 'Youssef', role_id: 'role-3', role: 'ENCADRANT', telephone: '0634567890', actif: true, date_creation: '2020-06-20', derniere_connexion: '2024-01-13T09:15:00Z' },
  { id: 'user-4', email: 'prof.tazi@ensa.ma', nom: 'Tazi', prenom: 'Aicha', role_id: 'role-3', role: 'ENCADRANT', telephone: '0645678901', actif: true, date_creation: '2021-01-10', derniere_connexion: '2024-01-15T08:00:00Z' },
  { id: 'user-5', email: 'prof.fassi@ensa.ma', nom: 'El Fassi', prenom: 'Omar', role_id: 'role-3', role: 'ENCADRANT', telephone: '0656789012', actif: false, date_creation: '2019-09-01' },
  
  // Etudiants
  { id: 'user-6', email: 'etudiant1@ensa.ma', nom: 'Bouazza', prenom: 'Sara', role_id: 'role-2', role: 'ETUDIANT', telephone: '0667890123', actif: true, date_creation: '2022-09-01', derniere_connexion: '2024-01-15T11:45:00Z' },
  { id: 'user-7', email: 'etudiant2@ensa.ma', nom: 'Idrissi', prenom: 'Karim', role_id: 'role-2', role: 'ETUDIANT', telephone: '0678901234', actif: true, date_creation: '2022-09-01', derniere_connexion: '2024-01-14T16:30:00Z' },
  { id: 'user-8', email: 'etudiant3@ensa.ma', nom: 'Chakir', prenom: 'Leila', role_id: 'role-2', role: 'ETUDIANT', telephone: '0689012345', actif: true, date_creation: '2023-09-01', derniere_connexion: '2024-01-15T09:00:00Z' },
  { id: 'user-9', email: 'etudiant4@ensa.ma', nom: 'Ouazzani', prenom: 'Ahmed', role_id: 'role-2', role: 'ETUDIANT', telephone: '0690123456', actif: true, date_creation: '2023-09-01', derniere_connexion: '2024-01-12T13:20:00Z' },
  { id: 'user-10', email: 'etudiant5@ensa.ma', nom: 'Bennani', prenom: 'Zineb', role_id: 'role-2', role: 'ETUDIANT', telephone: '0601234567', actif: true, date_creation: '2021-09-01', derniere_connexion: '2024-01-15T07:30:00Z' },
];

// ============================================
// ENCADRANTS (detailed)
// ============================================
export const encadrants: Encadrant[] = [
  { id: 'enc-1', utilisateur_id: 'user-2', departement_id: 'dep-1', specialite: 'Intelligence Artificielle', grade: 'Professeur', bureau: 'B-201', max_etudiants: 8, etudiants_actuels: 3 },
  { id: 'enc-2', utilisateur_id: 'user-3', departement_id: 'dep-1', specialite: 'Génie Logiciel', grade: 'Professeur Assistant', bureau: 'B-205', max_etudiants: 6, etudiants_actuels: 4 },
  { id: 'enc-3', utilisateur_id: 'user-4', departement_id: 'dep-2', specialite: 'Systèmes Embarqués', grade: 'Professeur', bureau: 'C-102', max_etudiants: 5, etudiants_actuels: 2 },
  { id: 'enc-4', utilisateur_id: 'user-5', departement_id: 'dep-1', specialite: 'Sécurité Informatique', grade: 'Professeur Habilité', bureau: 'B-210', max_etudiants: 4, etudiants_actuels: 0 },
];

// ============================================
// ETUDIANTS (detailed)
// ============================================
export const etudiants: Etudiant[] = [
  { id: 'etu-1', utilisateur_id: 'user-6', cne: 'R130123456', cin: 'BJ123456', filiere_id: 'fil-1', niveau_id: 'niv-5', annee_academique_id: 'annee-4', date_naissance: '2000-05-15', adresse: 'Casablanca' },
  { id: 'etu-2', utilisateur_id: 'user-7', cne: 'R130234567', cin: 'BK234567', filiere_id: 'fil-1', niveau_id: 'niv-5', annee_academique_id: 'annee-4', date_naissance: '2000-08-22', adresse: 'Rabat' },
  { id: 'etu-3', utilisateur_id: 'user-8', cne: 'R130345678', cin: 'BL345678', filiere_id: 'fil-2', niveau_id: 'niv-4', annee_academique_id: 'annee-4', date_naissance: '2001-02-10', adresse: 'Fès' },
  { id: 'etu-4', utilisateur_id: 'user-9', cne: 'R130456789', cin: 'BM456789', filiere_id: 'fil-3', niveau_id: 'niv-4', annee_academique_id: 'annee-4', date_naissance: '2001-11-30', adresse: 'Marrakech' },
  { id: 'etu-5', utilisateur_id: 'user-10', cne: 'R130567890', cin: 'BN567890', filiere_id: 'fil-1', niveau_id: 'niv-5', annee_academique_id: 'annee-4', date_naissance: '1999-07-18', adresse: 'Tanger' },
];

// ============================================
// RAPPORTS
// ============================================
export const rapports: Rapport[] = [
  {
    id: 'rap-1',
    titre: 'Développement d\'une application web de gestion des stocks',
    type_rapport: 'PFE',
    statut: 'Validated',
    etudiant_id: 'etu-1',
    encadrant_id: 'enc-1',
    annee_academique_id: 'annee-4',
    entreprise_id: 'ent-3',
    date_debut: '2024-02-01',
    date_fin: '2024-06-30',
    description: 'Conception et développement d\'une application web moderne pour la gestion des stocks en utilisant React et Node.js',
    mots_cles: ['React', 'Node.js', 'Gestion des stocks', 'Web'],
    date_creation: '2024-01-15T10:00:00Z',
    date_modification: '2024-06-28T15:30:00Z',
    date_soumission: '2024-06-25T09:00:00Z',
    version_courante: 3,
  },
  {
    id: 'rap-2',
    titre: 'Système de recommandation basé sur le Machine Learning',
    type_rapport: 'PFE',
    statut: 'UnderReview',
    etudiant_id: 'etu-2',
    encadrant_id: 'enc-1',
    annee_academique_id: 'annee-4',
    entreprise_id: 'ent-4',
    date_debut: '2024-02-15',
    date_fin: '2024-07-15',
    description: 'Développement d\'un système de recommandation pour le e-commerce utilisant des algorithmes de machine learning',
    mots_cles: ['Machine Learning', 'Python', 'Recommandation', 'E-commerce'],
    date_creation: '2024-02-10T14:00:00Z',
    date_modification: '2024-07-10T11:00:00Z',
    date_soumission: '2024-07-08T10:00:00Z',
    version_courante: 2,
  },
  {
    id: 'rap-3',
    titre: 'Application mobile de suivi de santé',
    type_rapport: 'Stage',
    statut: 'CorrectionsRequested',
    etudiant_id: 'etu-3',
    encadrant_id: 'enc-2',
    annee_academique_id: 'annee-4',
    entreprise_id: 'ent-2',
    date_debut: '2024-06-01',
    date_fin: '2024-08-31',
    description: 'Développement d\'une application mobile pour le suivi des indicateurs de santé',
    mots_cles: ['Mobile', 'Flutter', 'Santé', 'IoT'],
    date_creation: '2024-05-20T09:00:00Z',
    date_modification: '2024-08-28T16:00:00Z',
    date_soumission: '2024-08-25T14:00:00Z',
    version_courante: 1,
  },
  {
    id: 'rap-4',
    titre: 'Plateforme IoT pour l\'agriculture intelligente',
    type_rapport: 'Projet',
    statut: 'Submitted',
    etudiant_id: 'etu-4',
    encadrant_id: 'enc-3',
    annee_academique_id: 'annee-4',
    date_debut: '2024-09-01',
    date_fin: '2024-12-31',
    description: 'Conception d\'une plateforme IoT pour la surveillance et l\'automatisation agricole',
    mots_cles: ['IoT', 'Agriculture', 'Capteurs', 'Automatisation'],
    date_creation: '2024-08-25T08:00:00Z',
    date_modification: '2024-12-20T10:00:00Z',
    date_soumission: '2024-12-18T11:00:00Z',
    version_courante: 1,
  },
  {
    id: 'rap-5',
    titre: 'Analyse prédictive pour la maintenance industrielle',
    type_rapport: 'PFE',
    statut: 'Draft',
    etudiant_id: 'etu-5',
    encadrant_id: 'enc-2',
    annee_academique_id: 'annee-4',
    entreprise_id: 'ent-1',
    date_debut: '2024-02-01',
    date_fin: '2024-07-31',
    description: 'Développement d\'un système d\'analyse prédictive pour anticiper les pannes machines',
    mots_cles: ['Data Science', 'Maintenance', 'Prédiction', 'Industrie'],
    date_creation: '2024-01-20T10:00:00Z',
    date_modification: '2024-03-15T14:00:00Z',
    version_courante: 1,
  },
  {
    id: 'rap-6',
    titre: 'Optimisation des réseaux de distribution avec algorithmes génétiques',
    type_rapport: 'PFE',
    statut: 'Refused',
    etudiant_id: 'etu-1',
    encadrant_id: 'enc-1',
    annee_academique_id: 'annee-3',
    entreprise_id: 'ent-5',
    date_debut: '2023-02-01',
    date_fin: '2023-06-30',
    description: 'Utilisation d\'algorithmes génétiques pour optimiser les réseaux de distribution électrique',
    mots_cles: ['Algorithmes Génétiques', 'Optimisation', 'Réseaux'],
    date_creation: '2023-01-10T09:00:00Z',
    date_modification: '2023-06-15T11:00:00Z',
    date_soumission: '2023-06-10T10:00:00Z',
    version_courante: 2,
  },
  {
    id: 'rap-7',
    titre: 'Chatbot intelligent pour le service client',
    type_rapport: 'Stage',
    statut: 'Archived',
    etudiant_id: 'etu-2',
    encadrant_id: 'enc-2',
    annee_academique_id: 'annee-3',
    entreprise_id: 'ent-6',
    date_debut: '2023-07-01',
    date_fin: '2023-09-30',
    description: 'Développement d\'un chatbot basé sur le NLP pour améliorer le service client',
    mots_cles: ['NLP', 'Chatbot', 'Service Client', 'IA'],
    date_creation: '2023-06-15T08:00:00Z',
    date_modification: '2023-10-05T16:00:00Z',
    date_soumission: '2023-09-28T09:00:00Z',
    version_courante: 3,
  },
];

// ============================================
// VERSIONS RAPPORTS
// ============================================
export const versionsRapport: VersionRapport[] = [
  { id: 'ver-1', rapport_id: 'rap-1', numero_version: 1, fichier_nom: 'rapport_v1.pdf', fichier_taille: 2456000, fichier_url: '/uploads/rap-1/v1.pdf', commentaire_version: 'Version initiale', date_upload: '2024-03-15T10:00:00Z', uploaded_by: 'user-6' },
  { id: 'ver-2', rapport_id: 'rap-1', numero_version: 2, fichier_nom: 'rapport_v2.pdf', fichier_taille: 3120000, fichier_url: '/uploads/rap-1/v2.pdf', commentaire_version: 'Corrections suite aux commentaires', date_upload: '2024-05-20T14:00:00Z', uploaded_by: 'user-6' },
  { id: 'ver-3', rapport_id: 'rap-1', numero_version: 3, fichier_nom: 'rapport_final.pdf', fichier_taille: 3540000, fichier_url: '/uploads/rap-1/v3.pdf', commentaire_version: 'Version finale validée', date_upload: '2024-06-25T09:00:00Z', uploaded_by: 'user-6' },
  { id: 'ver-4', rapport_id: 'rap-2', numero_version: 1, fichier_nom: 'ml_recommandation_v1.pdf', fichier_taille: 4200000, fichier_url: '/uploads/rap-2/v1.pdf', commentaire_version: 'Première soumission', date_upload: '2024-06-30T11:00:00Z', uploaded_by: 'user-7' },
  { id: 'ver-5', rapport_id: 'rap-2', numero_version: 2, fichier_nom: 'ml_recommandation_v2.pdf', fichier_taille: 4650000, fichier_url: '/uploads/rap-2/v2.pdf', commentaire_version: 'Ajout des résultats expérimentaux', date_upload: '2024-07-08T10:00:00Z', uploaded_by: 'user-7' },
  { id: 'ver-6', rapport_id: 'rap-3', numero_version: 1, fichier_nom: 'app_sante_v1.pdf', fichier_taille: 1890000, fichier_url: '/uploads/rap-3/v1.pdf', commentaire_version: 'Version initiale', date_upload: '2024-08-25T14:00:00Z', uploaded_by: 'user-8' },
  { id: 'ver-7', rapport_id: 'rap-4', numero_version: 1, fichier_nom: 'iot_agriculture_v1.pdf', fichier_taille: 2750000, fichier_url: '/uploads/rap-4/v1.pdf', commentaire_version: 'Soumission initiale', date_upload: '2024-12-18T11:00:00Z', uploaded_by: 'user-9' },
  { id: 'ver-8', rapport_id: 'rap-5', numero_version: 1, fichier_nom: 'maintenance_pred_draft.pdf', fichier_taille: 980000, fichier_url: '/uploads/rap-5/v1.pdf', commentaire_version: 'Brouillon en cours', date_upload: '2024-03-10T16:00:00Z', uploaded_by: 'user-10' },
];

// ============================================
// COMMENTAIRES
// ============================================
export const commentaires: Commentaire[] = [
  { id: 'com-1', rapport_id: 'rap-1', version_id: 'ver-1', auteur_id: 'user-2', contenu: 'Bonne structure générale. Veuillez approfondir la partie méthodologie.', visible_etudiant: true, page_reference: 15, date_creation: '2024-03-20T09:00:00Z' },
  { id: 'com-2', rapport_id: 'rap-1', version_id: 'ver-1', auteur_id: 'user-2', contenu: 'Les références bibliographiques sont incomplètes.', visible_etudiant: true, page_reference: 45, date_creation: '2024-03-20T09:15:00Z' },
  { id: 'com-3', rapport_id: 'rap-1', version_id: 'ver-2', auteur_id: 'user-2', contenu: 'Excellent travail sur la correction. La méthodologie est maintenant claire.', visible_etudiant: true, date_creation: '2024-05-25T10:00:00Z' },
  { id: 'com-4', rapport_id: 'rap-2', version_id: 'ver-4', auteur_id: 'user-2', contenu: 'Approche intéressante. Manque de détails sur les hyperparamètres utilisés.', visible_etudiant: true, page_reference: 28, date_creation: '2024-07-02T14:00:00Z' },
  { id: 'com-5', rapport_id: 'rap-2', version_id: 'ver-5', auteur_id: 'user-2', contenu: 'Note interne: Vérifier la partie plagiat avant validation.', visible_etudiant: false, date_creation: '2024-07-10T16:00:00Z' },
  { id: 'com-6', rapport_id: 'rap-3', version_id: 'ver-6', auteur_id: 'user-3', contenu: 'L\'architecture technique nécessite des révisions importantes. Voir détails ci-joints.', visible_etudiant: true, page_reference: 22, date_creation: '2024-08-28T11:00:00Z' },
  { id: 'com-7', rapport_id: 'rap-3', version_id: 'ver-6', auteur_id: 'user-3', contenu: 'Corriger les diagrammes UML - incohérences détectées.', visible_etudiant: true, page_reference: 30, date_creation: '2024-08-28T11:30:00Z' },
];

// ============================================
// NOTES
// ============================================
export const notes: Note[] = [
  { id: 'note-1', rapport_id: 'rap-1', encadrant_id: 'enc-1', note_technique: 16, note_redaction: 15, note_presentation: 17, note_finale: 16, appreciation: 'Excellent travail. Méthodologie rigoureuse et résultats pertinents.', valide_final: true, date_evaluation: '2024-06-28T15:00:00Z' },
  { id: 'note-2', rapport_id: 'rap-7', encadrant_id: 'enc-2', note_technique: 14, note_redaction: 13, note_presentation: 14, note_finale: 13.67, appreciation: 'Bon travail dans l\'ensemble. La partie NLP pourrait être approfondie.', valide_final: true, date_evaluation: '2023-10-02T10:00:00Z' },
];

// ============================================
// PLAGIAT
// ============================================
export const plagiats: Plagiat[] = [
  {
    id: 'plag-1',
    rapport_id: 'rap-1',
    version_id: 'ver-3',
    taux_similarite: 8,
    sources_detectees: [
      { source: 'Documentation React Official', pourcentage: 5, url: 'https://react.dev' },
      { source: 'Stack Overflow', pourcentage: 3, url: 'https://stackoverflow.com' },
    ],
    statut: 'Clean',
    decision: 'Taux acceptable - Sources techniques légitimes',
    decideur_id: 'user-2',
    date_analyse: '2024-06-25T10:00:00Z',
    date_decision: '2024-06-26T09:00:00Z',
  },
  {
    id: 'plag-2',
    rapport_id: 'rap-2',
    version_id: 'ver-5',
    taux_similarite: 15,
    sources_detectees: [
      { source: 'Article IEEE - Collaborative Filtering', pourcentage: 8, url: 'https://ieeexplore.ieee.org' },
      { source: 'Scikit-learn Documentation', pourcentage: 4, url: 'https://scikit-learn.org' },
      { source: 'Medium Article', pourcentage: 3, url: 'https://medium.com' },
    ],
    statut: 'Pending',
    date_analyse: '2024-07-09T08:00:00Z',
  },
  {
    id: 'plag-3',
    rapport_id: 'rap-6',
    version_id: 'ver-2',
    taux_similarite: 42,
    sources_detectees: [
      { source: 'Thèse Université X', pourcentage: 25, url: 'https://theses.fr' },
      { source: 'Rapport PFE 2022', pourcentage: 12, url: '' },
      { source: 'Wikipedia', pourcentage: 5, url: 'https://wikipedia.org' },
    ],
    statut: 'Confirmed',
    decision: 'Plagiat confirmé - Rapport refusé',
    decideur_id: 'user-2',
    date_analyse: '2023-06-12T09:00:00Z',
    date_decision: '2023-06-14T14:00:00Z',
  },
];

// ============================================
// NOTIFICATIONS
// ============================================
export const notifications: Notification[] = [
  { id: 'notif-1', utilisateur_id: 'user-6', type: 'STATUS_CHANGE', titre: 'Rapport validé', message: 'Votre rapport "Développement d\'une application web de gestion des stocks" a été validé.', lien: '/student/report/rap-1', lue: true, date_creation: '2024-06-28T16:00:00Z' },
  { id: 'notif-2', utilisateur_id: 'user-6', type: 'GRADE_PUBLISHED', titre: 'Note publiée', message: 'La note de votre rapport a été publiée: 16/20', lien: '/student/report/rap-1/grade', lue: true, date_creation: '2024-06-28T17:00:00Z' },
  { id: 'notif-3', utilisateur_id: 'user-7', type: 'NEW_COMMENT', titre: 'Nouveau commentaire', message: 'Prof. Benali a commenté votre rapport.', lien: '/student/report/rap-2/comments', lue: false, date_creation: '2024-07-02T14:30:00Z' },
  { id: 'notif-4', utilisateur_id: 'user-8', type: 'STATUS_CHANGE', titre: 'Corrections demandées', message: 'Des corrections ont été demandées pour votre rapport.', lien: '/student/report/rap-3', lue: false, date_creation: '2024-08-28T12:00:00Z' },
  { id: 'notif-5', utilisateur_id: 'user-2', type: 'NEW_VERSION', titre: 'Nouvelle version', message: 'L\'étudiant Idrissi Karim a soumis une nouvelle version de son rapport.', lien: '/supervisor/report/rap-2', lue: false, date_creation: '2024-07-08T10:30:00Z' },
  { id: 'notif-6', utilisateur_id: 'user-2', type: 'PLAGIARISM_ALERT', titre: 'Alerte plagiat', message: 'Taux de similarité élevé détecté (15%) sur le rapport de Idrissi Karim.', lien: '/supervisor/report/rap-2/plagiarism', lue: false, date_creation: '2024-07-09T08:30:00Z' },
  { id: 'notif-7', utilisateur_id: 'user-1', type: 'SYSTEM', titre: 'Maintenance planifiée', message: 'Une maintenance système est prévue le 20/01/2024 de 02h à 04h.', lue: true, date_creation: '2024-01-15T09:00:00Z' },
];

// ============================================
// HISTORIQUE ACTIONS (Audit Log)
// ============================================
export const historiqueActions: HistoriqueAction[] = [
  { id: 'hist-1', utilisateur_id: 'user-6', action: 'CREATE', entite: 'RAPPORT', entite_id: 'rap-1', details: 'Création du rapport PFE', date_action: '2024-01-15T10:00:00Z' },
  { id: 'hist-2', utilisateur_id: 'user-6', action: 'UPLOAD', entite: 'VERSION_RAPPORT', entite_id: 'ver-1', details: 'Upload version 1', date_action: '2024-03-15T10:00:00Z' },
  { id: 'hist-3', utilisateur_id: 'user-2', action: 'COMMENT', entite: 'RAPPORT', entite_id: 'rap-1', details: 'Ajout de 2 commentaires', date_action: '2024-03-20T09:15:00Z' },
  { id: 'hist-4', utilisateur_id: 'user-6', action: 'UPLOAD', entite: 'VERSION_RAPPORT', entite_id: 'ver-2', details: 'Upload version 2', date_action: '2024-05-20T14:00:00Z' },
  { id: 'hist-5', utilisateur_id: 'user-6', action: 'SUBMIT', entite: 'RAPPORT', entite_id: 'rap-1', details: 'Soumission du rapport', date_action: '2024-06-25T09:00:00Z' },
  { id: 'hist-6', utilisateur_id: 'user-2', action: 'VALIDATE', entite: 'RAPPORT', entite_id: 'rap-1', details: 'Validation du rapport', date_action: '2024-06-28T15:00:00Z' },
  { id: 'hist-7', utilisateur_id: 'user-2', action: 'GRADE', entite: 'NOTE', entite_id: 'note-1', details: 'Attribution de la note finale: 16/20', date_action: '2024-06-28T15:30:00Z' },
  { id: 'hist-8', utilisateur_id: 'user-1', action: 'LOGIN', entite: 'SESSION', entite_id: 'session-123', details: 'Connexion administrateur', ip_address: '192.168.1.100', date_action: '2024-01-15T10:30:00Z' },
  { id: 'hist-9', utilisateur_id: 'user-7', action: 'CREATE', entite: 'RAPPORT', entite_id: 'rap-2', details: 'Création du rapport PFE ML', date_action: '2024-02-10T14:00:00Z' },
  { id: 'hist-10', utilisateur_id: 'user-2', action: 'REFUSE', entite: 'RAPPORT', entite_id: 'rap-6', details: 'Refus pour plagiat confirmé', date_action: '2023-06-15T10:00:00Z' },
];

// ============================================
// CONFIGURATION STATUTS
// ============================================
export const statutsConfig: StatutConfig[] = [
  { code: 'Draft', libelle: 'Brouillon', couleur: 'gray', description: 'Rapport en cours de rédaction', transitions_possibles: ['Submitted'] },
  { code: 'Submitted', libelle: 'Soumis', couleur: 'blue', description: 'Rapport soumis pour évaluation', transitions_possibles: ['UnderReview'] },
  { code: 'UnderReview', libelle: 'En cours d\'évaluation', couleur: 'yellow', description: 'Rapport en cours d\'évaluation par l\'encadrant', transitions_possibles: ['Validated', 'Refused', 'CorrectionsRequested'] },
  { code: 'CorrectionsRequested', libelle: 'Corrections demandées', couleur: 'orange', description: 'Des corrections sont nécessaires', transitions_possibles: ['Submitted'] },
  { code: 'Validated', libelle: 'Validé', couleur: 'green', description: 'Rapport validé', transitions_possibles: ['Archived'] },
  { code: 'Refused', libelle: 'Refusé', couleur: 'red', description: 'Rapport refusé', transitions_possibles: [] },
  { code: 'Archived', libelle: 'Archivé', couleur: 'slate', description: 'Rapport archivé', transitions_possibles: [] },
];

// ============================================
// CONFIGURATION TYPES RAPPORTS
// ============================================
export const typesRapportConfig: TypeRapportConfig[] = [
  { code: 'Stage', libelle: 'Rapport de Stage', description: 'Stage en entreprise de 2 à 3 mois', duree_min_jours: 60, duree_max_jours: 90, entreprise_requise: true },
  { code: 'Projet', libelle: 'Rapport de Projet', description: 'Projet académique semestriel', duree_min_jours: 30, duree_max_jours: 120, entreprise_requise: false },
  { code: 'PFE', libelle: 'Projet de Fin d\'Études', description: 'Projet de fin de cursus sur 5-6 mois', duree_min_jours: 150, duree_max_jours: 180, entreprise_requise: true },
];

// ============================================
// MOCK ACCOUNTS FOR LOGIN
// ============================================
export const mockAccounts: { id: string; label: string; role: RoleType; utilisateur_id: string }[] = [
  { id: 'account-admin', label: 'Admin - Mohammed Alami', role: 'ADMIN', utilisateur_id: 'user-1' },
  { id: 'account-encadrant-1', label: 'Encadrant - Prof. Fatima Benali', role: 'ENCADRANT', utilisateur_id: 'user-2' },
  { id: 'account-encadrant-2', label: 'Encadrant - Prof. Youssef Hamidi', role: 'ENCADRANT', utilisateur_id: 'user-3' },
  { id: 'account-etudiant-1', label: 'Étudiant - Sara Bouazza (5A GL)', role: 'ETUDIANT', utilisateur_id: 'user-6' },
  { id: 'account-etudiant-2', label: 'Étudiant - Karim Idrissi (5A GL)', role: 'ETUDIANT', utilisateur_id: 'user-7' },
  { id: 'account-etudiant-3', label: 'Étudiant - Leila Chakir (4A SI)', role: 'ETUDIANT', utilisateur_id: 'user-8' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getUserById(id: string): Utilisateur | undefined {
  return utilisateurs.find(u => u.id === id);
}

export function getEtudiantByUserId(userId: string): Etudiant | undefined {
  return etudiants.find(e => e.utilisateur_id === userId);
}

export function getEncadrantByUserId(userId: string): Encadrant | undefined {
  return encadrants.find(e => e.utilisateur_id === userId);
}

export function getEtudiantById(id: string): Etudiant | undefined {
  return etudiants.find(e => e.id === id);
}

export function getEncadrantById(id: string): Encadrant | undefined {
  return encadrants.find(e => e.id === id);
}

export function getFiliereById(id: string): Filiere | undefined {
  return filieres.find(f => f.id === id);
}

export function getDepartementById(id: string): Departement | undefined {
  return departements.find(d => d.id === id);
}

export function getNiveauById(id: string): Niveau | undefined {
  return niveaux.find(n => n.id === id);
}

export function getAnneeById(id: string): AnneeAcademique | undefined {
  return anneesAcademiques.find(a => a.id === id);
}

export function getEntrepriseById(id: string): Entreprise | undefined {
  return entreprises.find(e => e.id === id);
}

export function getRapportById(id: string): Rapport | undefined {
  return rapports.find(r => r.id === id);
}

export function getVersionsByRapportId(rapportId: string): VersionRapport[] {
  return versionsRapport.filter(v => v.rapport_id === rapportId).sort((a, b) => b.numero_version - a.numero_version);
}

export function getCommentairesByRapportId(rapportId: string): Commentaire[] {
  return commentaires.filter(c => c.rapport_id === rapportId).sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime());
}

export function getNoteByRapportId(rapportId: string): Note | undefined {
  return notes.find(n => n.rapport_id === rapportId);
}

export function getPlagiatByRapportId(rapportId: string): Plagiat | undefined {
  return plagiats.find(p => p.rapport_id === rapportId);
}

export function getNotificationsByUserId(userId: string): Notification[] {
  return notifications.filter(n => n.utilisateur_id === userId).sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime());
}

export function getHistoriqueByUserId(userId: string): HistoriqueAction[] {
  return historiqueActions.filter(h => h.utilisateur_id === userId).sort((a, b) => new Date(b.date_action).getTime() - new Date(a.date_action).getTime());
}

export function getStatutConfig(statut: StatutRapport): StatutConfig | undefined {
  return statutsConfig.find(s => s.code === statut);
}
