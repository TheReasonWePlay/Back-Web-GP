import pool from '../../config/db';

export type UserRow = {
  id: number;
  email: string;
  nom_utilisateur: string;
  mot_de_passe: string;
  role: 'admin' | 'manager' | 'employe';
  matricule?: string | null;
};

// recherche par nom_utilisateur ou email
export const findByUsernameOrEmail = async (usernameOrEmail: string): Promise<UserRow | null> => {
  const [rows] = await pool.query(
    'SELECT id, email, nom_utilisateur, mot_de_passe, role, matricule FROM login WHERE nom_utilisateur = ? OR email = ? LIMIT 1',
    [usernameOrEmail, usernameOrEmail]
  );
  const result = (rows as UserRow[])[0];
  return result ?? null;
};
