import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { useCrops, useLocations, useBranches } from './hooks'
import {
  createCropApi, updateCropApi, deleteCropApi,
  createLocationApi, updateLocationApi, deleteLocationApi,
  createBranchApi, updateBranchApi, deleteBranchApi,
} from './api'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const TABS = [
  { key: 'crops', label: 'Crops' },
  { key: 'locations', label: 'Locations' },
  { key: 'branches', label: 'Branches' },
]

const apiMap = {
  crops: { create: createCropApi, update: updateCropApi, delete: deleteCropApi },
  locations: { create: createLocationApi, update: updateLocationApi, delete: deleteLocationApi },
  branches: { create: createBranchApi, update: updateBranchApi, delete: deleteBranchApi },
}

export default function MasterDataPage() {
  const [tab, setTab] = useState('crops')
  const crops = useCrops()
  const locations = useLocations()
  const branches = useBranches()

  const hookMap = { crops, locations, branches }
  const current = hookMap[tab]

  const [name, setName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      await apiMap[tab].create(trimmed)
      toast.success(`${trimmed} added`)
      setName('')
      current.refetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id) {
    const trimmed = editName.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      await apiMap[tab].update(id, trimmed)
      toast.success('Updated')
      setEditId(null)
      current.refetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      await apiMap[tab].delete(deleteTarget.id)
      toast.success(`${deleteTarget.name} deleted`)
      setDeleteTarget(null)
      current.refetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(item) {
    setEditId(item.id)
    setEditName(item.name)
  }

  function cancelEdit() {
    setEditId(null)
    setEditName('')
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setEditId(null); setName('') }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-3 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Add new ${tab.slice(0, -1)}...`}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 w-64
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-md text-sm font-medium
            disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      {/* List */}
      {current.loading ? (
        <LoadingSpinner />
      ) : current.error ? (
        <p className="text-sm text-red-500">{current.error}</p>
      ) : current.data.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No {tab} added yet</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase text-xs w-16">#</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase text-xs">Name</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 uppercase text-xs w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {current.data.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {editId === item.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleUpdate(item.id) }
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          autoFocus
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm w-48
                            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button
                          onClick={() => handleUpdate(item.id)}
                          disabled={submitting}
                          className="text-xs text-primary hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-xs text-gray-400 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editId !== item.id && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-gray-400 hover:text-primary p-1"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
