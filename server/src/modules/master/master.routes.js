import { Router } from 'express';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { authorizeRole } from '../../middlewares/authorizeRole.js';
import { validate } from '../../middlewares/validate.js';
import { nameSchema } from './master.validation.js';
import {
  getCrops, createCrop, updateCrop, deleteCrop,
  getLocations, createLocation, updateLocation, deleteLocation,
  getBranches, createBranch, updateBranch, deleteBranch,
} from './master.controller.js';

const router = Router();
const adminOnly = [verifyToken, authorizeRole(['admin', 'super_admin'])];

// Crops
router.get('/crops', verifyToken, getCrops);
router.post('/crops', ...adminOnly, validate(nameSchema), createCrop);
router.put('/crops/:id', ...adminOnly, validate(nameSchema), updateCrop);
router.delete('/crops/:id', ...adminOnly, deleteCrop);

// Locations
router.get('/locations', verifyToken, getLocations);
router.post('/locations', ...adminOnly, validate(nameSchema), createLocation);
router.put('/locations/:id', ...adminOnly, validate(nameSchema), updateLocation);
router.delete('/locations/:id', ...adminOnly, deleteLocation);

// Branches
router.get('/branches', verifyToken, getBranches);
router.post('/branches', ...adminOnly, validate(nameSchema), createBranch);
router.put('/branches/:id', ...adminOnly, validate(nameSchema), updateBranch);
router.delete('/branches/:id', ...adminOnly, deleteBranch);

export default router;
