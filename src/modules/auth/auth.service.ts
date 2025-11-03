import bcrypt from 'bcrypt';
import * as Model from './auth.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';

export const login = async (usernameOrEmail: string, password: string) => {
  const user = await Model.findByUsernameOrEmail(usernameOrEmail);
  if (!user) return null;

  // Compare password (assume DB stores bcrypt hash)
  const match = await bcrypt.compare(password, user.mot_de_passe);
  if (!match) return null;

  const payload = { userId: user.id, role: user.role, matricule: user.matricule };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // For production: persist refreshToken (hashed) in DB to allow revocation.
  return {
    user: {
      id: user.id,
      email: user.email,
      nom_utilisateur: user.nom_utilisateur,
      role: user.role,
      matricule: user.matricule
    },
    accessToken,
    refreshToken
  };
};

export const refreshToken = async (token: string) => {
  try {
    const payload = verifyRefreshToken(token) as any;
    if (!payload) return null;

    // Optionnel : vérifier en base que le refresh token est valide (non révoqué)

    const newAccessToken = signAccessToken({
      userId: payload.userId,
      role: payload.role,
      matricule: payload.matricule,
    });

    const newRefreshToken = signRefreshToken({
      userId: payload.userId,
      role: payload.role,
      matricule: payload.matricule,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (err) {
    return null;
  }
};

