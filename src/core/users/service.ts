import type { User } from "@prisma/client";

import { auth } from "@/core/auth/auth";
import { getTenantId } from "@/core/organizations/tenant-context";
import { prisma } from "@/shared/lib/prisma";
import { UserRepository } from "./repository";
import { createUserSchema, type CreateUserInput, type Role, type UserDTO } from "./schemas";

function toDTO(u: User): UserDTO {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
  };
}

export async function listUsers(): Promise<UserDTO[]> {
  const repo = new UserRepository(await getTenantId());
  const rows = await repo.list();
  return rows.map(toDTO);
}

// Crea un usuario con contraseña (mismo mecanismo que el seed: hash de Better
// Auth + Account providerId "credential"). No pasa por el signup público.
export async function createUser(input: CreateUserInput): Promise<UserDTO> {
  const parsed = createUserSchema.parse(input);
  const orgId = await getTenantId();

  const repo = new UserRepository(orgId);
  const existing = await repo.findByEmail(parsed.email);
  if (existing) throw new Error("Ya existe un usuario con ese email.");

  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash(parsed.password);

  const user = await prisma.user.create({
    data: {
      name: parsed.name.trim(),
      email: parsed.email,
      emailVerified: true,
      role: parsed.role,
      organizationId: orgId,
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: passwordHash,
    },
  });

  return toDTO(user);
}

export async function setUserActive(
  id: string,
  active: boolean,
  currentUserId: string
): Promise<void> {
  if (id === currentUserId && !active) {
    throw new Error("No podés desactivar tu propio usuario.");
  }
  const repo = new UserRepository(await getTenantId());
  const count = await repo.setActive(id, active);
  if (count === 0) throw new Error("Usuario no encontrado.");
}
