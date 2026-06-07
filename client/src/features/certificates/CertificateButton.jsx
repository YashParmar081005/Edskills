import { useState } from 'react';
import toast from 'react-hot-toast';
import { Award, Loader2 } from 'lucide-react';
import { getCourseCertificate } from '../../api/certificates.js';

/**
 * Fetches (issuing if needed) the student's certificate for a completed course
 * and opens the PDF. Use inside or outside a Link — clicks are isolated.
 */
export default function CertificateButton({ courseId, className = '', label = 'Certificate' }) {
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setLoading(true);
    try {
      const cert = await getCourseCertificate(courseId);
      window.open(cert.downloadUrl, '_blank', 'noopener');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Certificate not available yet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handle} disabled={loading} className={`btn-primary ${className}`}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
      {label}
    </button>
  );
}
