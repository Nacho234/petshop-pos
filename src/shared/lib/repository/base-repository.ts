// ---------------------------------------------------------------------------
// BaseRepository — límite de aislamiento multi-tenant.
//
// Todo repositorio de una entidad de negocio extiende esta clase y usa
// `scope()` / `withOrg()` en CADA consulta. Así el `organizationId` nunca se
// olvida y el filtrado por tenant es consistente en todo el sistema.
//
//   class ProductRepository extends BaseRepository {
//     list() { return prisma.product.findMany({ where: this.scope() }); }
//     create(data) { return prisma.product.create({ data: this.withOrg(data) }); }
//   }
// ---------------------------------------------------------------------------

export abstract class BaseRepository {
  constructor(protected readonly organizationId: string) {}

  /** Inyecta el tenant en un `where` de Prisma. */
  protected scope<T extends object>(
    where?: T
  ): T & { organizationId: string } {
    return { ...(where ?? ({} as T)), organizationId: this.organizationId };
  }

  /** Inyecta el tenant en un `data` de creación. */
  protected withOrg<T extends object>(
    data: T
  ): T & { organizationId: string } {
    return { ...data, organizationId: this.organizationId };
  }
}
