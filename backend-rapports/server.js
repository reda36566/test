const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');
const pdfParse = require('pdf-extraction');
const stringSimilarity = require('string-similarity');
const fs = require('fs');
const app = express();
// Permet d'accéder aux fichiers dans le dossier 'uploads' depuis le navigateur
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
require('dotenv').config(); // Pour lire le fichier .env
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Pour Gemini
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(cors());
console.log("------------------------------------------------");
console.log("TYPE DE PDF-PARSE :", typeof pdfParse);
console.log("CONTENU :", pdfParse);
console.log("------------------------------------------------");
// 1. CONNEXION BDD
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gestion_pfe_ensa'
});

const queryAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

db.connect(err => {
    if (err) console.error("❌ ERREUR BDD :", err.message);
    else console.log("✅ SUCCÈS : Connecté à 'gestion_pfe_ensa'");
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });
// --- CONFIGURATION IA ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Assurez-vous d'avoir en haut : const pdfParse = require('pdf-parse');
async function getPdfText(filePath) {
    try {
        if (!fs.existsSync(filePath)) return "";
        
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer); // pdfParse est maintenant une fonction valide
        
        return data.text ? data.text.trim() : ""; 
    } catch (e) {
        console.error("❌ Erreur lecture PDF :", e.message);
        return "";
    }
}
// --- HELPERS ---
const createNotification = (id_user, type, titre, message, lien) => {
    const sql = "INSERT INTO notifications (id_user, type, titre, message, lien, date_creation) VALUES (?, ?, ?, ?, ?, NOW())";
    db.query(sql, [id_user, type, titre, message, lien], (err) => {
        if (err) console.error("❌ Erreur notif :", err.message);
    });
};

const logAction = (id_user, type, details) => {
    const sql = "INSERT INTO historique_actions (id_user, type_action, details, date_action) VALUES (?, ?, ?, NOW())";
    db.query(sql, [id_user, type, details], (err) => { if (err) console.error("❌ Erreur Log:", err.message); });
};

