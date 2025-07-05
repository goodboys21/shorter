import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { customAlphabet } from 'nanoid';

const app = express();
const port = process.env.PORT || 3000;

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

app.use(express.json());

let db;
const init = async () => {
  db = await open({
    filename: './shorturl.db',
    driver: sqlite3.Database
  });

  await db.exec(\`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  \`);
};

app.post('/shorten', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const code = nanoid();
  await db.run('INSERT INTO links (code, url) VALUES (?, ?)', [code, url]);

  res.json({ short: req.protocol + '://' + req.get('host') + '/' + code });
});

app.get('/:code', async (req, res) => {
  const { code } = req.params;
  const result = await db.get('SELECT url FROM links WHERE code = ?', [code]);

  if (!result) return res.status(404).send('Short URL not found');

  res.redirect(result.url);
});

init().then(() => {
  app.listen(port, () => {
    console.log('Server listening on port ' + port);
  });
});
