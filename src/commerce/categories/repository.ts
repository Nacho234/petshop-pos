import { prisma } from "@/shared/lib/prisma";
import { BaseRepository } from "@/shared/lib/repository/base-repository";

// Acceso a datos de categorías. Toda consulta pasa por `scope()`/`withOrg()`
// para garantizar el aislamiento por tenant. Las mutaciones usan updateMany/
// deleteMany (con el filtro de tenant) porque Prisma exige un where único en
// update/delete, y el organizationId no forma parte de esa clave.
export class CategoryRepository extends BaseRepository {
  list() {
    return prisma.category.findMany({
      where: this.scope(),
      orderBy: { name: "asc" },
    });
  }

  findById(id: string) {
    return prisma.category.findFirst({ where: this.scope({ id }) });
  }

  create(data: { name: string }) {
    return prisma.category.create({ data: this.withOrg(data) });
  }

  async update(id: string, data: { name: string }) {
    const res = await prisma.category.updateMany({
      where: this.scope({ id }),
      data,
    });
    return res.count > 0 ? this.findById(id) : null;
  }

  async remove(id: string) {
    const res = await prisma.category.deleteMany({ where: this.scope({ id }) });
    return res.count > 0;
  }

  countProducts(id: string) {
    return prisma.product.count({ where: this.scope({ categoryId: id }) });
  }
}
