// ============================================
// ENSA Reports - TypeScript Interfaces
// ============================================

// Enum types
export type RoleType = 'ADMIN' | 'ETUDIANT' | 'ENCADRANT';

export type TypeRapport = 'Stage' | 'Projet' | 'PFE';

export type StatutRapport = 
  | 'Draft' 
  | 'Submitted' 
  | 'UnderReview' 
  | 'CorrectionsRequested' 
  | 'Validated' 
  | 'Refused' 
  | 'Archived';

export type NotificationType = 
  | 'NEW_VERSION' 
  | 'NEW_COMMENT' 
  | 'STATUS_CHANGE' 
  | 'GRADE_PUBLISHED' 
  | 'PLAGIARISM_ALERT'
  | 'SYSTEM';

export type ActionType = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'SUBMIT' 
  | 'VALIDATE' 
  | 'REFUSE' 
  | 'COMMENT' 
  | 'UPLOAD' 
  | 'GRADE'
  | 'LOGIN'
  | 'LOGOUT';

// Core entities
export interface Role {
  id: string;
  code: RoleType;
  libelle: string;
  description: string;
}

export interface Utilisateur {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role_id: string;
  role: RoleType;
  telephone?: string;
  avatar_url?: string;
  actif: boolean;
  date_creation: string;
  derniere_connexion?: string;
}

export interface Departement {
  id: string;
  code: string;
  nom: string;
  description?: string;
  chef_departement_id?: string;
  actif: boolean;
}

export interface Filiere {
  id: string;
  code: string;
  nom: string;
  departement_id: string;
  description?: string;
  actif: boolean;
}

export interface Niveau {
  id: string;
  code: string;
  nom: string;
  ordre: number;
  actif: boolean;
}

export interface AnneeAcademique {
  id: string;
  libelle: string;
  date_debut: string;
  date_fin: string;
  actuelle: boolean;
}

export interface Module {
  id: string;
  code: string;
  nom: string;
  filiere_id: string;
  niveau_id: string;
  semestre: number;
  credits: number;
  actif: boolean;
}

export interface Entreprise {
  id: string;
  nom: string;
  secteur?: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  actif: boolean;
}

export interface Etudiant {
  id: string;
  utilisateur_id: string;
  utilisateur?: Utilisateur;
  cne: string;
  cin?: string;
  filiere_id: string;
  filiere?: Filiere;
  niveau_id: string;
  niveau?: Niveau;
  annee_academique_id: string;
  annee_academique?: AnneeAcademique;
  date_naissance?: string;
  adresse?: string;
}

export interface Encadrant {
  id: string;
  utilisateur_id: string;
  utilisateur?: Utilisateur;
  departement_id: string;
  departement?: Departement;
  specialite?: string;
  grade?: string;
  bureau?: string;
  max_etudiants: number;
  etudiants_actuels: number;
}

export interface Rapport {
  id: string;
  titre: string;
  type_rapport: TypeRapport;
  statut: StatutRapport;
  etudiant_id: string;
  etudiant?: Etudiant;
  encadrant_id: string;
  encadrant?: Encadrant;
  annee_academique_id: string;
  annee_academique?: AnneeAcademique;
  entreprise_id?: string;
  entreprise?: Entreprise;
  date_debut?: string;
  date_fin?: string;
  description?: string;
  mots_cles?: string[];
  date_creation: string;
  date_modification: string;
  date_soumission?: string;
  version_courante: number;
}

export interface VersionRapport {
  id: string;
  rapport_id: string;
  numero_version: number;
  fichier_nom: string;
  fichier_taille: number;
  fichier_url: string;
  commentaire_version?: string;
  date_upload: string;
  uploaded_by: string;
}

export interface Commentaire {
  id: string;
  rapport_id: string;
  version_id?: string;
  auteur_id: string;
  auteur?: Utilisateur;
  contenu: string;
  visible_etudiant: boolean;
  page_reference?: number;
  date_creation: string;
  date_modification?: string;
}

export interface Note {
  id: string;
  rapport_id: string;
  encadrant_id: string;
  note_technique?: number;
  note_redaction?: number;
  note_presentation?: number;
  note_finale?: number;
  appreciation?: string;
  valide_final: boolean;
  date_evaluation: string;
}

export interface Plagiat {
  id: string;
  rapport_id: string;
  version_id: string;
  taux_similarite: number;
  sources_detectees: PlagiatSource[];
  statut: 'Pending' | 'Clean' | 'Suspicious' | 'Confirmed';
  decision?: string;
  decideur_id?: string;
  date_analyse: string;
  date_decision?: string;
}

export interface PlagiatSource {
  source: string;
  pourcentage: number;
  url?: string;
}

export interface Notification {
  id: string;
  utilisateur_id: string;
  type: NotificationType;
  titre: string;
  message: string;
  lien?: string;
  lue: boolean;
  date_creation: string;
}

export interface HistoriqueAction {
  id: string;
  utilisateur_id: string;
  utilisateur?: Utilisateur;
  action: ActionType;
  entite: string;
  entite_id: string;
  details?: string;
  ip_address?: string;
  date_action: string;
}

// Type for status configuration
export interface StatutConfig {
  code: StatutRapport;
  libelle: string;
  couleur: string;
  description: string;
  transitions_possibles: StatutRapport[];
}

// Type for report type configuration
export interface TypeRapportConfig {
  code: TypeRapport;
  libelle: string;
  description: string;
  duree_min_jours: number;
  duree_max_jours: number;
  entreprise_requise: boolean;
}

// Auth context type
export interface AuthUser {
  utilisateur: Utilisateur;
  role: RoleType;
  etudiant?: Etudiant;
  encadrant?: Encadrant;
}

// Pagination type
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Filter types
export interface RapportFilters {
  search?: string;
  type?: TypeRapport;
  statut?: StatutRapport;
  annee_academique_id?: string;
  encadrant_id?: string;
  etudiant_id?: string;
  filiere_id?: string;
  departement_id?: string;
}

export interface UtilisateurFilters {
  search?: string;
  role?: RoleType;
  actif?: boolean;
}

// Stats types
export interface DashboardStats {
  total_rapports: number;
  rapports_en_cours: number;
  rapports_valides: number;
  rapports_en_attente: number;
  taux_validation: number;
}

export interface AdminStats extends DashboardStats {
  total_etudiants: number;
  total_encadrants: number;
  rapports_par_type: { type: TypeRapport; count: number }[];
  rapports_par_statut: { statut: StatutRapport; count: number }[];
  rapports_par_mois: { mois: string; count: number }[];
}

export interface EncadrantStats extends DashboardStats {
  mes_etudiants: number;
  commentaires_total: number;
  notes_attribuees: number;
}

export interface EtudiantStats {
  mes_rapports: number;
  versions_total: number;
  commentaires_recus: number;
  note_moyenne?: number;
}
