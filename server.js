const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readDB() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = { users: [], requests: [] };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.post('/api/register', (req, res) => {
    const { name, email, password, role } = req.body;
    const db = readDB();
    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already registered!' });
    }
    const newUser = { id: Date.now().toString(), name, email, password, role: role || 'citizen' };
    db.users.push(newUser);
    writeDB(db);
    res.json({ message: 'Registration successful!', user: { id: newUser.id, name, email, role: newUser.role } });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password!' });
    }
    res.json({ message: 'Login successful!', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/requests', (req, res) => {
    const db = readDB();
    res.json(db.requests);
});

app.post('/api/requests', (req, res) => {
    const { citizenId, citizenName, category, location, description, image } = req.body;
    const db = readDB();
    const newRequest = {
        id: 'REQ-' + Math.floor(1000 + Math.random() * 9000),
        citizenId,
        citizenName,
        category,
        location,
        description,
        image: image || null,
        status: 'Pending',
        createdAt: new Date().toISOString()
    };
    db.requests.unshift(newRequest);
    writeDB(db);
    res.json({ message: 'Request submitted successfully!', request: newRequest });
});

app.patch('/api/requests/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = readDB();
    const request = db.requests.find(r => r.id === id);
    if (!request) {
        return res.status(404).json({ error: 'Request not found!' });
    }
    request.status = status;
    writeDB(db);
    res.json({ message: 'Status updated successfully!', request });
});

app.get('/api/analytics', (req, res) => {
    const db = readDB();
    const total = db.requests.length;
    const pending = db.requests.filter(r => r.status === 'Pending').length;
    const inProgress = db.requests.filter(r => r.status === 'In Progress').length;
    const resolved = db.requests.filter(r => r.status === 'Resolved').length;
    res.json({ total, pending, inProgress, resolved });
});

app.listen(PORT, () => {
    console.log(`Server running smoothly at http://localhost:${PORT}`);
});