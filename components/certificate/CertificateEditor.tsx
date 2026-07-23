'use client';

import React, { useState } from 'react';
import { CertificateData } from '@/types/certificate';
import {
  downloadCertificatePNG,
  printCertificate,
  type CertificateRegistrationData,
} from '@/lib/certificateExport';

interface CertificateEditorProps {
  data: CertificateData;
  onChange: (newData: CertificateData) => void;
  scale: number;
  onScaleChange: (newScale: number) => void;
}

export const CertificateEditor: React.FC<CertificateEditorProps> = ({
  data,
  onChange,
  scale,
  onScaleChange,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueMessage, setIssueMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (
    field: keyof CertificateData,
    value: any
  ) => {
    onChange({ ...data, [field]: value });
  };

  const handleSignatureChange = (
    index: number,
    field: 'name' | 'designation' | 'organization' | 'signatureSvg',
    value: string
  ) => {
    const newSignatures = [...data.signatures];
    newSignatures[index] = { ...newSignatures[index], [field]: value };
    onChange({ ...data, signatures: newSignatures });
  };

  const handleDownloadPNG = async () => {
    setIsExporting(true);
    const certData: CertificateRegistrationData = {
      recipientName: data.recipientName,
      enrollmentId: data.enrollmentId || '',
      completionDate: data.completionDate,
      customCertificateId: data.certificateId || undefined,
    };
    await downloadCertificatePNG({
      fileName: `Certificate_${data.recipientName.replace(/\s+/g, '_')}.png`,
      certData,
    });
    setIsExporting(false);
  };

  const handleIssueCertificate = async () => {
    if (!data.recipientName?.trim() || !data.enrollmentId?.trim()) {
      setIssueMessage({ type: 'error', text: 'Please enter Recipient Name and Enrollment ID.' });
      return;
    }

    setIsIssuing(true);
    setIssueMessage(null);

    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: data.recipientName,
          enrollmentId: data.enrollmentId,
          completionDate: data.completionDate,
          customCertificateId: data.certificateId || undefined,
          winnerRank: data.winnerRank || undefined,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setIssueMessage({
          type: 'success',
          text: `🎉 Certificate Issued Successfully for ${data.recipientName}! Live on /verify and active in student dashboard.`,
        });
      } else {
        setIssueMessage({ type: 'error', text: result.error || 'Failed to issue certificate.' });
      }
    } catch (err: any) {
      setIssueMessage({ type: 'error', text: 'Network error issuing certificate.' });
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <div
      style={{
        width: '420px',
        minWidth: '420px',
        maxWidth: '420px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 20px rgba(0,0,0,0.08)',
        zIndex: 20,
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
      className="no-print"
    >
      {/* Header */}
      <div
        style={{
          padding: '24px',
          borderBottom: '1px solid #0F172A',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
            Certificate Studio
          </h2>
          <p style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 600, margin: '2px 0 0 0' }}>
            Git &amp; GitHub Masterclass Editor
          </p>
        </div>
        <span
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            color: '#FCD34D',
            fontSize: '12px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '9999px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          Admin Console
        </span>
      </div>

      {/* Export & Issue Actions */}
      <div
        style={{
          padding: '20px',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Admin Actions &amp; Export
        </label>

        {issueMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: issueMessage.type === 'success' ? '#DCFCE7' : '#FEE2E2',
              color: issueMessage.type === 'success' ? '#15803D' : '#B91C1C',
              border: issueMessage.type === 'success' ? '1px solid #86EFAC' : '1px solid #FCA5A5',
              lineHeight: 1.4,
            }}
          >
            {issueMessage.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={handleDownloadPNG}
            disabled={isExporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: '#F59E0B',
              color: '#FFFFFF',
              fontWeight: 700,
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              border: 'none',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
            }}
          >
            <svg
              style={{ width: '16px', height: '16px', minWidth: '16px' }}
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PNG Image
          </button>

          {/* Issue Certificate Button */}
          <button
            onClick={handleIssueCertificate}
            disabled={isIssuing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              fontWeight: 800,
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              border: 'none',
              cursor: isIssuing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)',
              transition: 'background 0.2s',
            }}
          >
            <svg
              style={{ width: '16px', height: '16px', minWidth: '16px' }}
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isIssuing ? 'Issuing...' : '📜 Issue Certificate'}
          </button>
        </div>

        <button
          onClick={printCertificate}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: '#FFFFFF',
            color: '#334155',
            fontWeight: 600,
            padding: '8px 14px',
            borderRadius: '12px',
            border: '1px solid #CBD5E1',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <svg
            style={{ width: '16px', height: '16px', minWidth: '16px', color: '#64748B' }}
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Certificate
        </button>
      </div>

      {/* Zoom Scale Control */}
      <div
        style={{
          padding: '14px 20px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
          Preview Scale
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
          {[0.5, 0.75, 0.85, 1.0].map((s) => (
            <button
              key={s}
              onClick={() => onScaleChange(s)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: scale === s ? '#F59E0B' : 'transparent',
                color: scale === s ? '#FFFFFF' : '#475569',
              }}
            >
              {Math.round(s * 100)}%
            </button>
          ))}
        </div>
      </div>

      {/* Editor Controls Form */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', color: '#1E293B' }}>
        {/* Recipient Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', margin: 0 }}>
            Recipient Details
          </h3>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Recipient Name
            </label>
            <input
              type="text"
              value={data.recipientName}
              onChange={(e) => handleInputChange('recipientName', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="e.g. Mohit Raj"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Certificate Rank / Winner Badge
            </label>
            <select
              value={data.winnerRank || 0}
              onChange={(e) => {
                const val = Number(e.target.value);
                handleInputChange('winnerRank', val > 0 ? val : undefined);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value={0}>Standard (GitHub Octocat Logo)</option>
              <option value={1}>1st Winner (Gold Medal Badge)</option>
              <option value={2}>2nd Winner (Silver Medal Badge)</option>
              <option value={3}>3rd Winner (Bronze Medal Badge)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Enrollment ID (Generates Credential ID: GT/&lt;EnrollmentID&gt;)
            </label>
            <input
              type="text"
              value={data.enrollmentId || ''}
              onChange={(e) => handleInputChange('enrollmentId', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="e.g. 250609"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Custom Certificate ID (Optional Override)
            </label>
            <input
              type="text"
              value={data.certificateId || ''}
              onChange={(e) => handleInputChange('certificateId', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="Leave empty to use GT/<EnrollmentID>"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Completion Date
            </label>
            <input
              type="text"
              value={data.completionDate}
              onChange={(e) => handleInputChange('completionDate', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="e.g. 23 JULY 2026"
            />
          </div>
        </div>

        {/* Verification URL / QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', margin: 0 }}>
            Verification QR Code
          </h3>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              QR Code Verification URL
            </label>
            <input
              type="text"
              value={data.qrCodeUrl}
              onChange={(e) => handleInputChange('qrCodeUrl', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 500,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Description Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', margin: 0 }}>
            Certificate Description HTML
          </h3>
          <div>
            <textarea
              rows={4}
              value={data.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                fontSize: '12px',
                fontFamily: 'monospace',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', margin: 0 }}>
            Signatories ({data.signatures.length})
          </h3>
          {data.signatures.map((sig, i) => (
            <div
              key={i}
              style={{
                padding: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 800, color: '#D97706' }}>Signatory #{i + 1}</div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                  Signature Text / Script
                </label>
                <input
                  type="text"
                  value={sig.signatureSvg || ''}
                  onChange={(e) =>
                    handleSignatureChange(i, 'signatureSvg', e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={sig.name}
                  onChange={(e) => handleSignatureChange(i, 'name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                    Designation
                  </label>
                  <input
                    type="text"
                    value={sig.designation}
                    onChange={(e) =>
                      handleSignatureChange(i, 'designation', e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                    Organization
                  </label>
                  <input
                    type="text"
                    value={sig.organization}
                    onChange={(e) =>
                      handleSignatureChange(i, 'organization', e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
