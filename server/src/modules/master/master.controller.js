import { successResponse } from '../../utils/response.js';
import * as masterService from './master.service.js';

// ── Crops ────────────────────────────────────────────────────────────────────

export async function getCrops(req, res, next) {
  try {
    const crops = await masterService.getAllCrops();
    return successResponse(res, crops, 'Crops retrieved');
  } catch (error) {
    next(error);
  }
}

export async function createCrop(req, res, next) {
  try {
    const crop = await masterService.createCrop(req.body.name);
    return successResponse(res, crop, 'Crop created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateCrop(req, res, next) {
  try {
    const crop = await masterService.updateCrop(Number(req.params.id), req.body.name);
    return successResponse(res, crop, 'Crop updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteCrop(req, res, next) {
  try {
    await masterService.deleteCrop(Number(req.params.id));
    return successResponse(res, null, 'Crop deleted');
  } catch (error) {
    next(error);
  }
}

// ── Locations ────────────────────────────────────────────────────────────────

export async function getLocations(req, res, next) {
  try {
    const locations = await masterService.getAllLocations();
    return successResponse(res, locations, 'Locations retrieved');
  } catch (error) {
    next(error);
  }
}

export async function createLocation(req, res, next) {
  try {
    const location = await masterService.createLocation(req.body.name);
    return successResponse(res, location, 'Location created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateLocation(req, res, next) {
  try {
    const location = await masterService.updateLocation(Number(req.params.id), req.body.name);
    return successResponse(res, location, 'Location updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteLocation(req, res, next) {
  try {
    await masterService.deleteLocation(Number(req.params.id));
    return successResponse(res, null, 'Location deleted');
  } catch (error) {
    next(error);
  }
}

// ── Branches ─────────────────────────────────────────────────────────────────

export async function getBranches(req, res, next) {
  try {
    const branches = await masterService.getAllBranches();
    return successResponse(res, branches, 'Branches retrieved');
  } catch (error) {
    next(error);
  }
}

export async function createBranch(req, res, next) {
  try {
    const branch = await masterService.createBranch(req.body.name);
    return successResponse(res, branch, 'Branch created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateBranch(req, res, next) {
  try {
    const branch = await masterService.updateBranch(Number(req.params.id), req.body.name);
    return successResponse(res, branch, 'Branch updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteBranch(req, res, next) {
  try {
    await masterService.deleteBranch(Number(req.params.id));
    return successResponse(res, null, 'Branch deleted');
  } catch (error) {
    next(error);
  }
}
