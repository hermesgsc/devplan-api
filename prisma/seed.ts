// prisma/seed.ts
import { prisma } from "../src/prisma";
import argon2 from "argon2";

async function main() {
  const hashedPassword = await argon2.hash("123456");
  await prisma.user.create({
    data: {
      name: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin criado com sucesso!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
