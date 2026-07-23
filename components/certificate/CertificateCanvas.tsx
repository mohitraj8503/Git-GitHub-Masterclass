'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CertificateProps, generateCredentialId, COURSE_PREFIX, CertificateData } from '@/types/certificate';

export const defaultCertificateData: CertificateData = {
  recipientName: 'Mohit Raj',
  enrollmentId: '250609',
  coursePrefix: COURSE_PREFIX,
  certificateId: '',
  completionDate: '23 JULY 2026',
  workshopName: 'Git & GitHub Masterclass',
  description:
    'has successfully completed the <span style="color:#F4A51C; font-weight:700;">Git & GitHub Masterclass</span>,<br/>a 7-day hands-on workshop organized by <strong style="font-weight:700;">Arka Jain University</strong>,<br/>in collaboration with <span style="color:#F4A51C; font-weight:700;">Microsoft Learn Student Ambassadors</span> and <strong style="font-weight:700;">GitHub</strong>.<br/>This workshop focused on Version Control, Collaboration,<br/>Open Source and Real-world Projects.',
  organization: 'Arka Jain University',
  qrCodeUrl: 'https://github-masterclass.azurewebsites.net/verify/GT-250609',
  signatures: [
    {
      name: 'DR. ASHWINI KUMAR',
      designation: 'ASSISTANT DEAN',
      organization: '',
      signatureSvg: 'Ahalini',
      signatureImg: '/Ashwini_Signature-removebg-preview.png',
    },
  ],
  skills: [
    { id: '1', label: 'VERSION CONTROL', icon: 'version-control' as const },
    { id: '2', label: 'COLLABORATION', icon: 'collaboration' as const },
    { id: '3', label: 'OPEN SOURCE', icon: 'open-source' as const },
    { id: '4', label: 'REAL-WORLD PROJECTS', icon: 'projects' as const },
  ],
};

