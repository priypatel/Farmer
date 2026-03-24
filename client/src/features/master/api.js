import api from '../../services/api'

export function getCropsApi() {
  return api.get('/master/crops')
}

export function getLocationsApi() {
  return api.get('/master/locations')
}

export function getBranchesApi() {
  return api.get('/master/branches')
}

export function createCropApi(name) {
  return api.post('/master/crops', { name })
}

export function updateCropApi(id, name) {
  return api.put(`/master/crops/${id}`, { name })
}

export function deleteCropApi(id) {
  return api.delete(`/master/crops/${id}`)
}

export function createLocationApi(name) {
  return api.post('/master/locations', { name })
}

export function updateLocationApi(id, name) {
  return api.put(`/master/locations/${id}`, { name })
}

export function deleteLocationApi(id) {
  return api.delete(`/master/locations/${id}`)
}

export function createBranchApi(name) {
  return api.post('/master/branches', { name })
}

export function updateBranchApi(id, name) {
  return api.put(`/master/branches/${id}`, { name })
}

export function deleteBranchApi(id) {
  return api.delete(`/master/branches/${id}`)
}
