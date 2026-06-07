import { Router } from 'express';
import {
  downloadCertificate,
  verifyCertificate,
  getMyCertificates,
} from '../controllers/certificate.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/mine', protect, getMyCertificates);

// Public (by unguessable certificateId).
router.get('/verify/:certificateId', verifyCertificate);
router.get('/:certificateId/download', downloadCertificate);

export default router;
