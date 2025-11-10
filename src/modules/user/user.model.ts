// src/modules/user/user.model.ts
import db from '../../config/db';
import bcrypt from 'bcrypt';

export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  role: string;
}

export const UserModel = {
  async findAll(): Promise<User[]> {
    const [rows]: any = await db.query(`
      SELECT 
        id AS id,
        email AS email,
        nom_utilisateur AS username,
        role AS role
      FROM login
      ORDER BY id ASC
    `);
    return rows;
  },

  async findById(id: string): Promise<User | null> {
    const [rows]: any = await db.query(`
      SELECT 
        id AS id,
        email AS email,
        nom_utilisateur AS username,
        role AS role
      FROM login
      WHERE id = ?
    `, [id]);
    return rows[0] || null;
  },

  async create(data: User): Promise<string> {
    const { email, username, role, password} = data;
    const [result]: any = await db.query(
      `INSERT INTO login (email, nom_utilisateur, mot_de_passe, role)
       VALUES (?, ?, ?, ?)`,
      [email, username, password, role]
    );
    return String(result.insertId);
  },

  async update(id: string, data: Partial<User>): Promise<void> {
    const { email, username, role } = data;
    await db.query(
      `UPDATE login 
       SET email = ?, nom_utilisateur = ?, role = ?
       WHERE id = ?`,
      [email, username, role, id]
    );
  },

  async updatePwd(id: string, data: any): Promise<void> {
    const { oldPassword, newPassword } = data;

    // 1️⃣ Récupération du mot de passe actuel
    const [rows]: any = await db.query(
      `SELECT mot_de_passe FROM login WHERE id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      throw new Error('User not found');
    }

    const storedPassword = rows[0].mot_de_passe;

    // 2️⃣ Vérification de l’ancien mot de passe
    const isMatch = await bcrypt.compare(oldPassword, storedPassword);
    if (!isMatch) {
      throw new Error('Incorrect current password');
    }

    // 3️⃣ Hash du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4️⃣ Mise à jour
    await db.query(
      `UPDATE login SET mot_de_passe = ? WHERE id = ?`,
      [hashedPassword, id]
    );
  },

  async resetPwd(id: string, hashedPassword: string): Promise<void> {

    await db.query(
      `UPDATE login SET mot_de_passe = ? WHERE id = ?`,
      [hashedPassword, id]
    );
  },

  async delete(id: string): Promise<void> {
    await db.query(`DELETE FROM login WHERE id = ?`, [id]);
  },
};
