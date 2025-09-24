import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/jwt";

/**
 * Middleware para autenticar usuário via JWT
 * Popula req.user com { id, role }
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token inválido" });

  try {
    const payload = await verifyToken(token);

    // req.user existe no tipo global
    req.user = {
      id: (payload as any).sub,
      role: (payload as any).role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

/**
 * Middleware para checar se o usuário é ADMIN
 */
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Acesso negado" });
  }
  next();
};
