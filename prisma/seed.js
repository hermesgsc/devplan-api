"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// prisma/seed.ts
const prisma_1 = require("../src/prisma");
const argon2_1 = __importDefault(require("argon2"));
async function main() {
    const hashedPassword = await argon2_1.default.hash("123456");
    await prisma_1.prisma.user.create({
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
    .finally(async () => await prisma_1.prisma.$disconnect());
