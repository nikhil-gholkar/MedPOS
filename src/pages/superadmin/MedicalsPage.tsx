import { useEffect, useState } from "react";

import { Button } from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";

import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import {
  useAppDispatch,
  useAppSelector,
} from "../../hooks/reduxHooks";

import {
  fetchMedicals,
  addMedical,
  editMedical,
  toggleMedical,
  removeMedical,
} from "../../features/medicals/medicalThunks";

import MedicalFormDialog from "../../features/medicals/MedicalFormDialog";
import EditMedicalDialog from "../../features/medicals/EditMedicalDialog";
import DeleteMedicalDialog from "../../features/medicals/DeleteMedicalDialog";

import PageHeader from "../../components/ui/PageHeader";

import type { Medical, CreateMedicalPayload } from "../../features/medicals/medicalTypes";

const TAG = "inline-flex items-center rounded-chip border px-1.5 py-0.5 text-[11px] font-medium";

export default function MedicalsPage() {
  const dispatch = useAppDispatch();

  const { medicals, loading } = useAppSelector((state) => state.medicals);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedMedical, setSelectedMedical] = useState<Medical | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medical | null>(null);

  useEffect(() => {
    dispatch(fetchMedicals());
  }, [dispatch]);

  const handleCreateMedical = async (data: CreateMedicalPayload) => {
    await dispatch(addMedical(data));
    setCreateOpen(false);
  };

  const handleEditMedical = async (data: Medical) => {
    await dispatch(
      editMedical({
        id: data.id,
        medicalName: data.medicalName,
        ownerName: data.ownerName,
        phone: data.phone,
        email: data.email,
        address: data.address,
      })
    );
    setEditOpen(false);
  };

  const handleDeleteMedical = async (data: Medical) => {
    setDeleting(true);
    setDeleteError(null);
    try {
      // NOTE: dispatch(thunk) resolves even when the thunk fails — unwrap()
      // is what surfaces a rejection, otherwise the dialog would close on a
      // silently-failed delete.
      await dispatch(removeMedical(data.id)).unwrap();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      const error = err as { message?: string; code?: string };
      const message = error?.message ?? "";
      setDeleteError(
        error?.code === "permission-denied" ||
          message.includes("insufficient permissions")
          ? "Permission denied: the updated firestore.rules are not deployed yet. Run  firebase deploy --only firestore:rules  — then click Delete again."
          : message || "Deletion failed — please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "medicalName",
      headerName: "Store",
      flex: 1.4,
      minWidth: 200,
      renderCell: (params) => (
        <div className="min-w-0 py-1">
          <p className="truncate text-[13px] font-semibold text-ink">
            {params.row.medicalName}
          </p>
          <p className="truncate text-xs text-ink-mute">
            {params.row.email || "—"}
          </p>
        </div>
      ),
    },
    {
      field: "ownerName",
      headerName: "Owner",
      flex: 1,
      minWidth: 130,
    },
    {
      field: "phone",
      headerName: "Phone",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <span className="tnum text-ink-soft">{params.row.phone || "—"}</span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <span
          className={`${TAG} ${
            params.row.isActive
              ? "border-ok/25 bg-ok-soft text-ok"
              : "border-line-strong bg-[#F3F5F4] text-ink-soft"
          }`}
        >
          {params.row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.6,
      minWidth: 300,
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Button
            size="small"
            startIcon={<EditIcon sx={{ fontSize: 15 }} />}
            onClick={() => {
              setSelectedMedical(params.row);
              setEditOpen(true);
            }}
          >
            Edit
          </Button>

          <Button
            size="small"
            color={params.row.isActive ? "error" : "success"}
            startIcon={
              params.row.isActive ? (
                <BlockIcon sx={{ fontSize: 15 }} />
              ) : (
                <CheckCircleIcon sx={{ fontSize: 15 }} />
              )
            }
            onClick={() =>
              dispatch(
                toggleMedical({
                  medicalId: params.row.id,
                  currentStatus: params.row.isActive,
                })
              )
            }
          >
            {params.row.isActive ? "Deactivate" : "Activate"}
          </Button>

          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon sx={{ fontSize: 15 }} />}
            onClick={() => {
              setDeleteTarget(params.row);
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Medical stores"
        subtitle="Pharmacies registered on the platform"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Add store
          </Button>
        }
      />

      <div className="overflow-hidden rounded-card border border-line bg-white">
        <DataGrid
          rows={medicals}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          autoHeight
          rowHeight={64}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{
            border: "none",
            fontSize: 13,
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#F8FAF9",
              borderBottom: "1px solid #E5E9E7",
            },
            "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
              outline: "none",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "#6B7873",
            },
            "& .MuiDataGrid-row": {
              borderBottom: "1px solid #EEF1EF",
              "&:hover": { backgroundColor: "#F7F9F8" },
            },
            "& .MuiDataGrid-cell": {
              borderColor: "transparent",
              display: "flex",
              alignItems: "center",
              "&:focus, &:focus-within": { outline: "none" },
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid #E5E9E7",
              minHeight: 44,
            },
            "& .MuiTablePagination-root": { fontSize: 12 },
          }}
        />
      </div>

      <MedicalFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateMedical}
      />

      <EditMedicalDialog
        key={selectedMedical?.id ?? "none"}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        medical={selectedMedical}
        onSubmit={handleEditMedical}
      />

      <DeleteMedicalDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        medical={deleteTarget}
        onConfirm={handleDeleteMedical}
        deleting={deleting}
        error={deleteError}
      />
    </div>
  );
}
