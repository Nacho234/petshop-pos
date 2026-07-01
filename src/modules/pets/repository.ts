import { prisma } from "@/shared/lib/prisma";
import { BaseRepository } from "@/shared/lib/repository/base-repository";

export type PetData = {
  name: string;
  species: string | null;
  breed: string | null;
  birthdate: Date | null;
  notes: string | null;
};

export class PetRepository extends BaseRepository {
  // Verifica que el cliente sea del tenant antes de crear la mascota.
  private customerInTenant(customerId: string) {
    return prisma.customer.findFirst({ where: this.scope({ id: customerId }) });
  }

  async create(customerId: string, data: PetData) {
    const customer = await this.customerInTenant(customerId);
    if (!customer) throw new Error("Cliente no encontrado");
    return prisma.pet.create({
      data: { ...data, customerId, organizationId: this.organizationId },
    });
  }

  async update(id: string, data: PetData) {
    const res = await prisma.pet.updateMany({ where: this.scope({ id }), data });
    return res.count > 0;
  }

  async remove(id: string) {
    const res = await prisma.pet.deleteMany({ where: this.scope({ id }) });
    return res.count > 0;
  }
}
