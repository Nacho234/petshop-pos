import { prisma } from "@/shared/lib/prisma";
import { BaseRepository } from "@/shared/lib/repository/base-repository";

export class BrandRepository extends BaseRepository {
  list() {
    return prisma.brand.findMany({
      where: this.scope(),
      orderBy: { name: "asc" },
    });
  }

  findById(id: string) {
    return prisma.brand.findFirst({ where: this.scope({ id }) });
  }

  create(data: { name: string }) {
    return prisma.brand.create({ data: this.withOrg(data) });
  }

  async update(id: string, data: { name: string }) {
    const res = await prisma.brand.updateMany({ where: this.scope({ id }), data });
    return res.count > 0 ? this.findById(id) : null;
  }

  async remove(id: string) {
    const res = await prisma.brand.deleteMany({ where: this.scope({ id }) });
    return res.count > 0;
  }

  countProducts(id: string) {
    return prisma.product.count({ where: this.scope({ brandId: id }) });
  }
}
