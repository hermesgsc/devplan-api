declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "USER" | "ADMIN";
      };
    }
  }
}
export {};