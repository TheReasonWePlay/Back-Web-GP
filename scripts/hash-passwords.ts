// scripts/hash-passwords.ts
import pool from '../src/config/db';
import bcrypt from 'bcrypt';

async function run() {
  const saltRounds = 10;
  const [rows] = await pool.query('SELECT id, mot_de_passe FROM login');
  const users = rows as { id: number; mot_de_passe: string }[];

  for (const u of users) {
    // si mot_de_passe semble déjà être un hash (détect simple), skip
    if (u.mot_de_passe.startsWith('$2b$') || u.mot_de_passe.startsWith('$2a$')) {
      console.log('skip already hashed', u.id);
      continue;
    }
    const hashed = await bcrypt.hash(u.mot_de_passe, saltRounds);
    await pool.query('UPDATE login SET mot_de_passe = ? WHERE id = ?', [hashed, u.id]);
    console.log('updated', u.id);
  }
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
