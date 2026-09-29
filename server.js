const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = process.env.PORT || 3002;

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'student_records',
  port: 3306
});

function normalizeRecord(record = {}) {
  return {
    id: String(record.id ?? '').trim(),
    name: String(record.name ?? '').trim(),
    department: String(record.department ?? '').trim(),
    program: String(record.program ?? '').trim(),
    status: String(record.status ?? 'Active').trim() || 'Active',
    year: String(record.year ?? '2024').trim(),
    email: String(record.email ?? '').trim(),
    phone: String(record.phone ?? '').trim()
  };
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/api/records', (req, res) => {
  db.query('SELECT * FROM students ORDER BY name ASC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows.map((row) => normalizeRecord(row)));
  });
});

app.post('/api/records', (req, res) => {
  const record = normalizeRecord(req.body);

  if (!record.id || !record.name || !record.department || !record.program || !record.email) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  db.query('SELECT id FROM students WHERE id = ?', [record.id], (findErr, existingRows) => {
    if (findErr) {
      return res.status(500).json({ error: findErr.message });
    }

    if (existingRows.length > 0) {
      return res.status(409).json({ error: 'Student ID already exists.' });
    }

    db.query(
      'INSERT INTO students (id, name, department, program, status, year, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [record.id, record.name, record.department, record.program, record.status, record.year, record.email, record.phone],
      (insertErr) => {
        if (insertErr) {
          return res.status(500).json({ error: insertErr.message });
        }

        res.status(201).json({ ...record, id: record.id });
      }
    );
  });
});

app.put('/api/records/:id', (req, res) => {
  const record = normalizeRecord(req.body);

  if (!record.name || !record.department || !record.program || !record.email) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  db.query(
    'UPDATE students SET name = ?, department = ?, program = ?, status = ?, year = ?, email = ?, phone = ? WHERE id = ?',
    [record.name, record.department, record.program, record.status, record.year, record.email, record.phone, req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Record not found.' });
      }

      res.json({ ...record, id: req.params.id });
    }
  );
});

app.delete('/api/records/:id', (req, res) => {
  db.query('DELETE FROM students WHERE id = ?', [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    res.json({ success: true, id: req.params.id });
  });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  }

  console.log('Connected to MySQL database: student_records');
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
