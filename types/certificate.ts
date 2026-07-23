export interface SignatureItem {
  name: string;
  designation: string;
  organization: string;
  signatureSvg?: string;
  signatureImg?: string;
}

export interface SkillItem {
  id: string;
  label: string;
  icon: 'version-control' | 'collaboration' | 'open-source' | 'projects';
}

export interface Student {
  name: string;
  enrollmentId: string;
  certificateId?: string;
}

export const COURSE_PREFIX = 'GT';

export const COURSE_PREFIX_MAP: Record<string, string> = {
  'git-github': 'GT',
  python: 'PY',
  powerbi: 'PBI',
  ai: 'AI',
  fabric: 'FAB',
  azure: 'AZ',
};

export const generateCredentialId = (
  student?: Partial<Student> | null,
  customCertificateId?: string,
  coursePrefix: string = COURSE_PREFIX
): string => {
  if (customCertificateId && customCertificateId.trim().length > 0) {
    return customCertificateId.trim();
  }

  if (student?.certificateId && student.certificateId.trim().length > 0) {
    return student.certificateId.trim();
  }

  const enrollmentId = student?.enrollmentId?.trim() || '250609';
  const prefix = (coursePrefix || COURSE_PREFIX).toUpperCase();
  return `${prefix}/${enrollmentId}`;
};

export interface CertificateData {
  recipientName: string;
  enrollmentId?: string;
  certificateId?: string;
  coursePrefix?: string;
  completionDate: string;
  workshopName: string;
  description: string;
  organization: string;
  qrCodeUrl: string;
  signatures: SignatureItem[];
  skills?: SkillItem[];
  winnerRank?: number;
}

export interface CertificateProps {
  data: CertificateData;
  scale?: number;
  className?: string;
}

