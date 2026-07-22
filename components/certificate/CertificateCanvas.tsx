'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CertificateProps } from '@/types/certificate';

export const defaultCertificateData = {
  recipientName: 'Mohit Raj',
  certificateId: 'TT/GIT/2026/058',
  completionDate: '18TH MAY, 2026',
  workshopName: 'Git & GitHub Masterclass',
  description:
    'has successfully completed the <span style="color:#F6A700; font-weight:600;">Git & GitHub Masterclass</span>, a 7-day hands-on workshop organized by <strong style="color:#111111;">Arka Jain University</strong>, in collaboration with <span style="color:#F6A700; font-weight:600;">Microsoft Learn Student Ambassadors</span> and <strong style="color:#111111;">GitHub</strong>. This workshop focused on Version Control, Collaboration, Open Source and Real-world Projects.',
  organization: 'Arka Jain University',
  qrCodeUrl: 'https://github-masterclass.azurewebsites.net/verify/TT-GIT-2026-058',
  signatures: [
    {
      name: 'DR. ASHWINI KUMAR',
      designation: 'CONVENER',
      organization: 'GIT & GITHUB MASTERCLASS',
      signatureSvg: 'Ahalini',
    },
    {
      name: 'DR. ARVIND PANDEY',
      designation: 'CONVENER',
      organization: 'GIT & GITHUB MASTERCLASS',
      signatureSvg: 'Arvind Pandey',
    },
    {
      name: 'PROF. (DR.) ANGAD TIWARY',
      designation: 'PRO VICE-CHANCELLOR',
      organization: 'ARKA JAIN UNIVERSITY',
      signatureSvg: 'Angad',
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

  return (
    <div
      style={{
        width: '3508px',
        height: '2480px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#FCFCFB',
        color: '#111111',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
        boxSizing: 'border-box',
      }}
      className={`font-inter ${className}`}
      id="certificate-canvas"
    >
      {/* Background Subtle Gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '3508px',
          height: '2480px',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFBFB 100%)',
          opacity: 0.98,
          pointerEvents: 'none',
        }}
      />

      {/* Inset Gold Border (2px gold border, 28px radius, 28px inset) */}
      <div
        style={{
          position: 'absolute',
          top: '28px',
          left: '28px',
          width: '3452px',
          height: '2424px',
          border: '2px solid #E7B638',
          borderRadius: '28px',
          pointerEvents: 'none',
          zIndex: 20,
          boxShadow: '0 12px 40px rgba(0,0,0,0.03)',
          boxSizing: 'border-box',
        }}
      />

      {/* Background Concentric Golden Circles (behind top-right GitHub ribbon) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: '250px',
          width: '1400px',
          height: '1400px',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.4,
        }}
      >
        <svg
          viewBox="0 0 1400 1400"
          style={{ width: '1400px', height: '1400px', filter: 'blur(1px)' }}
        >
          <circle cx="700" cy="200" r="320" fill="none" stroke="#FDB813" strokeWidth="2" opacity="0.25" />
          <circle cx="700" cy="200" r="480" fill="none" stroke="#FDB813" strokeWidth="2" opacity="0.2" />
          <circle cx="700" cy="200" r="640" fill="none" stroke="#FDB813" strokeWidth="2" opacity="0.15" />
          <circle cx="700" cy="200" r="800" fill="none" stroke="#FDB813" strokeWidth="1.5" opacity="0.1" />
          <circle cx="700" cy="200" r="960" fill="none" stroke="#FDB813" strokeWidth="1" opacity="0.06" />
        </svg>
      </div>

      {/* Decorative Dot Matrix - Top Right */}
      <div
        style={{
          position: 'absolute',
          top: '85px',
          right: '85px',
          zIndex: 10,
          opacity: 0.18,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 7px)',
          gap: '12px',
        }}
      >
        {[...Array(9)].map((_, i) => (
          <div key={i} style={{ width: '7px', height: '7px', backgroundColor: '#1A1A1A', borderRadius: '50%' }} />
        ))}
      </div>

      {/* Decorative Dot Matrix - Bottom Right */}
      <div
        style={{
          position: 'absolute',
          bottom: '90px',
          right: '85px',
          zIndex: 10,
          opacity: 0.18,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 7px)',
          gap: '12px',
        }}
      >
        {[...Array(16)].map((_, i) => (
          <div key={i} style={{ width: '7px', height: '7px', backgroundColor: '#1A1A1A', borderRadius: '50%' }} />
        ))}
      </div>

      {/* TOP RIGHT GOLDEN BOOKMARK RIBBON WITH GITHUB LOGO */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: '380px',
          width: '310px',
          height: '820px',
          zIndex: 30,
          filter: 'drop-shadow(0px 18px 30px rgba(0, 0, 0, 0.12))',
        }}
      >
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '310px', height: '820px' }}
          viewBox="0 0 310 820"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 0 H310 V700 Q310 760 270 780 L155 820 L40 780 Q0 760 0 700 Z"
            fill="url(#goldRibbonGradientFixed)"
          />
          <defs>
            <linearGradient id="goldRibbonGradientFixed" x1="155" y1="0" x2="155" y2="820" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F6A700" />
              <stop offset="0.6" stopColor="#F6A700" />
              <stop offset="1" stopColor="#FFC93A" />
            </linearGradient>
          </defs>
        </svg>

        {/* GitHub Badge Circle inside Ribbon */}
        <div
          style={{
            position: 'absolute',
            top: '250px',
            left: '50px',
            width: '210px',
            height: '210px',
            borderRadius: '50%',
            backgroundColor: '#181D27',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '5px solid #FFF8E7',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
            zIndex: 35,
          }}
        >
          <svg style={{ width: '125px', height: '125px', fill: '#FFFFFF' }} width="125" height="125" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.224-5.624-5.421-7.17-5.421-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0112.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.868 0 48.854 0z"
            />
          </svg>
        </div>
      </div>

      {/* TOP LEFT HEADER LOGOS */}
      {/* 1. Microsoft Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/microsoft-logo.svg"
        alt="Microsoft"
        style={{
          position: 'absolute',
          top: '120px',
          left: '140px',
          height: '85px',
          objectFit: 'contain',
        }}
      />

      {/* Vertical Divider */}
      <div style={{ position: 'absolute', top: '120px', left: '500px', width: '2px', height: '85px', backgroundColor: '#E2E8F0' }} />

      {/* 2 & 3. Arka Jain University Logo Banner (Includes JGI & NAAC Grade A) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/arka-jain-logo-wide.png"
        alt="Arka Jain University"
        style={{
          position: 'absolute',
          top: '110px',
          left: '540px',
          height: '125px',
          objectFit: 'contain',
        }}
      />

      {/* FAINT DOT ROW ACCENT */}
      <div style={{ position: 'absolute', top: '340px', left: '140px', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.4 }}>
        <div style={{ width: '8px', height: '8px', backgroundColor: '#F6A700', borderRadius: '50%' }} />
        <div style={{ width: '8px', height: '8px', backgroundColor: '#F6A700', borderRadius: '50%' }} />
        <div style={{ width: '8px', height: '8px', backgroundColor: '#F6A700', borderRadius: '50%' }} />
        <div style={{ width: '8px', height: '8px', backgroundColor: '#F6A700', borderRadius: '50%' }} />
        <div style={{ width: '60px', height: '2px', backgroundColor: '#F6A700' }} />
      </div>

      {/* MAIN TITLE BLOCK (Target Content Width ≈ 1500px, Scaled Up 1.55x) */}
      {/* CERTIFICATE OF COMPLETION (38px) */}
      <h2
        style={{
          position: 'absolute',
          top: '380px',
          left: '140px',
          fontWeight: 500,
          color: '#F6A700',
          fontSize: '38px',
          letterSpacing: '20px',
          textTransform: 'uppercase',
          margin: 0,
        }}
        className="font-plus-jakarta"
      >
        CERTIFICATE OF COMPLETION
      </h2>

      {/* GIT & GITHUB (210px DOMINANT TITLE) */}
      <h1
        style={{
          position: 'absolute',
          top: '450px',
          left: '140px',
          fontWeight: 900,
          fontSize: '210px',
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          margin: 0,
          width: '1500px',
        }}
      >
        <span style={{ color: '#111111' }}>GIT & </span>
        <span
          style={{
            background: 'linear-gradient(180deg, #F6A700 0%, #FFC93A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          GITHUB
        </span>
      </h1>

      {/* MASTERCLASS (68px) */}
      <div
        style={{
          position: 'absolute',
          top: '665px',
          left: '140px',
          fontWeight: 300,
          fontSize: '68px',
          color: '#222222',
          letterSpacing: '0.38em',
          textTransform: 'uppercase',
        }}
      >
        M A S T E R C L A S S
      </div>

      {/* WORKSHOP BADGE */}
      <div
        style={{
          position: 'absolute',
          top: '775px',
          left: '140px',
          height: '72px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '18px',
          border: '2.5px solid #F6A700',
          borderRadius: '9999px',
          padding: '18px 40px',
          backgroundColor: '#FFFDF8',
          boxSizing: 'border-box',
        }}
      >
        <svg style={{ width: '28px', height: '28px', color: '#F6A700' }} width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: '26px', color: '#111111', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          7-DAY HANDS-ON WORKSHOP
        </span>
      </div>

      {/* RECIPIENT SECTION (Target Content Width ≈ 1200px - 1400px) */}
      {/* THIS IS TO CERTIFY THAT (26px) */}
      <div
        style={{
          position: 'absolute',
          top: '920px',
          left: '140px',
          color: '#777777',
          fontSize: '26px',
          fontWeight: 500,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
      >
        THIS IS TO CERTIFY THAT
      </div>

      {/* Recipient Name (135px, Playfair/Cormorant) */}
      <div
        style={{
          position: 'absolute',
          top: '975px',
          left: '140px',
          fontWeight: 600,
          fontSize: '135px',
          color: '#1D2432',
          lineHeight: 1,
          width: '1400px',
        }}
        className="font-cormorant"
      >
        {mergedData.recipientName}
      </div>

      {/* Gold Underline (1200px) */}
      <div
        style={{
          position: 'absolute',
          top: '1125px',
          left: '140px',
          width: '1200px',
          height: '3px',
          backgroundColor: '#E7B638',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-5px',
            left: '594px',
            width: '12px',
            height: '12px',
            backgroundColor: '#F6A700',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* DESCRIPTION PARAGRAPH (Target Content Width ≈ 1250px, Font 26px, Line Height 1.85) */}
      <div
        style={{
          position: 'absolute',
          top: '1185px',
          left: '140px',
          width: '1250px',
          color: '#333333',
          fontSize: '26px',
          lineHeight: 1.85,
          fontWeight: 400,
        }}
        dangerouslySetInnerHTML={{ __html: mergedData.description }}
      />

      {/* QR SECTION (MOVED SLIGHTLY INWARD FROM RIGHT EDGE: right = 320px) */}
      {/* Certificate ID */}
      <div style={{ position: 'absolute', top: '980px', right: '320px', width: '300px', textAlign: 'center' }}>
        <div style={{ color: '#888888', fontWeight: 500, fontSize: '22px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          CERTIFICATE ID
        </div>
        <div style={{ width: '45px', height: '3px', backgroundColor: '#F6A700', margin: '10px auto' }} />
        <div style={{ fontWeight: 800, fontSize: '26px', color: '#111111', letterSpacing: '0.05em' }}>
          {mergedData.certificateId}
        </div>
      </div>

      {/* QR Code Card Box (240px QR Code inside) */}
      <div
        style={{
          position: 'absolute',
          top: '1060px',
          right: '320px',
          width: '300px',
          height: '300px',
          backgroundColor: '#FFFFFF',
          padding: '30px',
          borderRadius: '30px',
          border: '3px solid #F6A700',
          boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        <QRCodeSVG
          value={mergedData.qrCodeUrl}
          size={240}
          level="H"
          includeMargin={false}
        />
      </div>

      {/* SIGNATURES SECTION (EVENLY DISTRIBUTED ACROSS HORIZONTAL WIDTH) */}
      {/* Column 1 (Left = 140px, Width = 520px) */}
      <div style={{ position: 'absolute', top: '1780px', left: '140px', width: '520px', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            height: '85px',
            display: 'flex',
            alignItems: 'flex-end',
            fontSize: '64px',
            color: '#0F172A',
            fontFamily: 'var(--font-signature), cursive',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            maxWidth: '480px',
          }}
          className="font-signature"
        >
          {mergedData.signatures[0]?.signatureSvg || mergedData.signatures[0]?.name}
        </div>
        <div style={{ width: '360px', height: '2px', backgroundColor: '#E2E8F0', marginTop: '12px', marginBottom: '12px' }} />
        <div style={{ fontWeight: 700, fontSize: '26px', color: '#F6A700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {mergedData.signatures[0]?.name}
        </div>
        <div style={{ fontWeight: 700, fontSize: '19px', color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '4px' }}>
          {mergedData.signatures[0]?.designation}
        </div>
        <div style={{ fontWeight: 500, fontSize: '17px', color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px' }}>
          {mergedData.signatures[0]?.organization}
        </div>
      </div>

      {/* Sig Divider 1 (Left = 700px) */}
      <div style={{ position: 'absolute', top: '1810px', left: '700px', width: '2px', height: '140px', backgroundColor: '#E2E8F0' }} />

      {/* Column 2 (Left = 740px, Width = 520px) */}
      <div style={{ position: 'absolute', top: '1780px', left: '740px', width: '520px', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            height: '85px',
            display: 'flex',
            alignItems: 'flex-end',
            fontSize: '64px',
            color: '#0F172A',
            fontFamily: 'var(--font-signature), cursive',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            maxWidth: '480px',
          }}
          className="font-signature"
        >
          {mergedData.signatures[1]?.signatureSvg || mergedData.signatures[1]?.name}
        </div>
        <div style={{ width: '360px', height: '2px', backgroundColor: '#E2E8F0', marginTop: '12px', marginBottom: '12px' }} />
        <div style={{ fontWeight: 700, fontSize: '26px', color: '#F6A700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {mergedData.signatures[1]?.name}
        </div>
        <div style={{ fontWeight: 700, fontSize: '19px', color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '4px' }}>
          {mergedData.signatures[1]?.designation}
        </div>
        <div style={{ fontWeight: 500, fontSize: '17px', color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px' }}>
          {mergedData.signatures[1]?.organization}
        </div>
      </div>

      {/* Sig Divider 2 (Left = 1300px) */}
      <div style={{ position: 'absolute', top: '1810px', left: '1300px', width: '2px', height: '140px', backgroundColor: '#E2E8F0' }} />

      {/* Column 3 (Left = 1340px, Width = 520px) */}
      <div style={{ position: 'absolute', top: '1780px', left: '1340px', width: '520px', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            height: '85px',
            display: 'flex',
            alignItems: 'flex-end',
            fontSize: '64px',
            color: '#0F172A',
            fontFamily: 'var(--font-signature), cursive',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            maxWidth: '480px',
          }}
          className="font-signature"
        >
          {mergedData.signatures[2]?.signatureSvg || mergedData.signatures[2]?.name}
        </div>
        <div style={{ width: '360px', height: '2px', backgroundColor: '#E2E8F0', marginTop: '12px', marginBottom: '12px' }} />
        <div style={{ fontWeight: 700, fontSize: '26px', color: '#F6A700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {mergedData.signatures[2]?.name}
        </div>
        <div style={{ fontWeight: 700, fontSize: '19px', color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '4px' }}>
          {mergedData.signatures[2]?.designation}
        </div>
        <div style={{ fontWeight: 500, fontSize: '17px', color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px' }}>
          {mergedData.signatures[2]?.organization}
        </div>
      </div>

      {/* BOTTOM LEFT DATE CARD BADGE */}
      <div
        style={{
          position: 'absolute',
          bottom: '0px',
          left: '0px',
          width: '640px',
          height: '130px',
          backgroundColor: '#F6A700',
          color: '#FFFFFF',
          borderTopRightRadius: '36px',
          borderBottomRightRadius: '36px',
          borderTopLeftRadius: '36px',
          borderBottomLeftRadius: '26px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          paddingLeft: '130px',
          boxSizing: 'border-box',
          boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg style={{ width: '34px', height: '34px', color: '#FFFFFF' }} width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.92)', textTransform: 'uppercase' }}>
            COMPLETED ON
          </span>
          <span style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '0.05em', color: '#FFFFFF', textTransform: 'uppercase', lineHeight: 1.1 }}>
            {mergedData.completionDate}
          </span>
        </div>
      </div>

      {/* FOOTER SKILLS ICONS (70px Circles, 80px Spacing) */}
      <div
        style={{
          position: 'absolute',
          bottom: '60px',
          right: '180px',
          display: 'flex',
          alignItems: 'center',
          gap: '80px',
        }}
      >
        {mergedData.skills?.map((skill, index) => (
          <React.Fragment key={skill.id}>
            {index > 0 && (
              <div style={{ width: '2px', height: '50px', borderRight: '2px dashed #CBD5E1' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  border: '2.5px solid #F6A700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
                  color: '#111111',
                }}
              >
                {skill.icon === 'version-control' && (
                  <svg style={{ width: '34px', height: '34px' }} width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                )}
                {skill.icon === 'collaboration' && (
                  <svg style={{ width: '34px', height: '34px' }} width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )}
                {skill.icon === 'open-source' && (
                  <svg style={{ width: '34px', height: '34px' }} width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                  </svg>
                )}
                {skill.icon === 'projects' && (
                  <svg style={{ width: '34px', height: '34px' }} width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                  </svg>
                )}
              </div>
              <span style={{ fontWeight: 700, fontSize: '16px', color: '#111111', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center', maxWidth: '150px' }}>
                {skill.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};