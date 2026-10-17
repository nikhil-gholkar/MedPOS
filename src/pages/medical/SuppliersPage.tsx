import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  InputAdornment,
  Skeleton,
  TextField,
} from "@mui/material";
import { Add, Search, Phone, Edit, Delete, LocalShipping } from "@mui/icons-material";

import SupplierFormDialog from "../../features/suppliers/SupplierFormDialog";
import DeleteSupplierDialog from "../../features/suppliers/DeleteSupplierDialog";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "../../features/suppliers/supplierService";
import { useAppSelector } from "../../hooks/reduxHooks";

import PageHeader from "../../components/ui/PageHeader";

import type {
  CreateSupplierPayload,
  Supplier,
} from "../../features/suppliers/supplierTypes";

/** The suppliers match block is new — surface this instead of failing blank. */
const PERMISSION_HINT =
  "Permission denied — the /suppliers rules in firestore.rules are not deployed yet. Run:  firebase deploy --only firestore:rules  then reload.";

const toFriendlyError = (error: unknown, fallback: string): string => {
  const err = error as { code?: string; message?: string };
  const message = err?.message ?? "";
  if (
    err?.code === "permission-denied" ||
    message.includes("insufficient permissions")
  ) {
    return PERMISSION_HINT;
  }
  return message || fallback;
};

/** tel: href — strips spaces/punctuation, keeps a leading + for country codes. */
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export default function SuppliersPage() {
  const user = useAppSelector((state) => state.auth.user);
  const medicalId = user?.medicalId;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadSuppliers = useCallback(async () => {
    if (!medicalId) return;
    try {
      const data = await getSuppliers(medicalId);
      setSuppliers(data);
      setLoadError(null);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setLoadError(toFriendlyError(error, "Could not load suppliers."));
    } finally {
      setLoaded(true);
    }
  }, [medicalId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state updates run after the fetch resolves
    loadSuppliers();
  }, [loadSuppliers]);

  const openCreate = () => {
    setSelected(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setSelected(supplier);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = async (payload: CreateSupplierPayload) => {
    if (!medicalId) return;
    setSaving(true);
    setFormError(null);
    try {
      if (selected) {
        await updateSupplier({ id: selected.id, ...payload });
      } else {
        await createSupplier(medicalId, payload);
      }
      await loadSuppliers();
      setFormOpen(false);
      setSelected(null);
    } catch (error) {
      // Keep the dialog open so the failure is visible and retryable.
      setFormError(
        toFriendlyError(error, selected ? "Could not save changes." : "Could not add the supplier.")
      );
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (supplier: Supplier) => {
    setDeleteTarget(supplier);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleDelete = async (supplier: Supplier) => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteSupplier(supplier.id);
      await loadSuppliers();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(
        toFriendlyError(error, "Could not delete the supplier.")
      );
    } finally {
      setDeleting(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter((supplier) =>
      [
        supplier.supplierName,
        supplier.contactPerson,
        supplier.phone,
        supplier.email,
        supplier.address,
      ].some((value) => value?.toLowerCase().includes(term))
    );
  }, [suppliers, search]);

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Vendors you purchase stock from — tap Call to dial"
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Add supplier
          </Button>
        }
      />

      {/* Search */}
      <div className="rounded-card border border-line bg-white p-3 md:p-4">
        <TextField
          fullWidth
          placeholder="Search by supplier, contact or phone number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: "#8A968F" }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </div>

      {loadError && (
        <Alert severity="error" sx={{ mt: 3, alignItems: "flex-start" }}>
          {loadError}
        </Alert>
      )}

      {/* Table */}
      <div className="mt-5 overflow-hidden rounded-card border border-line bg-white">
        {!loaded ? (
          <div className="space-y-px">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={52} sx={{ bgcolor: "#EDF1EF" }} />
            ))}
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-ctl bg-canvas">
              <LocalShipping sx={{ fontSize: 22, color: "#8A968F" }} />
            </span>
            <h3 className="mt-3 text-[15px] font-semibold text-ink">
              {search ? "No suppliers match the search" : "No suppliers yet"}
            </h3>
            <p className="mt-1 max-w-sm text-[13px] text-ink-soft">
              {search
                ? "Adjust the search term to see more results."
                : "Add your vendors to keep their contact details one tap away."}
            </p>
            {!search && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={openCreate}
                sx={{ mt: 3 }}
              >
                Add supplier
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mute md:px-5">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mute">
                    Contact person
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mute">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mute">
                    Address
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mute">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-t border-[#EEF1EF] transition-colors hover:bg-canvas">
                    <td className="px-4 py-3 md:px-5">
                      <p className="text-[13px] font-semibold text-ink">
                        {supplier.supplierName}
                      </p>
                      {supplier.email && (
                        <p className="mt-0.5 truncate text-xs text-ink-soft">
                          {supplier.email}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-[13px] text-ink-soft">
                      {supplier.contactPerson || "—"}
                    </td>

                    <td className="tnum px-4 py-3 text-[13px] text-ink">
                      {supplier.phone || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="block max-w-[220px] truncate text-[13px] text-ink-soft"
                        title={supplier.address}
                      >
                        {supplier.address || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                        {supplier.phone && (
                          <Button
                            size="small"
                            color="success"
                            variant="outlined"
                            component="a"
                            href={telHref(supplier.phone)}
                            startIcon={<Phone sx={{ fontSize: 15 }} />}
                          >
                            Call
                          </Button>
                        )}

                        <Button
                          size="small"
                          startIcon={<Edit sx={{ fontSize: 15 }} />}
                          onClick={() => openEdit(supplier)}
                        >
                          Edit
                        </Button>

                        <Button
                          size="small"
                          color="error"
                          startIcon={<Delete sx={{ fontSize: 15 }} />}
                          onClick={() => openDelete(supplier)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SupplierFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        supplier={selected}
        onSubmit={handleSave}
        saving={saving}
        error={formError}
      />

      <DeleteSupplierDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        supplier={deleteTarget}
        onConfirm={handleDelete}
        deleting={deleting}
        error={deleteError}
      />
    </div>
  );
}