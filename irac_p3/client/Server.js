const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;



// Ruta para servir la página de login
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'Website', 'index.html'));
});

// Ruta protegida para servir el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Website', 'login.html'));
});


app.listen(PORT, () => {
    console.log(`Frontend server running at http://localhost:${PORT}`);
});
