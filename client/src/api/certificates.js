import api from './axios.js';

/** GET /api/courses/:id/certificate → certificate (issued if 100% complete) */
export async function getCourseCertificate(courseId) {
  const { data } = await api.get(`/courses/${courseId}/certificate`);
  return data.certificate; // { certificateId, downloadUrl, pdfUrl, ... }
}

/** GET /api/certificates/verify/:certificateId (public) */
export async function verifyCertificate(certificateId) {
  const { data } = await api.get(`/certificates/verify/${certificateId}`);
  return data;
}

/** GET /api/certificates/mine → my earned certificates */
export async function getMyCertificates() {
  const { data } = await api.get('/certificates/mine');
  return data.certificates;
}
