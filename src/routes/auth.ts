import { Router, Request, Response } from "express";
import { register, login, refresh, logout, updateUser } from "../controllers/authController.js";
import { authenticate,  } from "../middlewares/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);

router.post("/logout", logout);

router.put("/update", authenticate, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Usuário não autenticado" });

  req.params.id = req.user.id; 
  await updateUser(req, res);
});

export default router;
