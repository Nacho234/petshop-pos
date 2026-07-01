import type { Settings } from "@prisma/client";

import { getTenantId } from "@/core/organizations/tenant-context";
import { prisma } from "@/shared/lib/prisma";
import { APP_CONFIG } from "@/shared/config/app";
import { settingsSchema, type SettingsDTO, type SettingsInput } from "./schemas";

const clean = (v?: string) => {
  const t = v?.trim();
  return t ? t : null;
};

function toDTO(row: Settings): SettingsDTO {
  return {
    businessName: row.businessName,
    legalName: row.legalName,
    taxId: row.taxId,
    address: row.address,
    phone: row.phone,
    currency: row.currency,
  };
}

// Ajustes del negocio (o valores por defecto si todavía no se guardaron).
export async function getSettings(): Promise<SettingsDTO> {
  const orgId = await getTenantId();
  const row = await prisma.settings.findUnique({ where: { organizationId: orgId } });
  if (row) return toDTO(row);
  return {
    businessName: APP_CONFIG.name,
    legalName: null,
    taxId: null,
    address: null,
    phone: null,
    currency: APP_CONFIG.defaultCurrency,
  };
}

export async function updateSettings(input: SettingsInput): Promise<SettingsDTO> {
  const parsed = settingsSchema.parse(input);
  const orgId = await getTenantId();

  const data = {
    businessName: parsed.businessName.trim(),
    legalName: clean(parsed.legalName),
    taxId: clean(parsed.taxId),
    address: clean(parsed.address),
    phone: clean(parsed.phone),
    currency: parsed.currency.trim() || "ARS",
  };

  const row = await prisma.settings.upsert({
    where: { organizationId: orgId },
    update: data,
    create: { organizationId: orgId, ...data },
  });
  return toDTO(row);
}
