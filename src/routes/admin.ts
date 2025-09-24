import { Router, Request, Response } from "express";
import { authenticate, authorizeAdmin } from "../middlewares/auth";
import { updateUser, deleteUser } from "../controllers/authController";
import { prisma } from "../prisma";

const router = Router();

// Listar todos os usuários
router.get("/users", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.json(users);
});

// Buscar usuário por ID
router.get("/users/:id", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  res.json(user);
});

// Atualizar e deletar usuários (admin)
router.put("/users/:id", authenticate, authorizeAdmin, updateUser);
router.delete("/users/:id", authenticate, authorizeAdmin, deleteUser);

export default router;
