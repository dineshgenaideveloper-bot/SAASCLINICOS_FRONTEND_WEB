import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import {
  FormField,
  SelectField,
} from '../components/FormField';

import { loginPriceAPI } from '../services/api';

export default function LoginPrice() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [form, setForm] = useState({
    planName: '',
    price: '',
    isActive: true,
  });

  const fetchLoginPrices = async () => {
    try {
      setLoading(true);

      const res =
        await loginPriceAPI.getLoginPrices();

      setRows(res.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginPrices();
  }, []);

  const resetForm = () => {
    setForm({
      planName: '',
      price: '',
      isActive: true,
    });

    setSelectedItem(null);
  };

  const openAdd = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (item) => {
    setSelectedItem(item);

    setForm({
      planName: item.planName || '',
      price: item.price || '',
      isActive: item.isActive ?? true,
    });

    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        planName: form.planName,
        price: Number(form.price || 0),
        isActive: form.isActive,
      };

      if (selectedItem?._id) {
        await loginPriceAPI.updateLoginPrice(
          selectedItem._id,
          payload
        );

        toast.success(
          'Login price updated successfully'
        );
      } else {
        await loginPriceAPI.createLoginPrice(
          payload
        );

        toast.success(
          'Login price created successfully'
        );
      }

      setOpen(false);

      resetForm();

      fetchLoginPrices();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm(
      `Delete "${item.planName}" ?`
    );

    if (!confirmDelete) return;

    try {
      await loginPriceAPI.deleteLoginPrice(
        item._id
      );

      toast.success('Deleted successfully');

      fetchLoginPrices();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleStatus = async (item) => {
    try {
      const newStatus = !item.isActive;

      await loginPriceAPI.updateLoginPriceStatus(
        item._id,
        {
          isActive: newStatus,
        }
      );

      setRows((prev) =>
        prev.map((x) =>
          x._id === item._id
            ? {
                ...x,
                isActive: newStatus,
              }
            : x
        )
      );

      toast.success(
        newStatus ? 'Activated' : 'Deactivated'
      );
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    {
      key: 'planName',
      label: 'Plan Name',
    },

    {
      key: 'price',
      label: 'Price',
      render: (value) => `₹${value || 0}`,
    },

    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => toggleStatus(row)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <Badge
            color={
              row.isActive ? 'green' : 'red'
            }
          >
            {row.isActive
              ? 'Active'
              : 'Inactive'}
          </Badge>
        </button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Login Price"
        subtitle="Manage login pricing plans"
        columns={columns}
        rows={rows}
        loading={loading}
        addLabel="Add Login Price"
        onAdd={openAdd}
        actions={({ row }) => (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEdit(row)}
            >
              Edit
            </Button>

            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(row)}
            >
              Delete
            </Button>
          </>
        )}
      />

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={
          selectedItem
            ? 'Update Login Price'
            : 'Add Login Price'
        }
        confirmLabel={
          selectedItem
            ? 'Update Login Price'
            : 'Save Login Price'
        }
        onConfirm={handleSubmit}
      >
        <div
          style={{
            display: 'grid',
            gap: 14,
          }}
        >
          <FormField
            label="Plan Name"
            required
          >
            <input
              value={form.planName}
              onChange={(e) =>
                setForm({
                  ...form,
                  planName: e.target.value,
                })
              }
              placeholder="Enter plan name"
            />
          </FormField>

          <FormField
            label="Price"
            required
          >
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: e.target.value,
                })
              }
              placeholder="Enter price"
            />
          </FormField>

          <SelectField
            label="Status"
            value={
              form.isActive
                ? 'active'
                : 'inactive'
            }
            onChange={(e) =>
              setForm({
                ...form,
                isActive:
                  e.target.value === 'active',
              })
            }
          >
            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </SelectField>
        </div>
      </Modal>
    </>
  );
}