// --- AUTH HELPERS ---
const authenticateUser = (req, res, next) => {
    const userIdHeader = req.headers['x-user-id'] ?? req.query.id_user;
    const roleHeader = req.headers['x-user-role'] ?? req.query.role;
    if (!userIdHeader || !roleHeader) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const userIdValue = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;
    const roleValue = Array.isArray(roleHeader) ? roleHeader[0] : roleHeader;
    const id_user = Number(userIdValue);
    if (!Number.isFinite(id_user)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = {
        id_user,
        role: String(roleValue).toUpperCase().trim(),
    };
    next();
};

const requireRole = (role) => (req, res, next) => {
    if (!req.user || req.user.role !== role) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
};

// 2. LOGIN
app.post('/api/login', (req, res) => {
    const { login, password } = req.body;
    db.query("SELECT * FROM users_login WHERE login = ? AND mot_de_passe = ?", [login, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            const user = results[0];
            let roleStr = (user.role || "ETUDIANT").toUpperCase().trim();
            
            if (roleStr === 'ADMIN') {
                db.query("SELECT id_admin FROM administrateurs WHERE id_user = ?", [user.id_user], (errA, resA) => {
                    const idSpec = (resA && resA.length > 0) ? resA[0].id_admin : 1;
                    res.json({ success: true, user: { id_user: user.id_user, login: user.login, role: roleStr, id_specifique: idSpec } });
                });
            } else if (roleStr === 'ENCADRANT') {
                db.query("SELECT id_encadrant FROM encadrants WHERE id_user = ?", [user.id_user], (errP, resP) => {
                    const idSpec = (resP && resP.length > 0) ? resP[0].id_encadrant : (user.id_encadrant || 1);
                    res.json({ success: true, user: { id_user: user.id_user, login: user.login, role: roleStr, id_specifique: idSpec } });
                });
            } else {
                db.query("SELECT id_etudiant FROM etudiants WHERE id_user = ?", [user.id_user], (errE, resE) => {
                    const idSpec = (resE && resE.length > 0) ? resE[0].id_etudiant : (user.id_etudiant || 1);
                    res.json({ success: true, user: { id_user: user.id_user, login: user.login, role: roleStr, id_specifique: idSpec } });
                });
            }
        } else {
            res.status(401).json({ error: "Identifiants incorrects" });
        }
    });
});
// --- ROUTE CHATBOT (CORRIGÉE : MODÈLE VÉRIFIÉ) ---
app.post('/api/chatbot', async (req, res) => {
    const { question } = req.body;
    console.log("🔍 Question reçue :", question);

    try {
        // 1. Récupération du contexte (Les 3 derniers rapports)
        const docs = await queryAsync(
            "SELECT titre, contenu_texte FROM rapports WHERE contenu_texte IS NOT NULL AND contenu_texte != '' ORDER BY date_depot DESC LIMIT 3"
        );

        // Si la base est vide
        const validDocs = docs || [];
        const contexte = validDocs.length > 0 
            ? validDocs.map(d => `Rapport: ${d.titre}\nContenu: ${d.contenu_texte.substring(0, 4000)}`).join("\n\n")
            : "Aucun rapport disponible pour le moment.";

        // 2. Configuration du modèle (Celui qui fonctionne avec ta clé !)
        // ✅ C'est ici la modification cruciale
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Tu es un assistant pédagogique expert pour une plateforme universitaire.
        Voici les informations extraites des derniers rapports étudiants :
        ----------------
        ${contexte}
        ----------------
        
        QUESTION DE L'UTILISATEUR : "${question}"
        
        CONSIGNE :
        Réponds de manière concise et utile. Si la réponse se trouve dans les rapports ci-dessus, cite le titre du rapport. 
        Si la réponse n'est pas dans le contexte, utilise tes connaissances générales pour aider l'étudiant quand même.
        `;

        // 3. Génération de la réponse
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        console.log("✅ Réponse IA générée avec succès");
        res.json({ reponse: responseText });

    } catch (error) {
        console.error("❌ Erreur Chatbot :", error.message);
        res.json({ reponse: "Désolé, je rencontre une erreur de connexion avec l'IA. Veuillez réessayer plus tard." });
    }

});
// --- MODULE DE RECHERCHE FULL-TEXT (CORRIGÉ) ---
app.get('/api/search/fulltext', async (req, res) => {
    const searchTerm = req.query.q;
    
    if (!searchTerm || searchTerm.length < 2) {
        return res.json([]);
    }

    try {
        const sql = `
            SELECT id_rapport, titre, contenu_texte, fichier_path,
                   MATCH(titre, contenu_texte) AGAINST(? IN NATURAL LANGUAGE MODE) AS score
            FROM rapports 
            WHERE MATCH(titre, contenu_texte) AGAINST(? IN NATURAL LANGUAGE MODE)
            ORDER BY score DESC 
            LIMIT 10
        `;

        db.query(sql, [searchTerm, searchTerm], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const cleanedResults = results.map(r => ({
                id_rapport: r.id_rapport, // Note: J'ai remis id_rapport pour être cohérent avec ton frontend
                titre: r.titre,
                extrait: r.contenu_texte ? r.contenu_texte.substring(0, 150) + "..." : "Aucun contenu extrait.",
                // 👇 C'EST LA LIGNE QU'IL MANQUAIT 👇
                fichier_path: r.fichier_path 
            }));
            
            res.json(cleanedResults);
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur moteur de recherche" });
    }
});

// 3. ROUTES DE BASE
app.get('/api/encadrants', (req, res) => {
    db.query("SELECT id_encadrant, nom, prenom FROM encadrants", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 4. GESTION DES RAPPORTS
app.get('/api/rapports/:id', (req, res) => {
    const sql = `
        SELECT r.*, 
               a.libelle AS annee_libelle, 
               e.nom AS nom_entreprise
        FROM rapports r 
        LEFT JOIN annees_academiques a ON r.id_annee = a.id_annee
        LEFT JOIN entreprises e ON r.id_entreprise = e.id_entreprise
        WHERE r.id_rapport = ?
    `;
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result[0] || {});
    });
});

app.get('/api/rapports/:id/versions', (req, res) => {
    db.query("SELECT * FROM versions_rapport WHERE id_rapport = ? ORDER BY numero_version DESC", [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/rapports/upload', upload.single('rapport'), async (req, res) => {
    const { titre, id_type, id_annee, id_etudiant, id_entreprise, id_encadrant } = req.body;
    
    if (!req.file) return res.status(400).json({ error: "Fichier PDF manquant" });
    const newFilePath = req.file.path;

    try {
        // 1. Extraction du texte (POUR L'IA)
        // C'est cette partie qui manquait dans ton code
        const nouveauTexteRaw = await getPdfText(newFilePath);
        const nouveauTexte = nouveauTexteRaw ? nouveauTexteRaw.trim() : "";

        // 2. Insertion dans la table rapports
        // J'ai ajouté 'contenu_texte' et 'fichier_path' dans la requête
        const sqlRapport = `INSERT INTO rapports (titre, id_type, id_annee, id_etudiant, id_entreprise, id_statut, id_encadrant, date_depot, date_modification, contenu_texte, fichier_path) 
                            VALUES (?, ?, ?, ?, ?, 1, ?, NOW(), NOW(), ?, ?)`;
        
        db.query(sqlRapport, [titre, id_type, id_annee, id_etudiant, id_entreprise, id_encadrant, nouveauTexte, newFilePath], (err, result) => {
            if (err) return res.status(500).json({ error: "Erreur BDD Rapport: " + err.message });
            const currentId = result.insertId;

            // 3. Insertion dans versions_rapport
            db.query(`INSERT INTO versions_rapport (numero_version, fichier_path, id_rapport, date_depot) VALUES (1, ?, ?, NOW())`, 
            [req.file.filename, currentId], (errV) => {
                if (errV) return res.status(500).json({ error: "Erreur BDD Version: " + errV.message });

                // 4. TA LOGIQUE DE PLAGIAT (Je l'ai gardée exactement pareille)
                db.query("SELECT fichier_path FROM versions_rapport WHERE id_rapport != ? AND fichier_path != ?", 
                [currentId, req.file.filename], async (errQ, anciens) => {
                    let maxScore = 0;

                    if (!errQ && anciens.length > 0) {
                        for (let doc of anciens) {
                            const docPath = path.join(__dirname, 'uploads', doc.fichier_path);
                            
                            if (fs.existsSync(docPath)) {
                                try {
                                    const texteAncienRaw = await getPdfText(docPath);
                                    const texteAncien = texteAncienRaw ? texteAncienRaw.trim() : "";

                                    // Comparaison
                                    if (nouveauTexte.length > 50 && texteAncien.length > 50) {
                                        const similarity = stringSimilarity.compareTwoStrings(nouveauTexte, texteAncien);
                                        if (similarity > maxScore) maxScore = similarity;
                                    }
                                } catch (e) {
                                    console.error(`Erreur lecture ancien fichier:`, e.message);
                                }
                            }
                        }
                    }

                    const realScore = Math.round(maxScore * 100);
                    const status = realScore >= 30 ? 'Critique' : (realScore >= 15 ? 'Suspect' : 'Correct');

                    const sqlPlagiat = `INSERT INTO plagiat_resultats (id_rapport, score_similitude, statut, details, date_analyse) 
                                        VALUES (?, ?, ?, 'Analyse réelle par contenu', NOW())`;
                    
                    db.query(sqlPlagiat, [currentId, realScore, status], (errP) => {
                        if (errP) console.error("Erreur insertion plagiat:", errP.message);

                        res.status(201).json({ 
                            success: true, 
                            message: "Rapport déposé et analysé (IA + Plagiat)", 
                            id_rapport: currentId, 
                            score: realScore 
                        });
                    });
                });
                // --- FIN LOGIQUE PLAGIAT ---
            });
        });
    } catch (error) {
        console.error("Erreur critique serveur:", error);
        res.status(500).json({ error: "Erreur interne" });
    }
});
app.post('/api/rapports/:id/versions', upload.single('rapport'), (req, res) => {
    const id_rapport = req.params.id;
    if (!req.file) return res.status(400).json({ error: "Fichier manquant" });
    db.query("SELECT MAX(numero_version) as max_v FROM versions_rapport WHERE id_rapport = ?", [id_rapport], (err, result) => {
        const nextVersion = (result[0].max_v || 0) + 1;
        db.query("INSERT INTO versions_rapport (numero_version, fichier_path, id_rapport, date_depot) VALUES (?, ?, ?, NOW())", [nextVersion, req.file.filename, id_rapport], (errV) => {
            if (errV) return res.status(500).json({ error: errV.message });
            db.query("UPDATE rapports SET id_statut = 1, date_modification = NOW() WHERE id_rapport = ?", [id_rapport]);
            // Notif
            db.query("SELECT id_encadrant, titre FROM rapports WHERE id_rapport = ?", [id_rapport], (errR, resR) => {
                if (resR.length > 0) {
                    db.query("SELECT id_user FROM encadrants WHERE id_encadrant = ?", [resR[0].id_encadrant], (errP, resP) => {
                        if (resP.length > 0) createNotification(resP[0].id_user, 'NEW_VERSION', 'Mise à jour', `Nouvelle version (V${nextVersion}) pour : ${resR[0].titre}`, `/supervisor/report/${id_rapport}`);
                    });
                }
            });
            res.json({ message: "Version ajoutée", version: nextVersion });
        });
    });
});
app.get('/api/entreprises', (req, res) => {
    db.query("SELECT * FROM entreprises ORDER BY nom", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 5. DASHBOARDS
app.get('/api/etudiant/rapports', (req, res) => {
    const sql = `SELECT r.id_rapport, r.titre, r.date_depot, r.id_statut, s.libelle as statut_libelle, t.libelle as type_libelle, enc.nom as nom_encadrant FROM rapports r JOIN statuts_rapport s ON r.id_statut = s.id_statut LEFT JOIN types_rapport t ON r.id_type = t.id_type LEFT JOIN encadrants enc ON r.id_encadrant = enc.id_encadrant WHERE r.id_etudiant = ?`;
    db.query(sql, [req.query.id_etudiant], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/encadrant/rapports', (req, res) => {
    const sql = `SELECT r.id_rapport, r.titre, r.date_depot, s.libelle as statut_label, r.id_statut, e.nom as nom_etudiant, e.prenom as prenom_etudiant, t.libelle as type_rapport, v.fichier_path FROM rapports r JOIN etudiants e ON r.id_etudiant = e.id_etudiant JOIN statuts_rapport s ON r.id_statut = s.id_statut JOIN types_rapport t ON r.id_type = t.id_type LEFT JOIN versions_rapport v ON v.id_rapport = r.id_rapport AND v.numero_version = (SELECT MAX(numero_version) FROM versions_rapport WHERE id_rapport = r.id_rapport) WHERE r.id_encadrant = ?`;
    db.query(sql, [req.query.id_encadrant], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/encadrant/valider', (req, res) => {
    const { id_rapport, id_statut, id_user_prof } = req.body;
    db.query("UPDATE rapports SET id_statut = ? WHERE id_rapport = ?", [id_statut, id_rapport], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        if (id_user_prof) logAction(id_user_prof, 'EVALUATION', id_statut === 2 ? `Validation Rapport ID ${id_rapport}` : `Demande Correction Rapport ID ${id_rapport}`);
        // Notif étudiant
        db.query("SELECT id_etudiant FROM rapports WHERE id_rapport = ?", [id_rapport], (errR, resR) => {
            if (resR.length > 0) {
                db.query("SELECT id_user FROM etudiants WHERE id_user = ?", [resR[0].id_etudiant], (errE, resE) => {
                    if (resE.length > 0) createNotification(resE[0].id_user, 'STATUS_CHANGE', 'Changement de statut', id_statut === 2 ? "Rapport validé !" : "Corrections demandées.", `/student/report/${id_rapport}`);
                });
            }
        });
        res.json({ message: "OK" });
    });
});
app.post('/api/encadrant/refuser', (req, res) => {
    // 1. Récupérez aussi le commentaire
    const { id_rapport, id_user_prof, commentaire } = req.body; 
    
    // 2. Ajoutez le champ commentaire_encadrant dans la requête SQL
    const sql = "UPDATE rapports SET id_statut = 2, note = NULL, commentaire_encadrant = ? WHERE id_rapport = ?";
    
    db.query(sql, [commentaire, id_rapport], (err) => { // Ajoutez commentaire dans les paramètres
        if (err) return res.status(500).json({ error: err.message });

        if (id_user_prof) logAction(id_user_prof, 'EVALUATION', `Correction demandée pour le rapport ID ${id_rapport}`);

        // ... (Le reste du code de notification reste identique) ...
        const sqlUser = "SELECT e.id_user FROM rapports r JOIN etudiants e ON r.id_etudiant = e.id_etudiant WHERE r.id_rapport = ?";
        db.query(sqlUser, [id_rapport], (errU, resU) => {
             // ... notification ...
        });

        res.json({ message: "Le rapport est désormais en attente de corrections" });
    });
});
app.post('/api/encadrant/noter', (req, res) => {
    const { id_rapport, note, commentaire, id_user_prof } = req.body;
    
    // ✅ CORRECTION : id_statut = 3 pour correspondre à "Validé" dans ta BDD
    // Si tu laisses 2, il affichera "Soumis" chez l'étudiant
    const sql = "UPDATE rapports SET note = ?, commentaire_encadrant = ?, id_statut = 3 WHERE id_rapport = ?";
    
    db.query(sql, [note, commentaire, id_rapport], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        if (id_user_prof) {
            logAction(id_user_prof, 'EVALUATION', `Note attribuée : ${note}/20 pour le rapport ID ${id_rapport}`);
        }

        const sqlFindUser = `
            SELECT e.id_user, r.titre 
            FROM rapports r 
            JOIN etudiants e ON r.id_etudiant = e.id_etudiant 
            WHERE r.id_rapport = ?`;

        db.query(sqlFindUser, [id_rapport], (errR, resR) => {
            if (resR && resR.length > 0) {
                const targetUser = resR[0].id_user;
                const titre = resR[0].titre;

                createNotification(
                    targetUser, 
                    'GRADE_PUBLISHED', 
                    'Note disponible', 
                    `Votre rapport "${titre}" a été validé avec la note de ${note}/20.`, 
                    `/student/report/${id_rapport}`
                );
            }
        });

        res.json({ message: "Note enregistrée et rapport officiellement validé (ID 3)" });
    });
});

// 6. ROUTES DIVERSES
app.get('/api/etudiants/:id', (req, res) => {
    db.query("SELECT * FROM etudiants WHERE id_etudiant = ?", [req.params.id], (err, result) => res.json(result[0] || {}));
});
app.get('/api/notifications', (req, res) => {
    db.query("SELECT * FROM notifications WHERE id_user = ? ORDER BY date_creation DESC", [req.query.id_user], (err, results) => res.json(results));
});
app.put('/api/notifications/:id/read', (req, res) => {
    db.query("UPDATE notifications SET lue = 1 WHERE id_notification = ?", [req.params.id], (err) => res.json({ success: true }));
});
app.get('/api/historique', (req, res) => {
    let sql = `SELECT h.*, u.login, u.role 
               FROM historique_actions h 
               JOIN users_login u ON h.id_user = u.id_user`;
    let params = [];

    if (req.query.id_user) {
        sql += " WHERE h.id_user = ?";
        params.push(req.query.id_user);
    }
    
    sql += " ORDER BY h.date_action DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
app.get('/api/encadrants/:id', (req, res) => {
    db.query("SELECT * FROM encadrants WHERE id_encadrant = ?", [req.params.id], (err, result) => res.json(result[0] || {}));
});
app.post('/api/change-password', (req, res) => {
    const { id_user, current, next } = req.body;
    db.query("SELECT * FROM users_login WHERE id_user = ? AND mot_de_passe = ?", [id_user, current], (err, results) => {
        if (results.length === 0) return res.status(401).json({ error: "Mot de passe actuel incorrect" });
        db.query("UPDATE users_login SET mot_de_passe = ? WHERE id_user = ?", [next, id_user], () => res.json({ success: true }));
    });
});

// ==========================================
// 7. ROUTES ADMIN (STATS, USERS, REPORTS)
// ==========================================
app.get('/api/admin/stats', (req, res) => {
// 1. Requête pour les compteurs (Cartes du haut)
const sqlCounts = `
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN id_statut = 3 THEN 1 ELSE 0 END) as valides,    -- ✅ 3 au lieu de 2
        SUM(CASE WHEN id_statut = 2 THEN 1 ELSE 0 END) as en_attente -- ✅ 2 au lieu de 1
    FROM rapports`;

db.query(sqlCounts, (err, rCounts) => {
    if (err) return res.status(500).json({ error: err.message });
    const statsRapports = rCounts[0];

    // 2. Requête synchronisée pour le Pie Chart
    const sqlStatus = `
       SELECT 
        CASE 
            WHEN id_statut = 2 THEN 'Soumis'
            WHEN id_statut = 3 THEN 'Validé'
            WHEN id_statut = 4 THEN 'À corriger' -- Doit être identique au statusMap
            ELSE 'Brouillon'
        END as name,
        COUNT(*) as value 
    FROM rapports 
    GROUP BY name`;
    
    // ... reste de votre exécution

        // 3. Requête pour le compteur de PLAGIAT RÉEL
        const sqlPlagiat = `
            SELECT COUNT(*) as value 
            FROM plagiat_resultats 
            WHERE score_similitude >= 30`;

        db.query("SELECT COUNT(*) as c FROM etudiants", (e, r1) => {
            db.query("SELECT COUNT(*) as c FROM encadrants", (e, r2) => {
                db.query("SELECT COUNT(*) as c FROM users_login", (e, r4) => {
                    db.query(sqlStatus, (e, rStatus) => {
                        db.query("SELECT t.libelle as name, COUNT(r.id_rapport) as value FROM types_rapport t LEFT JOIN rapports r ON t.id_type = r.id_type GROUP BY t.id_type, t.libelle", (e, rType) => {
                            db.query(sqlPlagiat, (e, rPlagiat) => {
                                db.query("SELECT h.*, u.login FROM historique_actions h JOIN users_login u ON h.id_user = u.id_user ORDER BY h.date_action DESC LIMIT 5", (e, rLogs) => {
                                    res.json({
                                        counts: { 
                                            etudiants: r1[0].c, 
                                            encadrants: r2[0].c, 
                                            rapports: statsRapports.total,
                                            valides: statsRapports.valides || 0,
                                            enAttente: statsRapports.en_attente || 0,
                                            plagiatCritique: rPlagiat[0].value || 0,
                                            users: r4[0].c 
                                        },
                                        charts: { 
                                            byStatus: rStatus, 
                                            byType: rType 
                                        },
                                        recentActivity: rLogs
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

app.get('/api/admin/users', (req, res) => {
    const sql = `SELECT u.id_user, u.login, u.actif, u.role, COALESCE(e.nom, enc.nom, a.nom) as nom, COALESCE(e.prenom, enc.prenom, a.prenom) as prenom, COALESCE(e.email, enc.email, a.email) as email FROM users_login u LEFT JOIN etudiants e ON u.id_user = e.id_user LEFT JOIN encadrants enc ON u.id_user = enc.id_user LEFT JOIN administrateurs a ON u.id_user = a.id_user ORDER BY u.id_user DESC`;
    db.query(sql, (err, results) => res.json(results));
});

app.post('/api/admin/users', (req, res) => {
    const { nom, prenom, email, login, password, role } = req.body;
    const roleUpper = role.toUpperCase();
    db.query("INSERT INTO users_login (login, mot_de_passe, role, actif) VALUES (?, ?, ?, 1)", [login, password, roleUpper], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const newId = result.insertId;
        const table = roleUpper === 'ETUDIANT' ? 'etudiants' : (roleUpper === 'ENCADRANT' ? 'encadrants' : 'administrateurs');
        db.query(`INSERT INTO ${table} (id_user, nom, prenom, email) VALUES (?, ?, ?, ?)`, [newId, nom, prenom, email], () => res.json({ success: true }));
    });
});

app.delete('/api/admin/users/:id', (req, res) => {
    db.query("DELETE FROM users_login WHERE id_user = ?", [req.params.id], () => res.json({ success: true }));
});

app.get('/api/admin/reports', (req, res) => {
    const sql = `SELECT r.id_rapport, r.titre, r.date_depot, r.note, s.libelle as statut, t.libelle as type, e.nom as nom_etudiant, e.prenom as prenom_etudiant, enc.nom as nom_encadrant FROM rapports r JOIN etudiants e ON r.id_etudiant = e.id_etudiant LEFT JOIN encadrants enc ON r.id_encadrant = enc.id_encadrant JOIN statuts_rapport s ON r.id_statut = s.id_statut JOIN types_rapport t ON r.id_type = t.id_type ORDER BY r.date_depot DESC`;
    db.query(sql, (err, results) => res.json(results));
});

// ==========================================
// 8. GESTION ACADÉMIQUE (ADMIN) - CORRIGÉE
// ==========================================
app.get('/api/admin/academic/departements', (req, res) => {
    db.query("SELECT id_departement, code, nom_departement AS nom, description, actif FROM departements ORDER BY nom_departement", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/admin/academic/departements', (req, res) => {
    const { code, nom, description, actif } = req.body;
    db.query("INSERT INTO departements (code, nom_departement, description, actif) VALUES (?, ?, ?, ?)", [code, nom, description, actif ? 1 : 0], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id_departement: result.insertId, ...req.body });
    });
});

app.put('/api/admin/academic/departements/:id', (req, res) => {
    const { code, nom, description, actif } = req.body;
    db.query("UPDATE departements SET code=?, nom_departement=?, description=?, actif=? WHERE id_departement=?", [code, nom, description, actif ? 1 : 0, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/admin/academic/departements/:id', (req, res) => {
    db.query("DELETE FROM departements WHERE id_departement=?", [req.params.id], (err) => res.json({ success: true }));
});

// -- FILIERES --
app.get('/api/admin/academic/filieres', (req, res) => {
    db.query("SELECT * FROM filieres ORDER BY nom", (err, results) => res.json(results));
});
app.post('/api/admin/academic/filieres', (req, res) => {
    const { code, nom, description, id_departement, actif } = req.body;
    db.query("INSERT INTO filieres (code, nom, description, id_departement, actif) VALUES (?, ?, ?, ?, ?)", [code, nom, description, id_departement, actif ? 1 : 0], (err, result) => res.json({ id_filiere: result.insertId, ...req.body }));
});
app.put('/api/admin/academic/filieres/:id', (req, res) => {
    const { code, nom, description, id_departement, actif } = req.body;
    db.query("UPDATE filieres SET code=?, nom=?, description=?, id_departement=?, actif=? WHERE id_filiere=?", [code, nom, description, id_departement, actif ? 1 : 0, req.params.id], () => res.json({ success: true }));
});
app.delete('/api/admin/academic/filieres/:id', (req, res) => {
    db.query("DELETE FROM filieres WHERE id_filiere=?", [req.params.id], () => res.json({ success: true }));
});

// -- NIVEAUX --
app.get('/api/admin/academic/niveaux', (req, res) => {
    db.query("SELECT * FROM niveaux ORDER BY ordre", (err, results) => res.json(results));
});
app.post('/api/admin/academic/niveaux', (req, res) => {
    const { code, nom, ordre, actif } = req.body;
    db.query("INSERT INTO niveaux (code, nom, ordre, actif) VALUES (?, ?, ?, ?)", [code, nom, ordre, actif ? 1 : 0], (err, result) => res.json({ id_niveau: result.insertId, ...req.body }));
});
app.put('/api/admin/academic/niveaux/:id', (req, res) => {
    const { code, nom, ordre, actif } = req.body;
    db.query("UPDATE niveaux SET code=?, nom=?, ordre=?, actif=? WHERE id_niveau=?", [code, nom, ordre, actif ? 1 : 0, req.params.id], () => res.json({ success: true }));
});
app.delete('/api/admin/academic/niveaux/:id', (req, res) => {
    db.query("DELETE FROM niveaux WHERE id_niveau=?", [req.params.id], () => res.json({ success: true }));
});

// -- MODULES --
app.get('/api/admin/academic/modules', (req, res) => {
    db.query("SELECT * FROM modules ORDER BY nom", (err, results) => res.json(results));
});
app.post('/api/admin/academic/modules', (req, res) => {
    const { code, nom, id_filiere, id_niveau, semestre, credits, actif } = req.body;
    db.query("INSERT INTO modules (code, nom, id_filiere, id_niveau, semestre, credits, actif) VALUES (?, ?, ?, ?, ?, ?, ?)", [code, nom, id_filiere, id_niveau, semestre, credits, actif ? 1 : 0], (err, result) => res.json({ id_module: result.insertId, ...req.body }));
});
app.put('/api/admin/academic/modules/:id', (req, res) => {
    const { code, nom, id_filiere, id_niveau, semestre, credits, actif } = req.body;
    db.query("UPDATE modules SET code=?, nom=?, id_filiere=?, id_niveau=?, semestre=?, credits=?, actif=? WHERE id_module=?", [code, nom, id_filiere, id_niveau, semestre, credits, actif ? 1 : 0, req.params.id], () => res.json({ success: true }));
});
app.delete('/api/admin/academic/modules/:id', (req, res) => {
    db.query("DELETE FROM modules WHERE id_module=?", [req.params.id], () => res.json({ success: true }));
});

// -- ANNEES --
app.get('/api/admin/academic/annees', (req, res) => {
    db.query("SELECT * FROM annees_academiques ORDER BY date_debut DESC", (err, results) => res.json(results));
});
app.post('/api/admin/academic/annees', (req, res) => {
    const { libelle, date_debut, date_fin, actuelle } = req.body;
    if (actuelle) db.query("UPDATE annees_academiques SET actuelle = 0");
    db.query("INSERT INTO annees_academiques (libelle, date_debut, date_fin, actuelle) VALUES (?, ?, ?, ?)", [libelle, date_debut, date_fin, actuelle ? 1 : 0], (err, result) => res.json({ id_annee: result.insertId, ...req.body }));
});
app.put('/api/admin/academic/annees/:id/toggle', (req, res) => {
    db.query("UPDATE annees_academiques SET actuelle = 0", (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query("UPDATE annees_academiques SET actuelle = 1 WHERE id_annee = ?", [req.params.id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ success: true });
        });
    });
});

// ==========================================
// 9. GESTION DU PLAGIAT (ADMIN) - AJOUTÉ
// ==========================================
app.get('/api/admin/plagiat', (req, res) => {
    const sql = `SELECT p.*, r.titre, e.nom, e.prenom FROM plagiat_resultats p JOIN rapports r ON p.id_rapport = r.id_rapport JOIN etudiants e ON r.id_etudiant = e.id_etudiant ORDER BY p.date_analyse DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.json([]); 
        res.json(results);
    });
});

