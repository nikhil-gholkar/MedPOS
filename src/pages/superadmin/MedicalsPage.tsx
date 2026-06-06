import { useEffect, useState } from "react";

import {
  Button,
  Chip,
  Paper,
} from "@mui/material";

import {
  DataGrid,
} from "@mui/x-data-grid";
import type {
  GridColDef,
} from "@mui/x-data-grid";

import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import {
  useAppDispatch,
  useAppSelector,
} from "../../hooks/reduxHooks";

import {
  fetchMedicals,
  addMedical,
  editMedical,
  toggleMedical,
} from "../../features/medicals/medicalThunks";

import MedicalFormDialog from "../../features/medicals/MedicalFormDialog";

import EditMedicalDialog from "../../features/medicals/EditMedicalDialog";

import type {
  Medical,
} from "../../features/medicals/medicalTypes";

export default function MedicalsPage() {
  const dispatch =
    useAppDispatch();

  const {
    medicals,
    loading,
  } = useAppSelector(
    (state) => state.medicals
  );

  const [createOpen, setCreateOpen] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);

  const [selectedMedical,
    setSelectedMedical] =
    useState<Medical | null>(null);

  useEffect(() => {
    dispatch(fetchMedicals());
  }, [dispatch]);

  const handleCreateMedical =
    async (data: any) => {
      await dispatch(
        addMedical(data)
      );

      setCreateOpen(false);
    };

  const handleEditMedical =
    async (data: Medical) => {
      await dispatch(
        editMedical({
          id: data.id,
          medicalName:
            data.medicalName,
          ownerName:
            data.ownerName,
          phone: data.phone,
          email: data.email,
          address: data.address,
        })
      );

      setEditOpen(false);
    };

  const columns: GridColDef[] = [
    {
      field: "medicalName",
      headerName:
        "Medical Name",
      flex: 1,
    },
    {
      field: "ownerName",
      headerName: "Owner",
      flex: 1,
    },
    {
      field: "phone",
      headerName: "Phone",
      flex: 1,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,

      renderCell: (params) => (
        <Chip
          label={
            params.row.isActive
              ? "Active"
              : "Inactive"
          }
          color={
            params.row.isActive
              ? "success"
              : "error"
          }
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.5,

      sortable: false,

      renderCell: (params) => (
        <div className="flex gap-2">

          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => {
              setSelectedMedical(
                params.row
              );

              setEditOpen(true);
            }}
          >
            Edit
          </Button>

          <Button
            size="small"
            color={
              params.row.isActive
                ? "error"
                : "success"
            }
            startIcon={
              params.row.isActive
                ? <BlockIcon />
                : <CheckCircleIcon />
            }
            onClick={() =>
              dispatch(
                toggleMedical({
                  medicalId:
                    params.row.id,
                  currentStatus:
                    params.row
                      .isActive,
                })
              )
            }
          >
            {params.row.isActive
              ? "Deactivate"
              : "Activate"}
          </Button>

        </div>
      ),
    },
  ];

  return (
    <div>

      <div className="mb-5 flex items-center justify-between">

        <h1 className="text-2xl font-bold">
          Medical Management
        </h1>

        <Button
          variant="contained"
          onClick={() =>
            setCreateOpen(true)
          }
        >
          Add Medical
        </Button>

      </div>

      <Paper
        sx={{
          height: 600,
          width: "100%",
        }}
      >
        <DataGrid
          rows={medicals}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>

      <MedicalFormDialog
        open={createOpen}
        onClose={() =>
          setCreateOpen(false)
        }
        onSubmit={
          handleCreateMedical
        }
      />

      <EditMedicalDialog
        open={editOpen}
        onClose={() =>
          setEditOpen(false)
        }
        medical={selectedMedical}
        onSubmit={
          handleEditMedical
        }
      />

    </div>
  );
}