const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Laissez vide sous XAMPP
    database: 'gestion_pfe_ensa' // <--- C'EST LEchangement CRUCIAL
});

connection.connect(error => {
    if (error) throw error;
    console.log("✅ Connecté à la base : gestion_pfe_ensa");
});

module.exports = connection;