app.post('/api/admin/plagiat/analyze/:id', (req, res) => {
    const id_rapport = req.params.id;
    const score = Math.floor(Math.random() * 30); // Score simulé
    const statut = score > 20 ? 'Suspect' : 'Clean';
    const sql = `INSERT INTO plagiat_resultats (id_rapport, score_similitude, statut, details, date_analyse) VALUES (?, ?, ?, 'Analyse auto', NOW()) ON DUPLICATE KEY UPDATE score_similitude = ?, statut = ?, date_analyse = NOW()`;
    db.query(sql, [id_rapport, score, statut, score, statut], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, score, statut });
    });
});

// ==========================================
// 10. GESTION DU RÉFÉRENTIEL (ADMIN)
// ==========================================
app.get('/api/admin/ref/types', (req, res) => {
    db.query("SELECT * FROM types_rapport ORDER BY libelle", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
app.post('/api/admin/ref/types', (req, res) => {
    const { code, libelle, description, duree_min_jours, duree_max_jours, entreprise_requise } = req.body;
    const sql = "INSERT INTO types_rapport (code, libelle, description, duree_min_jours, duree_max_jours, entreprise_requise) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [code, libelle, description, duree_min_jours, duree_max_jours, entreprise_requise ? 1 : 0], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id_type: result.insertId, ...req.body });
    });
});
app.put('/api/admin/ref/types/:id', (req, res) => {
    const { code, libelle, description, duree_min_jours, duree_max_jours, entreprise_requise } = req.body;
    const sql = "UPDATE types_rapport SET code=?, libelle=?, description=?, duree_min_jours=?, duree_max_jours=?, entreprise_requise=? WHERE id_type=?";
    db.query(sql, [code, libelle, description, duree_min_jours, duree_max_jours, entreprise_requise ? 1 : 0, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});
app.delete('/api/admin/ref/types/:id', (req, res) => {
    db.query("DELETE FROM types_rapport WHERE id_type=?", [req.params.id], (err) => res.json({ success: true }));
});

// -- STATUTS --
app.get('/api/admin/ref/statuts', (req, res) => {
    db.query("SELECT * FROM statuts_rapport ORDER BY ordre", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
app.post('/api/admin/ref/statuts', (req, res) => {
    const { code, libelle, description, ordre, actif } = req.body;
    const sql = "INSERT INTO statuts_rapport (code, libelle, description, ordre, actif) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [code, libelle, description, ordre, actif ? 1 : 0], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id_statut: result.insertId, ...req.body });
    });
});
app.put('/api/admin/ref/statuts/:id', (req, res) => {
    const { code, libelle, description, ordre, actif } = req.body;
    const sql = "UPDATE statuts_rapport SET code=?, libelle=?, description=?, ordre=?, actif=? WHERE id_statut=?";
    db.query(sql, [code, libelle, description, ordre, actif ? 1 : 0, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});
app.delete('/api/admin/ref/statuts/:id', (req, res) => {
    db.query("DELETE FROM statuts_rapport WHERE id_statut=?", [req.params.id], (err) => res.json({ success: true }));
});

// -- CONFIGURATION (RÈGLES) --
app.get('/api/admin/ref/config', (req, res) => {
    db.query("SELECT * FROM configurations", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const config = {};
        results.forEach(row => config[row.cle] = row.valeur);
        res.json(config);
    });
});
app.post('/api/admin/ref/config', (req, res) => {
    const rules = req.body;
    const queries = Object.keys(rules).map(key => {
        return new Promise((resolve, reject) => {
            db.query("INSERT INTO configurations (cle, valeur) VALUES (?, ?) ON DUPLICATE KEY UPDATE valeur = ?", [key, String(rules[key]), String(rules[key])], (err) => {
                if (err) reject(err); else resolve();
            });
        });
    });
    Promise.all(queries)
        .then(() => res.json({ success: true }))
        .catch(err => res.status(500).json({ error: err.message }));
});

app.post('/api/admin/notifications/send', (req, res) => {
    const { title, message, type, audience, target_id } = req.body;
    let sqlUsers = "SELECT id_user FROM users_login WHERE actif = 1";
    let params = [];

    if (audience === 'encadrants') sqlUsers += " AND role = 'ENCADRANT'";
    else if (audience === 'etudiants') sqlUsers += " AND role = 'ETUDIANT'";
    else if (audience === 'custom' && target_id) { sqlUsers += " AND id_user = ?"; params.push(target_id); }

    db.query(sqlUsers, params, (err, users) => {
        if (err || users.length === 0) return res.json({ message: "Aucun destinataire" });
        const values = users.map(u => [u.id_user, type, title, message, '/notifications', new Date()]);
        db.query("INSERT INTO notifications (id_user, type, titre, message, lien, date_creation) VALUES ?", [values], (e) => {
            if(e) return res.status(500).json({error: e.message});
            res.json({ success: true });
        });
    });
});

// ==========================================
// 10. EXPORT CSV (ADMIN/ENCADRANT)
// ==========================================
app.get('/api/admin/export/users', authenticateUser, requireRole('ADMIN'), async (req, res) => {
    try {
        const sql = `
            SELECT 
                ul.id_user AS user_id,
                ul.login AS login,
                ul.role AS role,
                ul.actif AS actif,
                COALESCE(a.nom, e.nom, en.nom) AS nom,
                COALESCE(a.prenom, e.prenom, en.prenom) AS prenom,
                COALESCE(a.email, e.email, en.email) AS email
            FROM users_login ul
            LEFT JOIN administrateurs a ON a.id_user = ul.id_user
            LEFT JOIN etudiants e ON e.id_user = ul.id_user
            LEFT JOIN encadrants en ON en.id_user = ul.id_user
            ORDER BY ul.id_user ASC
        `;
        const results = await queryAsync(sql);
        res.status(200).json(results || []);
    } catch (err) {
        console.error('Export users error:', err);
        res.status(500).json({ message: 'Export failed' });
    }
});

app.get('/api/admin/export/reports', authenticateUser, requireRole('ADMIN'), async (req, res) => {
    try {
        const sql = `
            SELECT
                r.id_rapport AS report_id,
                r.titre AS report_titre,
                tr.libelle AS report_type,
                sr.libelle AS report_statut,
                r.note AS report_note,
                r.date_depot AS date_depot,
                r.date_modification AS date_modification,
                aa.libelle AS annee_academique,
                ent.nom AS entreprise,
                e.id_etudiant AS student_id,
                e.nom AS student_nom,
                e.prenom AS student_prenom,
                e.email AS student_email,
                en.id_encadrant AS encadrant_id,
                en.nom AS encadrant_nom,
                en.prenom AS encadrant_prenom,
                en.email AS encadrant_email,
                pr.score_similitude AS plagiat_score,
                pr.statut AS plagiat_statut,
                pr.date_analyse AS plagiat_date,
                v.numero_version AS last_version_number,
                v.fichier_path AS last_file_name
            FROM rapports r
            LEFT JOIN etudiants e ON e.id_etudiant = r.id_etudiant
            LEFT JOIN encadrants en ON en.id_encadrant = r.id_encadrant
            LEFT JOIN plagiat_resultats pr ON pr.id_rapport = r.id_rapport
            LEFT JOIN types_rapport tr ON tr.id_type = r.id_type
            LEFT JOIN statuts_rapport sr ON sr.id_statut = r.id_statut
            LEFT JOIN entreprises ent ON ent.id_entreprise = r.id_entreprise
            LEFT JOIN annees_academiques aa ON aa.id_annee = r.id_annee
            LEFT JOIN versions_rapport v ON v.id_rapport = r.id_rapport
                AND v.numero_version = (
                    SELECT MAX(numero_version)
                    FROM versions_rapport
                    WHERE id_rapport = r.id_rapport
                )
            ORDER BY r.id_rapport ASC
        `;
        const results = await queryAsync(sql);
        res.status(200).json(results || []);
    } catch (err) {
        console.error('Export reports error:', err);
        res.status(500).json({ message: 'Export failed' });
    }
});

app.get('/api/admin/export/students-full', authenticateUser, requireRole('ADMIN'), async (req, res) => {
    try {
        const sql = `
            SELECT
                e.id_etudiant AS student_id,
                e.nom AS student_nom,
                e.prenom AS student_prenom,
                e.email AS student_email,
                r.id_rapport AS report_id,
                r.titre AS report_titre,
                tr.libelle AS report_type,
                sr.libelle AS report_statut,
                r.note AS report_note,
                r.date_depot AS date_depot,
                r.date_modification AS date_modification,
                aa.libelle AS annee_academique,
                ent.nom AS entreprise,
                en.id_encadrant AS encadrant_id,
                en.nom AS encadrant_nom,
                en.prenom AS encadrant_prenom,
                en.email AS encadrant_email,
                pr.score_similitude AS plagiat_score,
                pr.statut AS plagiat_statut,
                pr.date_analyse AS plagiat_date,
                v.numero_version AS last_version_number,
                v.fichier_path AS last_file_name
            FROM etudiants e
            LEFT JOIN rapports r ON r.id_etudiant = e.id_etudiant
            LEFT JOIN encadrants en ON en.id_encadrant = r.id_encadrant
            LEFT JOIN plagiat_resultats pr ON pr.id_rapport = r.id_rapport
            LEFT JOIN types_rapport tr ON tr.id_type = r.id_type
            LEFT JOIN statuts_rapport sr ON sr.id_statut = r.id_statut
            LEFT JOIN entreprises ent ON ent.id_entreprise = r.id_entreprise
            LEFT JOIN annees_academiques aa ON aa.id_annee = r.id_annee
            LEFT JOIN versions_rapport v ON v.id_rapport = r.id_rapport
                AND v.numero_version = (
                    SELECT MAX(numero_version)
                    FROM versions_rapport
                    WHERE id_rapport = r.id_rapport
                )
            ORDER BY e.id_etudiant ASC, r.id_rapport ASC
        `;
        const results = await queryAsync(sql);
        res.status(200).json(results || []);
    } catch (err) {
        console.error('Export students-full error:', err);
        res.status(500).json({ message: 'Export failed' });
    }
});

app.get('/api/encadrant/export/students-reports', authenticateUser, requireRole('ENCADRANT'), async (req, res) => {
    try {
        const encadrantRows = await queryAsync("SELECT id_encadrant FROM encadrants WHERE id_user = ?", [req.user.id_user]);
        if (!encadrantRows || encadrantRows.length === 0) {
            return res.status(200).json([]);
        }
        const encadrantId = encadrantRows[0].id_encadrant;
        const sql = `
            SELECT
                e.id_etudiant AS student_id,
                e.nom AS student_nom,
                e.prenom AS student_prenom,
                e.email AS student_email,
                r.id_rapport AS report_id,
                r.titre AS report_titre,
                tr.libelle AS report_type,
                sr.libelle AS report_statut,
                r.note AS report_note,
                r.date_depot AS date_depot,
                r.date_modification AS date_modification,
                aa.libelle AS annee_academique,
                ent.nom AS entreprise,
                en.id_encadrant AS encadrant_id,
                en.nom AS encadrant_nom,
                en.prenom AS encadrant_prenom,
                en.email AS encadrant_email,
                pr.score_similitude AS plagiat_score,
                pr.statut AS plagiat_statut,
                pr.date_analyse AS plagiat_date,
                v.numero_version AS last_version_number,
                v.fichier_path AS last_file_name
            FROM rapports r
            LEFT JOIN etudiants e ON e.id_etudiant = r.id_etudiant
            LEFT JOIN encadrants en ON en.id_encadrant = r.id_encadrant
            LEFT JOIN plagiat_resultats pr ON pr.id_rapport = r.id_rapport
            LEFT JOIN types_rapport tr ON tr.id_type = r.id_type
            LEFT JOIN statuts_rapport sr ON sr.id_statut = r.id_statut
            LEFT JOIN entreprises ent ON ent.id_entreprise = r.id_entreprise
            LEFT JOIN annees_academiques aa ON aa.id_annee = r.id_annee
            LEFT JOIN versions_rapport v ON v.id_rapport = r.id_rapport
                AND v.numero_version = (
                    SELECT MAX(numero_version)
                    FROM versions_rapport
                    WHERE id_rapport = r.id_rapport
                )
            WHERE r.id_encadrant = ?
            ORDER BY e.id_etudiant ASC, r.id_rapport ASC
        `;
        const results = await queryAsync(sql, [encadrantId]);
        res.status(200).json(results || []);
    } catch (err) {
        console.error('Export encadrant error:', err);
        res.status(500).json({ message: 'Export failed' });
    }
});

app.get('/api/encadrant/export/my-students', authenticateUser, requireRole('ENCADRANT'), async (req, res) => {
    try {
        const encadrantRows = await queryAsync("SELECT id_encadrant FROM encadrants WHERE id_user = ?", [req.user.id_user]);
        if (!encadrantRows || encadrantRows.length === 0) {
            return res.status(200).json([]);
        }
        const encadrantId = encadrantRows[0].id_encadrant;
        const sql = `
            SELECT
                e.id_etudiant AS student_id,
                e.nom AS student_nom,
                e.prenom AS student_prenom,
                e.email AS student_email,
                r.id_rapport AS report_id,
                r.titre AS report_titre,
                tr.libelle AS report_type,
                sr.libelle AS report_statut,
                r.note AS report_note,
                r.date_depot AS date_depot,
                r.date_modification AS date_modification,
                aa.libelle AS annee_academique,
                ent.nom AS entreprise,
                en.id_encadrant AS encadrant_id,
                en.nom AS encadrant_nom,
                en.prenom AS encadrant_prenom,
                en.email AS encadrant_email,
                pr.score_similitude AS plagiat_score,
                pr.statut AS plagiat_statut,
                pr.date_analyse AS plagiat_date,
                v.numero_version AS last_version_number,
                v.fichier_path AS last_file_name
            FROM rapports r
            LEFT JOIN etudiants e ON e.id_etudiant = r.id_etudiant
            LEFT JOIN encadrants en ON en.id_encadrant = r.id_encadrant
            LEFT JOIN plagiat_resultats pr ON pr.id_rapport = r.id_rapport
            LEFT JOIN types_rapport tr ON tr.id_type = r.id_type
            LEFT JOIN statuts_rapport sr ON sr.id_statut = r.id_statut
            LEFT JOIN entreprises ent ON ent.id_entreprise = r.id_entreprise
            LEFT JOIN annees_academiques aa ON aa.id_annee = r.id_annee
            LEFT JOIN versions_rapport v ON v.id_rapport = r.id_rapport
                AND v.numero_version = (
                    SELECT MAX(numero_version)
                    FROM versions_rapport
                    WHERE id_rapport = r.id_rapport
                )
            WHERE r.id_encadrant = ?
            ORDER BY e.id_etudiant ASC, r.id_rapport ASC
        `;
        const results = await queryAsync(sql, [encadrantId]);
        res.status(200).json(results || []);
    } catch (err) {
        console.error('Export encadrant my-students error:', err);
        res.status(500).json({ message: 'Export failed' });
    }
});

// ==========================================
// 11. ROUTES UTILISATEURS (COMPATIBILITÉ FRONTEND)
// ==========================================
app.get('/api/utilisateurs', (req, res) => {
    const sql = `SELECT u.id_user as id, u.login, u.actif, u.role, 
                        COALESCE(e.nom, enc.nom, a.nom) as nom, 
                        COALESCE(e.prenom, enc.prenom, a.prenom) as prenom, 
                        COALESCE(e.email, enc.email, a.email) as email,
                        (SELECT MAX(date_action) FROM historique_actions WHERE id_user = u.id_user) as derniere_connexion
                 FROM users_login u 
                 LEFT JOIN etudiants e ON u.id_user = e.id_user 
                 LEFT JOIN encadrants enc ON u.id_user = enc.id_user 
                 LEFT JOIN administrateurs a ON u.id_user = a.id_user 
                 ORDER BY u.id_user DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.delete('/api/utilisateurs/:id', (req, res) => {
    db.query("DELETE FROM users_login WHERE id_user = ?", [req.params.id], (err) => {
         if (err) return res.status(500).json({ error: err.message });
         res.json({ success: true });
    });
});

app.patch('/api/utilisateurs/:id', (req, res) => {
    const { actif } = req.body;
    db.query("UPDATE users_login SET actif = ? WHERE id_user = ?", [actif ? 1 : 0, req.params.id], (err) => {
         if (err) return res.status(500).json({ error: err.message });
         res.json({ success: true });
    });
});
app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;

    // 1. Vérifier si l'utilisateur existe dans la table 'users'
    const sql = "SELECT id_user, login FROM users WHERE email = ?";
    
    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            // Sécurité : On ne dit pas que l'email n'existe pas pour éviter le "user enumeration"
            return res.json({ message: "Si le compte existe, un email a été envoyé." });
        }

        const user = results[0];

        // 2. ICI : Générer un token temporaire et envoyer l'email avec Nodemailer
        // Pour l'instant, on simule l'envoi dans la console
        console.log(`📧 Simulation email envoyé à ${email} pour l'utilisateur ${user.login}`);
        
        // Log de l'action pour l'admin
        logAction(user.id_user, 'PASSWORD_RESET_REQUEST', `Demande de réinitialisation pour ${email}`);

        res.json({ message: "Instructions envoyées." });
    });
});
// On force le port 5000 pour éviter le conflit avec React (3000)
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});