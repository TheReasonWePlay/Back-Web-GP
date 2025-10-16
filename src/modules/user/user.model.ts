// src/modules/user/user.model.ts
import db from '../../config/db';

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
        mot_de_passe AS password,
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
        mot_de_passe AS password,
        role AS role
      FROM login
      WHERE id = ?
    `, [id]);
    return rows[0] || null;
  },

  async create(data: User): Promise<string> {
    const { email, username, password, role } = data;
    const [result]: any = await db.query(
      `INSERT INTO login (email, nom_utilisateur, mot_de_passe, role)
       VALUES (?, ?, ?, ?)`,
      [email, username, password, role]
    );
    return String(result.insertId);
  },

  async update(id: string, data: Partial<User>): Promise<void> {
    const { email, username, password, role } = data;
    await db.query(
      `UPDATE login 
       SET email = ?, nom_utilisateur = ?, mot_de_passe = ?, role = ?
       WHERE id = ?`,
      [email, username, password, role, id]
    );
  },

  async delete(id: string): Promise<void> {
    await db.query(`DELETE FROM login WHERE id = ?`, [id]);
  },
};
