"use client";

import { useState } from "react";
import { PencilSimpleIcon, PlusIcon, TrashIcon, PawPrintIcon } from "@phosphor-icons/react";

import { Badge, Button, Field, Input, Modal } from "@/components/ui";
import { useCustomer } from "../hooks";
import type { PetDTO } from "../schemas";
import { useCreatePet, useDeletePet, useUpdatePet } from "@/modules/pets/hooks";

type PetForm = { name: string; species: string; breed: string; birthdate: string; notes: string };
const emptyPet: PetForm = { name: "", species: "", breed: "", birthdate: "", notes: "" };

export function CustomerDetailModal({
  customerId,
  onClose,
  onEdit,
}: {
  customerId: string | null;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { data: customer, isLoading } = useCustomer(customerId);
  const createPet = useCreatePet();
  const updatePet = useUpdatePet();
  const deletePet = useDeletePet();

  const [editingPet, setEditingPet] = useState<PetDTO | null>(null);
  const [showPetForm, setShowPetForm] = useState(false);
  const [form, setForm] = useState<PetForm>(emptyPet);
  const [error, setError] = useState<string | null>(null);

  function startAdd() {
    setEditingPet(null);
    setForm(emptyPet);
    setShowPetForm(true);
  }
  function startEdit(p: PetDTO) {
    setEditingPet(p);
    setForm({
      name: p.name,
      species: p.species ?? "",
      breed: p.breed ?? "",
      birthdate: p.birthdate ? p.birthdate.slice(0, 10) : "",
      notes: p.notes ?? "",
    });
    setShowPetForm(true);
  }

  async function savePet() {
    if (!customerId) return;
    setError(null);
    const input = { customerId, ...form };
    try {
      if (editingPet) await updatePet.mutateAsync({ id: editingPet.id, input });
      else await createPet.mutateAsync(input);
      setShowPetForm(false);
      setForm(emptyPet);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la mascota.");
    }
  }

  return (
    <Modal open={!!customerId} onClose={onClose} title={customer?.name ?? "Cliente"} size="lg">
      {isLoading || !customer ? (
        <p className="py-8 text-center text-sm text-fg-muted">Cargando…</p>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Datos del cliente */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 text-sm">
              {customer.phone && <p className="text-fg">📞 {customer.phone}</p>}
              {customer.email && <p className="text-fg">✉️ {customer.email}</p>}
              {customer.notes && <p className="text-fg-muted">{customer.notes}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="accent">{customer.points} pts</Badge>
              <Button variant="secondary" size="sm" onClick={onEdit}>
                <PencilSimpleIcon size={16} /> Editar
              </Button>
            </div>
          </div>

          {/* Mascotas */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                <PawPrintIcon size={18} weight="fill" /> Mascotas
              </h3>
              {!showPetForm && (
                <Button variant="ghost" size="sm" onClick={startAdd}>
                  <PlusIcon size={16} /> Agregar
                </Button>
              )}
            </div>

            {customer.pets.length === 0 && !showPetForm && (
              <p className="rounded-lg border border-dashed border-border-strong px-3 py-4 text-center text-sm text-fg-subtle">
                Sin mascotas cargadas
              </p>
            )}

            <ul className="flex flex-col gap-1">
              {customer.pets.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-fg">{p.name}</p>
                    <p className="truncate text-xs text-fg-subtle">
                      {[p.species, p.breed].filter(Boolean).join(" · ")}
                      {p.birthdate ? ` · 🎂 ${p.birthdate.slice(0, 10)}` : ""}
                    </p>
                  </div>
                  <button
                    aria-label={`Editar ${p.name}`}
                    className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
                    onClick={() => startEdit(p)}
                  >
                    <PencilSimpleIcon size={16} />
                  </button>
                  <button
                    aria-label={`Eliminar ${p.name}`}
                    className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-danger-soft hover:text-danger"
                    onClick={() => deletePet.mutate(p.id)}
                  >
                    <TrashIcon size={16} />
                  </button>
                </li>
              ))}
            </ul>

            {/* Form de mascota */}
            {showPetForm && (
              <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nombre" htmlFor="pet-name" required>
                    <Input id="pet-name" className="h-10" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
                  </Field>
                  <Field label="Especie" htmlFor="pet-species">
                    <Input id="pet-species" className="h-10" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} placeholder="Perro, gato…" />
                  </Field>
                  <Field label="Raza" htmlFor="pet-breed">
                    <Input id="pet-breed" className="h-10" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
                  </Field>
                  <Field label="Nacimiento" htmlFor="pet-bd" hint="Para el cumpleaños">
                    <Input id="pet-bd" type="date" className="h-10" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} />
                  </Field>
                </div>
                {error && <p className="text-xs font-medium text-danger">{error}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowPetForm(false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={savePet}
                    disabled={!form.name.trim() || createPet.isPending || updatePet.isPending}
                  >
                    {editingPet ? "Guardar" : "Agregar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