export const CertificateCanvas: React.FC<CertificateProps> = ({
  data = defaultCertificateData,
  scale = 1,
  className = '',
}) => {
  const mergedData = { ...defaultCertificateData, ...data };

  // Generate dynamic Credential ID based on enrollmentId, coursePrefix or custom certificateId override
  const credentialId = generateCredentialId(
    {
      name: mergedData.recipientName,
      enrollmentId: mergedData.enrollmentId,
      certificateId: mergedData.certificateId,
    },
    mergedData.certificateId,
    mergedData.coursePrefix || COURSE_PREFIX
  );

  // Build the live verification URL baked into the QR code
  // Uses NEXT_PUBLIC_SITE_URL env var; falls back to production domain
  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://ajumicrosoft.in';
  const verifyUrl = `${BASE_URL}/verify?id=${encodeURIComponent(credentialId)}`;

  return (
    <>
      {/* Inject Google Fonts & Custom Milker Font */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&family=Montserrat:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
          
          @font-face {
            font-family: 'Milker';
            src: url('/fonts/Milker.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
          }
        `
      }} />


      <div
        style={{
          width: '1200px',
          height: '820px',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
          boxSizing: 'border-box',
          fontFamily: "'Montserrat', sans-serif",
          margin: 0,
          padding: 0,
        }}
        className={`certificate-container ${className}`}
        id="certificate-canvas"
      >
        {/* Background Concentric Circles */}
        <div style={{ position: 'absolute', border: '1px solid #F2F2F2', borderRadius: '50%', top: '200px', right: '175px', transform: 'translate(50%, -50%)', zIndex: 1, width: '300px', height: '300px' }} />
        <div style={{ position: 'absolute', border: '1px solid #F2F2F2', borderRadius: '50%', top: '200px', right: '175px', transform: 'translate(50%, -50%)', zIndex: 1, width: '450px', height: '450px' }} />
        <div style={{ position: 'absolute', border: '1px solid #F2F2F2', borderRadius: '50%', top: '200px', right: '175px', transform: 'translate(50%, -50%)', zIndex: 1, width: '600px', height: '600px' }} />
        <div style={{ position: 'absolute', border: '1px solid #F2F2F2', borderRadius: '50%', top: '200px', right: '175px', transform: 'translate(50%, -50%)', zIndex: 1, width: '750px', height: '750px' }} />
        <div style={{ position: 'absolute', border: '1px solid #F8F8F8', borderRadius: '50%', top: '200px', right: '175px', transform: 'translate(50%, -50%)', zIndex: 1, width: '900px', height: '900px' }} />
        <div style={{ position: 'absolute', border: '1px solid #FAFAFA', borderRadius: '50%', top: '200px', right: '175px', transform: 'translate(50%, -50%)', zIndex: 1, width: '1050px', height: '1050px' }} />

        {/* Dot Patterns — decorative, placed away from icons */}
        {/* Top-right cluster (above QR area) */}
        <div style={{ position: 'absolute', backgroundImage: 'radial-gradient(#D3D3D3 2px, transparent 2px)', backgroundSize: '15px 15px', zIndex: 1, top: '55px', right: '48px', width: '75px', height: '75px' }} />
        {/* Mid-left subtle row */}
        <div style={{ position: 'absolute', backgroundImage: 'radial-gradient(#D3D3D3 2px, transparent 2px)', backgroundSize: '15px 15px', zIndex: 1, top: '140px', left: '60px', width: '60px', height: '15px' }} />
        {/* Center-right cluster (between circles, mid-height) */}
        <div style={{ position: 'absolute', backgroundImage: 'radial-gradient(#D3D3D3 2px, transparent 2px)', backgroundSize: '15px 15px', zIndex: 1, top: '580px', right: '260px', width: '60px', height: '45px' }} />

        {/* Bottom Left Decorative Accent Shapes */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '180px', height: '70px', backgroundColor: '#D68C11', clipPath: 'polygon(0 0, 100% 100%, 0 100%)', zIndex: 2 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '220px', height: '85px', backgroundColor: '#F4A51C', clipPath: 'polygon(0 25px, 90px 85px, 220px 85px, 0 85px)', zIndex: 3 }} />

        {/* Date Block (Unclipped, Crisp & Standout) */}
        <div
          style={{
            position: 'absolute',
            bottom: '35px',
            left: '60px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#151C3E',
            padding: '10px 18px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: '22px', height: '22px', fill: 'none', stroke: '#F4A51C', strokeWidth: '2' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <rect x="7" y="14" width="3" height="3" fill="#F4A51C" stroke="none" />
            <rect x="11" y="14" width="3" height="3" fill="#F4A51C" stroke="none" />
            <rect x="15" y="14" width="3" height="3" fill="#F4A51C" stroke="none" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 700, letterSpacing: '1px' }}>COMPLETED ON</div>
            <div style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 800, marginTop: '1px', letterSpacing: '0.5px' }}>
              {mergedData.completionDate}
            </div>
          </div>
        </div>

        {/* Top Left Logos (Pure HTML/CSS to ensure exact matching without external images) */}
        <div style={{ position: 'absolute', top: '60px', left: '60px', display: 'flex', alignItems: 'center', gap: '35px', zIndex: 10 }}>
          {/* Microsoft Image Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/microsoft-logo.svg"
              alt="Microsoft"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
          {/* JGI Arka Jain Image Logo */}
          <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid #E2E2E2', paddingLeft: '25px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/arka-jain-logo-wide.png"
              alt="Arka Jain University"
              style={{ height: '46px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Main Certificate Content */}
        <div style={{ position: 'absolute', top: '160px', left: '60px', zIndex: 10, width: '750px' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#F4A51C', letterSpacing: '7px', marginBottom: '5px' }}>
            CERTIFICATE OF COMPLETION
          </div>
          <div style={{ fontSize: '82px', fontWeight: 900, lineHeight: 1, marginBottom: '5px', letterSpacing: '-1px' }}>
            <span style={{ color: '#1F2024' }}>GIT &</span> <span style={{ color: '#F4A51C' }}>GITHUB</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#1F2024', letterSpacing: '16px', marginBottom: '25px' }}>
            M A S T E R C L A S S
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', border: '1px solid #F4A51C', padding: '8px 20px', borderRadius: '30px', marginBottom: '40px' }}>
            <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: '#F4A51C' }}>
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1F2024', letterSpacing: '1px' }}>
              7-DAY HANDS-ON WORKSHOP
            </span>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 600, color: '#888888', letterSpacing: '1.5px', marginBottom: '5px' }}>
            THIS IS TO CERTIFY THAT
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '56px', fontWeight: 600, color: '#151C3E', marginBottom: '15px', lineHeight: 1.1 }}>
            {mergedData.recipientName}
          </div>

          {/* Name Underline with center dot */}
          <div style={{ width: '480px', height: '1px', backgroundColor: '#F4A51C', position: 'relative', marginBottom: '25px' }}>
            <div style={{ position: 'absolute', top: '-2px', left: '50%', transform: 'translateX(-50%)', width: '5px', height: '5px', backgroundColor: '#F4A51C', borderRadius: '50%' }} />
          </div>

          <div
            style={{ fontSize: '15px', color: '#1F2024', lineHeight: 1.6, maxWidth: '600px', marginBottom: '25px' }}
            dangerouslySetInnerHTML={{ __html: mergedData.description }}
          />

          {/* Signatures Area */}
          <div style={{ display: 'flex', gap: '0px', width: '700px' }}>
            {mergedData.signatures.map((sig, index) => (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {/* Signature image (if provided) or blank space above the line */}
                {sig.signatureImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sig.signatureImg}
                    alt={`${sig.name} signature`}
                    style={{
                      height: '48px',
                      width: 'auto',
                      maxWidth: '160px',
                      objectFit: 'contain',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div style={{ height: '42px', marginBottom: '6px' }} />
                )}
                <div style={{ width: '160px', height: '1px', backgroundColor: '#CCC', marginBottom: '6px' }} />
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#F4A51C', letterSpacing: '0.5px', marginBottom: '2px' }}>
                  {sig.name}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: '#1F2024', letterSpacing: '0.5px' }}>
                  {sig.designation}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: '#1F2024', letterSpacing: '0.5px' }}>
                  {sig.organization}
                </div>

                {/* Vertical Separator Line between signatures */}
                {index !== mergedData.signatures.length - 1 && (
                  <div style={{ position: 'absolute', right: 0, bottom: 0, height: '40px', width: '1px', backgroundColor: '#CCC' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Ribbon (Standard GitHub or Winner Rank - SVG pointed banner to prevent html2canvas cutoffs) */}
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '120px',
            width: '130px',
            height: '290px',
            zIndex: 10,
          }}
        >
          {/* Pointed Ribbon SVG Shape (highly supported by html2canvas export) */}
          <svg
            width="130"
            height="290"
            viewBox="0 0 130 290"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.12))',
            }}
          >
            <polygon
              points="0,0 130,0 130,246.5 65,290 0,246.5"
              fill={
                mergedData.winnerRank === 1
                  ? '#FFB800' // Super Bright Gold
                  : mergedData.winnerRank === 2
                  ? '#94A3B8' // Slate Silver
                  : mergedData.winnerRank === 3
                  ? '#CD7F32' // Bronze
                  : '#F4A51C' // Standard orange
              }
            />
          </svg>

          {/* Ribbon Content Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '130px',
              height: '290px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Winner Rank Label (1st, 2nd, 3rd) placed at the top of the ribbon */}
            {mergedData.winnerRank && [1, 2, 3].includes(mergedData.winnerRank) && (
              <div
                style={{
                  marginTop: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  lineHeight: 1.1,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Milker', sans-serif",
                    fontSize: '36px',
                    fontWeight: 'normal',
                    color: '#FFFFFF',
                    textShadow: '0 2px 5px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'flex-start',
                  }}
                >
                  {mergedData.winnerRank === 1 ? '1' : mergedData.winnerRank === 2 ? '2' : '3'}
                  <span style={{ fontSize: '18px', fontWeight: 'normal', verticalAlign: 'super', marginTop: '4px', marginLeft: '1px', color: '#FFFFFF' }}>
                    {mergedData.winnerRank === 1 ? 'st' : mergedData.winnerRank === 2 ? 'nd' : 'rd'}
                  </span>
                </span>
                <span
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '9px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    opacity: 1,
                  }}
                >
                  Winner
                </span>
              </div>
            )}

            {/* GitHub logo circle (Vertically centered for standard people, pushed down for winners) */}
            <div
              style={{
                width: '90px',
                height: '90px',
                backgroundColor: '#000000',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: mergedData.winnerRank ? '15px' : '75px',
                border:
                  mergedData.winnerRank === 1
                    ? '2px solid #FFD700'
                    : mergedData.winnerRank === 2
                    ? '2px solid #E5E7EB'
                    : mergedData.winnerRank === 3
                    ? '2px solid #F59E0B'
                    : 'none',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: '60px', height: '60px', fill: '#FFF' }}>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Certificate ID & QR Code */}
        <div style={{ position: 'absolute', top: '360px', right: '85px', width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#555555', letterSpacing: '1px', marginBottom: '8px' }}>CERTIFICATE ID</div>
          <div style={{ width: '120px', height: '2px', backgroundColor: '#F4A51C', marginBottom: '12px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', backgroundColor: '#F4A51C', borderRadius: '50%' }} />
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#1F2024', marginBottom: '20px' }}>
            {credentialId}
          </div>
          <div style={{ width: '140px', height: '140px', border: '1px solid #F4A51C', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px', backgroundColor: '#fff', boxSizing: 'border-box' }}>
            <QRCodeSVG value={verifyUrl} size={122} level="H" includeMargin={false} />
          </div>
        </div>

        {/* Bottom Right Icons */}
        <div style={{ position: 'absolute', bottom: '40px', right: '60px', display: 'flex', gap: '0', zIndex: 10 }}>
          {mergedData.skills?.map((skill, index) => (
            <div key={skill.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 15px', position: 'relative' }}>
              <div style={{ width: '42px', height: '42px', border: '1px solid #F4A51C', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
                {skill.icon === 'version-control' && (
                  <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'none', stroke: '#1F2024', strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <polyline points="7 8 3 12 7 16" />
                    <polyline points="17 8 21 12 17 16" />
                    <line x1="14" y1="4" x2="10" y2="20" />
                  </svg>
                )}
                {skill.icon === 'collaboration' && (
                  <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'none', stroke: '#1F2024', strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )}
                {skill.icon === 'open-source' && (
                  <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'none', stroke: '#1F2024', strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                  </svg>
                )}
                {skill.icon === 'projects' && (
                  <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'none', stroke: '#1F2024', strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <path d="M13.5 2.5a8.5 8.5 0 0 1 8 8c0 4.5-3 8.5-8.5 11.5a14.2 14.2 0 0 1-5.5-2.5l-3 1 1-3a14.2 14.2 0 0 1-2.5-5.5c3-5.5 7-8.5 11.5-8.5z" />
                    <path d="M15 9h.01" strokeWidth="2" />
                    <path d="M8.5 15.5l-2.5 2.5" />
                    <path d="M11.5 18.5l-2.5 2.5" />
                  </svg>
                )}
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#1F2024', textAlign: 'center', lineHeight: 1.3, letterSpacing: '0.5px' }} dangerouslySetInnerHTML={{ __html: skill.label.replace(' ', '<br/>') }} />

              {/* Dashed Separator Line between skills */}
              {index !== (mergedData.skills?.length || 0) - 1 && (
                <div style={{ position: 'absolute', right: 0, bottom: '5px', height: '30px', width: '1px', backgroundColor: '#E2E2E2', borderRight: '1px dashed #CCC' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};