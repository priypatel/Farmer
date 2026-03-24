import * as masterQuery from './master.query.js';

function duplicateError() {
  const error = new Error('Name already exists');
  error.status = 409;
  throw error;
}

function notFoundError(entity) {
  const error = new Error(`${entity} not found`);
  error.status = 404;
  throw error;
}

// ── Crops ────────────────────────────────────────────────────────────────────

export async function getAllCrops() {
  return masterQuery.getAllCrops();
}

export async function createCrop(name) {
  const existing = await masterQuery.findActiveCropByName(name);
  if (existing) duplicateError();

  const id = await masterQuery.createCrop(name);
  return { id, name };
}

export async function updateCrop(id, name) {
  const existing = await masterQuery.getCropById(id);
  if (!existing) notFoundError('Crop');

  const duplicate = await masterQuery.findActiveCropByName(name);
  if (duplicate && duplicate.id !== id) duplicateError();

  await masterQuery.updateCrop(id, name);
  return { id, name };
}

export async function deleteCrop(id) {
  const existing = await masterQuery.getCropById(id);
  if (!existing) notFoundError('Crop');

  await masterQuery.softDeleteCrop(id);
}

// ── Locations ────────────────────────────────────────────────────────────────

export async function getAllLocations() {
  return masterQuery.getAllLocations();
}

export async function createLocation(name) {
  const existing = await masterQuery.findActiveLocationByName(name);
  if (existing) duplicateError();

  const id = await masterQuery.createLocation(name);
  return { id, name };
}

export async function updateLocation(id, name) {
  const existing = await masterQuery.getLocationById(id);
  if (!existing) notFoundError('Location');

  const duplicate = await masterQuery.findActiveLocationByName(name);
  if (duplicate && duplicate.id !== id) duplicateError();

  await masterQuery.updateLocation(id, name);
  return { id, name };
}

export async function deleteLocation(id) {
  const existing = await masterQuery.getLocationById(id);
  if (!existing) notFoundError('Location');

  await masterQuery.softDeleteLocation(id);
}

// ── Branches ─────────────────────────────────────────────────────────────────

export async function getAllBranches() {
  return masterQuery.getAllBranches();
}

export async function createBranch(name) {
  const existing = await masterQuery.findActiveBranchByName(name);
  if (existing) duplicateError();

  const id = await masterQuery.createBranch(name);
  return { id, name };
}

export async function updateBranch(id, name) {
  const existing = await masterQuery.getBranchById(id);
  if (!existing) notFoundError('Branch');

  const duplicate = await masterQuery.findActiveBranchByName(name);
  if (duplicate && duplicate.id !== id) duplicateError();

  await masterQuery.updateBranch(id, name);
  return { id, name };
}

export async function deleteBranch(id) {
  const existing = await masterQuery.getBranchById(id);
  if (!existing) notFoundError('Branch');

  await masterQuery.softDeleteBranch(id);
}
