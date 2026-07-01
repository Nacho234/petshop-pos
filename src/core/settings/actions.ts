"use server";

import { assertAccess } from "@/core/auth/session";
import * as service from "./service";
import type { SettingsInput } from "./schemas";

export async function getSettingsAction() {
  await assertAccess("settings");
  return service.getSettings();
}

export async function updateSettingsAction(input: SettingsInput) {
  await assertAccess("settings");
  return service.updateSettings(input);
}
