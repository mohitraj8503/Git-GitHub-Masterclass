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

export interface CertificateData {
  recipientName: string;
  certificateId: string;
  completionDate: string;
  workshopName: string;
  description: string;
  organization: string;
  qrCodeUrl: string;
  signatures: SignatureItem[];
  skills?: SkillItem[];
}

export interface CertificateProps {
  data: CertificateData;
  scale?: number;
  className?: string;
}
