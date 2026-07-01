import type { Prisma, User } from "@prisma/client";

import { prisma } from "@/shared/lib/prisma";
import { BaseRepository } from "@/shared/lib/repository/base-repository";

export class UserRepository extends BaseRepository {
  // Usuarios de la organización, más nuevos al final.
  list(): Promise<User[]> {
    return prisma.user.findMany({
      where: this.scope<Prisma.UserWhereInput>({}),
      orderBy: { createdAt: "asc" },
    });
  }

  // El email es único global; busca sin filtrar por tenant.
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  // Activa/desactiva un usuario del tenant. Devuelve cuántos se afectaron.
  async setActive(id: string, active: boolean): Promise<number> {
    const res = await prisma.user.updateMany({
      where: this.scope<Prisma.UserWhereInput>({ id }),
      data: { active },
    });
    return res.count;
  }
}
