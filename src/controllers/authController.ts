import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import argon2 from "argon2";
import { signAccessToken, signRefreshToken, verifyToken } from "../services/jwt.js";

// REGISTER
export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email e senha obrigatórios" });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ error: "Usuário já existe" });

  const hashedPassword = await argon2.hash(password);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  const accessToken = await signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await signRefreshToken({ sub: user.id });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

  const valid = await argon2.verify(user.password, password);
  if (!valid) return res.status(401).json({ error: "Credenciais inválidas" });

  const accessToken = await signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await signRefreshToken({ sub: user.id });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });

  res.json({ accessToken, refreshToken });
};

// REFRESH
export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });

  const tokenRow = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!tokenRow || tokenRow.revoked)
    return res.status(401).json({ error: "Token inválido" });

  try {
    const payload = await verifyToken(refreshToken);
    const userId = (payload as any).sub;

    const accessToken = await signAccessToken({ sub: userId });
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: "Token inválido" });
  }
};

// LOGOUT
export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).send();

  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revoked: true },
  });

  res.status(204).send();
};

// UPDATE USER
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (password) data.password = await argon2.hash(password);

    if (role) {
      if (req.user?.role !== "ADMIN")
        return res.status(403).json({ error: "Somente admins podem alterar a role" });
      data.role = role;
    }

    const updatedUser = await prisma.user.update({ where: { id }, data });

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (err: any) {
    if (err.code === "P2002" && err.meta?.target?.includes("email")) {
      return res.status(400).json({ error: "Email já está em uso" });
    }
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
};

// DELETE USER
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // Deleta relacionamentos primeiro
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
    await prisma.userProgress.deleteMany({ where: { userId: id } });

    // Deleta o usuário
    await prisma.user.delete({ where: { id } });

    res.json({ message: "Usuário deletado com sucesso" });
  } catch (err: any) {
    console.error("Erro ao deletar usuário:", err);
    res.status(500).json({ error: "Erro ao deletar usuário", err });
  }
};
