-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 31, 2026 at 10:39 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gestion_pfe_ensa`
--

-- --------------------------------------------------------

--
-- Table structure for table `administrateurs`
--

CREATE TABLE `administrateurs` (
  `id_admin` int(11) NOT NULL,
  `id_user` int(11) DEFAULT NULL,
  `nom` varchar(50) DEFAULT NULL,
  `prenom` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `annees_academiques`
--

CREATE TABLE `annees_academiques` (
  `id_annee` int(11) NOT NULL,
  `libelle` varchar(20) DEFAULT NULL,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `actuelle` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `annees_academiques`
--

INSERT INTO `annees_academiques` (`id_annee`, `libelle`, `date_debut`, `date_fin`, `actuelle`) VALUES
(3, 'premiere anne', '2024-12-10', '2026-12-06', 1);

-- --------------------------------------------------------

--
-- Table structure for table `configurations`
--

CREATE TABLE `configurations` (
  `id_config` int(11) NOT NULL,
  `cle` varchar(100) DEFAULT NULL,
  `valeur` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `configurations`
--

INSERT INTO `configurations` (`id_config`, `cle`, `valeur`) VALUES
(1, 'MAX_PDF_SIZE', '10'),
(2, 'DEPOSIT_START', '2026-01-01'),
(3, 'plagiat_warning', '15'),
(4, 'plagiat_refusal', '30');

-- --------------------------------------------------------

--
-- Table structure for table `departements`
--

CREATE TABLE `departements` (
  `id_departement` int(11) NOT NULL,
  `code` varchar(10) DEFAULT NULL,
  `nom_departement` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departements`
--

INSERT INTO `departements` (`id_departement`, `code`, `nom_departement`, `description`, `actif`) VALUES
(4, 'GI', 'Genie Informatique', 'IA', 1);

-- --------------------------------------------------------

--
-- Table structure for table `encadrants`
--

