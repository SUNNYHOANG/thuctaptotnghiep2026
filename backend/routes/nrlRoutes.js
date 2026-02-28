import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Đường dẫn tới thư mục gốc project, từ backend đi ra ngoài 1 cấp
const PROJECT_ROOT = path.resolve(process.cwd(), '..');
const STUDENTS_FILE = path.resolve(PROJECT_ROOT, 'data', 'students_merged.json');
const LOGS_FILE = path.resolve(PROJECT_ROOT, 'data', 'search_logs.json');

let cachedStudents = null;

function loadStudents() {
  if (cachedStudents) return cachedStudents;
  try {
    const raw = fs.readFileSync(STUDENTS_FILE, 'utf-8');
    cachedStudents = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load students_merged.json:', err.message);
    cachedStudents = {};
  }
  return cachedStudents;
}

function removeVietnameseDiacritics(text) {
  if (!text) return '';
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function hasDigit(text) {
  return /\d/.test(text);
}

function searchByMssv(query, data) {
  const q = query.trim().toUpperCase();
  const results = [];

  if (data[q]) {
    return [[q, data[q]]];
  }

  for (const mssv of Object.keys(data)) {
    if (mssv.toUpperCase().includes(q)) {
      results.push([mssv, data[mssv]]);
      if (results.length >= 10) break;
    }
  }

  return results;
}

function searchByName(query, data) {
  const qNorm = removeVietnameseDiacritics(query.trim());
  const results = [];

  for (const [mssv, student] of Object.entries(data)) {
    const info = student.info || {};
    const name = info.name || '';
    const nameNorm = removeVietnameseDiacritics(name);
    if (nameNorm.includes(qNorm)) {
      results.push([mssv, student]);
      if (results.length >= 10) break;
    }
  }

  return results;
}

function logSearch(query, resultCount) {
  const searchType = hasDigit(query) ? 'mssv' : 'name';
  const entry = {
    timestamp: new Date().toISOString(),
    query,
    result_count: resultCount,
    search_type: searchType,
  };

  let logs = [];
  try {
    if (fs.existsSync(LOGS_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    }
  } catch {
    logs = [];
  }

  logs.push(entry);

  try {
    fs.mkdirSync(path.dirname(LOGS_FILE), { recursive: true });
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write search_logs.json:', err.message);
  }
}

// GET /api/nrl/search?q=...
router.get('/search', (req, res) => {
  const q = (req.query.q || '').toString();
  if (!q.trim()) {
    return res.status(400).json({ message: 'Thiếu tham số q' });
  }

  const data = loadStudents();
  if (!data || Object.keys(data).length === 0) {
    return res.status(500).json({ message: 'Không đọc được dữ liệu NRL' });
  }

  const results = hasDigit(q) ? searchByMssv(q, data) : searchByName(q, data);
  logSearch(q, results.length);

  // Chuẩn hóa format trả về cho frontend
  const payload = results.map(([mssv, student]) => ({
    mssv,
    info: student.info || {},
    stats: student.stats || {},
    history: student.history || [],
  }));

  return res.json({ query: q, count: payload.length, results: payload });
});

export default router;


