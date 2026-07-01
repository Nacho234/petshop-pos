import type { Prisma } from "@prisma/client";

import { prisma } from "@/shared/lib/prisma";
import { BaseRepository } from "@/shared/lib/repository/base-repository";
import type { CustomerListParams } from "./schemas";

const DETAIL_INCLUDE = {
  pets: { orderBy: { name: "asc" } },
  _count: { select: { pets: true } },
} satisfies Prisma.CustomerInclude;

export type CustomerDetailRow = Prisma.CustomerGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

export type CustomerData = {
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export class CustomerRepository extends BaseRepository {
  async list(params: CustomerListParams) {
    const { q, page, pageSize } = params;
    const where: Prisma.CustomerWhereInput = this.scope();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { _count: { select: { pets: true } } },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.customer.findFirst({
      where: this.scope({ id }),
      include: DETAIL_INCLUDE,
    });
  }

  create(data: CustomerData) {
    return prisma.customer.create({
      data: this.withOrg(data),
      include: DETAIL_INCLUDE,
    });
  }

  async update(id: string, data: CustomerData) {
    const res = await prisma.customer.updateMany({ where: this.scope({ id }), data });
    return res.count > 0 ? this.findById(id) : null;
  }

  async remove(id: string) {
    const res = await prisma.customer.deleteMany({ where: this.scope({ id }) });
    return res.count > 0;
  }
}