CREATE TABLE `encadrants` (
  `id_encadrant` int(11) NOT NULL,
  `id_user` int(11) DEFAULT NULL,
  `nom` varchar(50) DEFAULT NULL,
  `prenom` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `encadrants`
--

INSERT INTO `encadrants` (`id_encadrant`, `id_user`, `nom`, `prenom`, `email`) VALUES
(4, 11, 'moha', 'moha', 'homa@gmail.com');

-- --------------------------------------------------------

--
-- Table structure for table `entreprises`
--

CREATE TABLE `entreprises` (
  `id_entreprise` int(11) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `secteur_activite` varchar(100) DEFAULT NULL,
  `adresse` text DEFAULT NULL,
  `email_contact` varchar(255) DEFAULT NULL,
  `site_web` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `entreprises`
--

INSERT INTO `entreprises` (`id_entreprise`, `nom`, `secteur_activite`, `adresse`, `email_contact`, `site_web`) VALUES
(1, 'OCP', 'Industrie Chimique', NULL, NULL, NULL),
(3, 'Maroc Telecom', 'Télécommunications', NULL, NULL, NULL),
(4, 'Capgemini', 'Services Numériques', NULL, NULL, NULL),
(5, 'Ciments du Maroc', 'Industrie', NULL, NULL, NULL),
(6, 'Marsa Maroc', 'Logistique', NULL, NULL, NULL),
(7, 'ONCF', 'Transport', NULL, NULL, NULL),
(8, 'Inwi', 'Télécommunications', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `etudiants`
--

CREATE TABLE `etudiants` (
  `id_etudiant` int(11) NOT NULL,
  `id_user` int(11) DEFAULT NULL,
  `nom` varchar(50) DEFAULT NULL,
  `prenom` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `etudiants`
--

INSERT INTO `etudiants` (`id_etudiant`, `id_user`, `nom`, `prenom`, `email`) VALUES
(6, 10, 'DAHIBI', 'GHALI', 'utama888m@gmail.com'),
(7, 12, 'messi', 'messi', 'messi@gmail.com'),
(8, 13, 'mima', 'mima', 'mouad@gmail.com');

-- --------------------------------------------------------

--
-- Table structure for table `filieres`
--

CREATE TABLE `filieres` (
  `id_filiere` int(11) NOT NULL,
  `code` varchar(10) DEFAULT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `id_departement` int(11) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `filieres`
--

INSERT INTO `filieres` (`id_filiere`, `code`, `nom`, `description`, `id_departement`, `actif`) VALUES
(3, 'SSR', 'Cyber securite', 'SSr', 4, 1);

-- --------------------------------------------------------

--
-- Table structure for table `historique_actions`
--

CREATE TABLE `historique_actions` (
  `id_action` int(11) NOT NULL,
  `id_user` int(11) DEFAULT NULL,
  `type_action` varchar(50) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `date_action` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `historique_actions`
--

INSERT INTO `historique_actions` (`id_action`, `id_user`, `type_action`, `details`, `date_action`) VALUES
(11, 11, 'EVALUATION', 'Note attribuée : 14/20 pour le rapport ID 41', '2026-01-31 14:26:40'),
(12, 11, 'EVALUATION', 'Demande Correction Rapport ID 40', '2026-01-31 14:26:48'),
(13, 11, 'EVALUATION', 'Demande Correction Rapport ID 40', '2026-01-31 14:37:18'),
(14, 11, 'EVALUATION', 'Demande Correction Rapport ID 42', '2026-01-31 14:38:54'),
(15, 11, 'EVALUATION', 'Demande Correction Rapport ID 42', '2026-01-31 14:48:21'),
(16, 11, 'EVALUATION', 'Demande Correction Rapport ID 42', '2026-01-31 14:49:23'),
(17, 11, 'EVALUATION', 'Validation Rapport ID 42', '2026-01-31 15:06:31'),
(18, 11, 'EVALUATION', 'Validation Rapport ID 42', '2026-01-31 15:06:45'),
(19, 11, 'EVALUATION', 'Note attribuée : 13/20 pour le rapport ID 43', '2026-01-31 15:08:48'),
(20, 11, 'EVALUATION', 'Note attribuée : 14/20 pour le rapport ID 42', '2026-01-31 15:15:44');

-- --------------------------------------------------------

--
-- Table structure for table `modules`
--

CREATE TABLE `modules` (
  `id_module` int(11) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `id_filiere` int(11) DEFAULT NULL,
  `id_niveau` int(11) DEFAULT NULL,
  `semestre` varchar(10) DEFAULT NULL,
  `credits` int(11) DEFAULT 0,
  `actif` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `niveaux`
--

CREATE TABLE `niveaux` (
  `id_niveau` int(11) NOT NULL,
  `code` varchar(10) DEFAULT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `ordre` int(11) DEFAULT 1,
  `actif` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `niveaux`
--

INSERT INTO `niveaux` (`id_niveau`, `code`, `nom`, `ordre`, `actif`) VALUES
(2, 'GI', 'premiere anne', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id_notification` int(11) NOT NULL,
  `id_user` int(11) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `titre` varchar(100) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `lien` varchar(255) DEFAULT NULL,
  `lue` tinyint(1) DEFAULT 0,
  `date_creation` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id_notification`, `id_user`, `type`, `titre`, `message`, `lien`, `lue`, `date_creation`) VALUES
(14, 10, 'GRADE_PUBLISHED', 'Note disponible', 'Votre rapport \"rapport2\" a été validé avec la note de 13/20.', '/student/report/43', 0, '2026-01-31 15:08:48'),
(15, 11, 'NEW_VERSION', 'Mise à jour', 'Nouvelle version (V2) pour : rapport', '/supervisor/report/42', 1, '2026-01-31 15:14:59'),
(16, 10, 'GRADE_PUBLISHED', 'Note disponible', 'Votre rapport \"rapport\" a été validé avec la note de 14/20.', '/student/report/42', 0, '2026-01-31 15:15:44');

-- --------------------------------------------------------

--
-- Table structure for table `plagiat_resultats`
--

CREATE TABLE `plagiat_resultats` (
  `id_resultat` int(11) NOT NULL,
  `id_rapport` int(11) DEFAULT NULL,
  `score_similitude` int(11) DEFAULT NULL,
  `statut` varchar(50) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `date_analyse` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `plagiat_resultats`
--

INSERT INTO `plagiat_resultats` (`id_resultat`, `id_rapport`, `score_similitude`, `statut`, `details`, `date_analyse`) VALUES
(1, 42, 0, 'Correct', 'Analyse réelle par contenu', '2026-01-31 14:38:30'),
(2, 43, 57, 'Critique', 'Analyse réelle par contenu', '2026-01-31 15:08:17'),
(3, 44, 21, 'Suspect', 'Analyse réelle par contenu', '2026-01-31 22:16:00');

-- --------------------------------------------------------

--
-- Table structure for table `rapports`
--

CREATE TABLE `rapports` (
  `id_rapport` int(11) NOT NULL,
  `titre` varchar(255) DEFAULT NULL,
  `id_type` int(11) DEFAULT NULL,
  `id_annee` int(11) DEFAULT NULL,
  `id_etudiant` int(11) DEFAULT NULL,
  `id_encadrant` int(11) DEFAULT NULL,
  `id_statut` int(11) DEFAULT NULL,
  `id_entreprise` int(11) DEFAULT NULL,
  `note` decimal(4,2) DEFAULT NULL,
  `commentaire_encadrant` text DEFAULT NULL,
  `date_depot` datetime DEFAULT NULL,
  `date_modification` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rapports`
--

INSERT INTO `rapports` (`id_rapport`, `titre`, `id_type`, `id_annee`, `id_etudiant`, `id_encadrant`, `id_statut`, `id_entreprise`, `note`, `commentaire_encadrant`, `date_depot`, `date_modification`) VALUES
(42, 'rapport', 1, 1, 6, 4, 3, 1, 14.00, 'bon', '2026-01-31 14:38:30', '2026-01-31 15:14:59'),
(43, 'rapport2', 3, 1, 6, 4, 3, 1, 13.00, 'bon', '2026-01-31 15:08:17', '2026-01-31 15:08:17'),
(44, 'rapport de stage', 3, 3, 6, 4, 1, 6, NULL, NULL, '2026-01-31 22:16:00', '2026-01-31 22:16:00');

-- --------------------------------------------------------

--
-- Table structure for table `statuts_rapport`
--

CREATE TABLE `statuts_rapport` (
  `id_statut` int(11) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `libelle` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `ordre` int(11) DEFAULT 1,
  `actif` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `statuts_rapport`
--

INSERT INTO `statuts_rapport` (`id_statut`, `code`, `libelle`, `description`, `ordre`, `actif`) VALUES
(1, NULL, 'Initialisé', NULL, 1, 1),
(2, NULL, 'En cours de correction', NULL, 1, 1),
(3, NULL, 'Validé', NULL, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `types_rapport`
--

CREATE TABLE `types_rapport` (
  `id_type` int(11) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `libelle` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `duree_min_jours` int(11) DEFAULT NULL,
  `duree_max_jours` int(11) DEFAULT NULL,
  `entreprise_requise` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `types_rapport`
--

INSERT INTO `types_rapport` (`id_type`, `code`, `libelle`, `description`, `duree_min_jours`, `duree_max_jours`, `entreprise_requise`) VALUES
(1, 'PFE', 'Projet de Fin d\'Études', NULL, 120, 180, 1),
(2, 'pfe', 'Projet de Fin d\'Année', NULL, 30, 60, 0),
(3, 'STAGE', 'Stage Technique', NULL, 30, 90, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users_login`
--

CREATE TABLE `users_login` (
  `id_user` int(11) NOT NULL,
  `login` varchar(50) DEFAULT NULL,
  `mot_de_passe` varchar(255) DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users_login`
--

INSERT INTO `users_login` (`id_user`, `login`, `mot_de_passe`, `role`, `actif`) VALUES
(1, 'admin', 'admin', 'ADMIN', 1),
(10, 'ghali', 'pass', 'ETUDIANT', 1),
(11, 'moha', 'pass', 'ENCADRANT', 1),
(12, 'messi', 'pass', 'ETUDIANT', 1),
(13, 'mimo', 'pass', 'ETUDIANT', 1);

-- --------------------------------------------------------

--
-- Table structure for table `versions_rapport`
--

CREATE TABLE `versions_rapport` (
  `id_version` int(11) NOT NULL,
  `id_rapport` int(11) DEFAULT NULL,
  `numero_version` int(11) DEFAULT NULL,
  `fichier_path` varchar(255) DEFAULT NULL,
  `date_depot` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `versions_rapport`
--

INSERT INTO `versions_rapport` (`id_version`, `id_rapport`, `numero_version`, `fichier_path`, `date_depot`) VALUES
(1, 42, 1, '1769866709886.pdf', '2026-01-31 14:38:30'),
(2, 43, 1, '1769868496873.pdf', '2026-01-31 15:08:17'),
(3, 42, 2, '1769868899435.pdf', '2026-01-31 15:14:59'),
(4, 44, 1, '1769894160106.pdf', '2026-01-31 22:16:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `administrateurs`
--
ALTER TABLE `administrateurs`
  ADD PRIMARY KEY (`id_admin`),
  ADD KEY `id_user` (`id_user`);

--
-- Indexes for table `annees_academiques`
--
ALTER TABLE `annees_academiques`
  ADD PRIMARY KEY (`id_annee`);

--
-- Indexes for table `configurations`
--
ALTER TABLE `configurations`
  ADD PRIMARY KEY (`id_config`),
  ADD UNIQUE KEY `cle` (`cle`);

--
-- Indexes for table `departements`
--
ALTER TABLE `departements`
  ADD PRIMARY KEY (`id_departement`);

--
-- Indexes for table `encadrants`
--
ALTER TABLE `encadrants`
  ADD PRIMARY KEY (`id_encadrant`),
  ADD KEY `id_user` (`id_user`);

--
-- Indexes for table `entreprises`
--
ALTER TABLE `entreprises`
  ADD PRIMARY KEY (`id_entreprise`);

--
-- Indexes for table `etudiants`
--
ALTER TABLE `etudiants`
  ADD PRIMARY KEY (`id_etudiant`),
  ADD KEY `id_user` (`id_user`);

--
-- Indexes for table `filieres`
--
ALTER TABLE `filieres`
  ADD PRIMARY KEY (`id_filiere`),
  ADD KEY `id_departement` (`id_departement`);

--
-- Indexes for table `historique_actions`
--
ALTER TABLE `historique_actions`
  ADD PRIMARY KEY (`id_action`),
  ADD KEY `id_user` (`id_user`);

--
-- Indexes for table `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id_module`),
  ADD KEY `id_filiere` (`id_filiere`),
  ADD KEY `id_niveau` (`id_niveau`);

--
-- Indexes for table `niveaux`
--
ALTER TABLE `niveaux`
  ADD PRIMARY KEY (`id_niveau`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id_notification`),
  ADD KEY `id_user` (`id_user`);

--
-- Indexes for table `plagiat_resultats`
--
ALTER TABLE `plagiat_resultats`
  ADD PRIMARY KEY (`id_resultat`),
  ADD UNIQUE KEY `id_rapport` (`id_rapport`);

--
-- Indexes for table `rapports`
--
ALTER TABLE `rapports`
  ADD PRIMARY KEY (`id_rapport`),
  ADD KEY `id_etudiant` (`id_etudiant`),
  ADD KEY `id_encadrant` (`id_encadrant`),
  ADD KEY `id_statut` (`id_statut`),
  ADD KEY `id_type` (`id_type`);

--
-- Indexes for table `statuts_rapport`
--
ALTER TABLE `statuts_rapport`
  ADD PRIMARY KEY (`id_statut`);

--
-- Indexes for table `types_rapport`
--
ALTER TABLE `types_rapport`
  ADD PRIMARY KEY (`id_type`);

--
-- Indexes for table `users_login`
--
ALTER TABLE `users_login`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `login` (`login`);

--
-- Indexes for table `versions_rapport`
--
ALTER TABLE `versions_rapport`
  ADD PRIMARY KEY (`id_version`),
  ADD KEY `id_rapport` (`id_rapport`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `administrateurs`
--
ALTER TABLE `administrateurs`
  MODIFY `id_admin` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `annees_academiques`
--
ALTER TABLE `annees_academiques`
  MODIFY `id_annee` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `configurations`
--
ALTER TABLE `configurations`
  MODIFY `id_config` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `departements`
--
ALTER TABLE `departements`
  MODIFY `id_departement` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `encadrants`
--
ALTER TABLE `encadrants`
  MODIFY `id_encadrant` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `entreprises`
--
ALTER TABLE `entreprises`
  MODIFY `id_entreprise` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `etudiants`
--
ALTER TABLE `etudiants`
  MODIFY `id_etudiant` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `filieres`
--
ALTER TABLE `filieres`
  MODIFY `id_filiere` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `historique_actions`
--
ALTER TABLE `historique_actions`
  MODIFY `id_action` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `modules`
--
ALTER TABLE `modules`
  MODIFY `id_module` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `niveaux`
--
ALTER TABLE `niveaux`
  MODIFY `id_niveau` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id_notification` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `plagiat_resultats`
--
ALTER TABLE `plagiat_resultats`
  MODIFY `id_resultat` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `rapports`
--
ALTER TABLE `rapports`
  MODIFY `id_rapport` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `statuts_rapport`
--
ALTER TABLE `statuts_rapport`
  MODIFY `id_statut` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `types_rapport`
--
ALTER TABLE `types_rapport`
  MODIFY `id_type` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users_login`
--
ALTER TABLE `users_login`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `versions_rapport`
--
ALTER TABLE `versions_rapport`
  MODIFY `id_version` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `administrateurs`
--
ALTER TABLE `administrateurs`
  ADD CONSTRAINT `administrateurs_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users_login` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `encadrants`
--
ALTER TABLE `encadrants`
  ADD CONSTRAINT `encadrants_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users_login` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `etudiants`
--
ALTER TABLE `etudiants`
  ADD CONSTRAINT `etudiants_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users_login` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `filieres`
--
ALTER TABLE `filieres`
  ADD CONSTRAINT `filieres_ibfk_1` FOREIGN KEY (`id_departement`) REFERENCES `departements` (`id_departement`) ON DELETE SET NULL;

--
-- Constraints for table `historique_actions`
--
ALTER TABLE `historique_actions`
  ADD CONSTRAINT `historique_actions_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users_login` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `modules`
--
ALTER TABLE `modules`
  ADD CONSTRAINT `modules_ibfk_1` FOREIGN KEY (`id_filiere`) REFERENCES `filieres` (`id_filiere`) ON DELETE CASCADE,
  ADD CONSTRAINT `modules_ibfk_2` FOREIGN KEY (`id_niveau`) REFERENCES `niveaux` (`id_niveau`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users_login` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `plagiat_resultats`
--
ALTER TABLE `plagiat_resultats`
  ADD CONSTRAINT `plagiat_resultats_ibfk_1` FOREIGN KEY (`id_rapport`) REFERENCES `rapports` (`id_rapport`) ON DELETE CASCADE;

--
-- Constraints for table `rapports`
--
ALTER TABLE `rapports`
  ADD CONSTRAINT `rapports_ibfk_1` FOREIGN KEY (`id_etudiant`) REFERENCES `etudiants` (`id_etudiant`) ON DELETE CASCADE,
  ADD CONSTRAINT `rapports_ibfk_2` FOREIGN KEY (`id_encadrant`) REFERENCES `encadrants` (`id_encadrant`) ON DELETE SET NULL,
  ADD CONSTRAINT `rapports_ibfk_3` FOREIGN KEY (`id_statut`) REFERENCES `statuts_rapport` (`id_statut`),
  ADD CONSTRAINT `rapports_ibfk_4` FOREIGN KEY (`id_type`) REFERENCES `types_rapport` (`id_type`);

--
-- Constraints for table `versions_rapport`
--
ALTER TABLE `versions_rapport`
  ADD CONSTRAINT `versions_rapport_ibfk_1` FOREIGN KEY (`id_rapport`) REFERENCES `rapports` (`id_rapport`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
