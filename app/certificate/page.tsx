'use client';

import React, { useState } from 'react';
import { CertificateCanvas, defaultCertificateData } from '@/components/certificate/CertificateCanvas';
import { CertificateEditor } from '@/components/certificate/CertificateEditor';
import { CertificateData } from '@/types/certificate';
import Link from 'next/link';

export default function CertificatePage() {
  const [data, setData] = useState<CertificateData>(defaultCertificateData);
  const [scale, setScale] = useState<number>(0.75); // 75% preview scale

  return (
    <div
      style={{
        minHeight: '100vh',
        height: '100vh',
        backgroundColor: '#090D16',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
      className="font-inter"
    >
      {/* Top Navbar */}
      <header
        style={{
          height: '64px',
          minHeight: '64px',
          backgroundColor: '#0F172A',
          borderBottom: '1px solid #1E293B',
          paddingLeft: '24px',
          paddingRight: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 30,
          boxSizing: 'border-box',
        }}
        className="no-print"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#94A3B8',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
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
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Masterclass
          </Link>
          <div style={{ height: '16px', width: '1px', backgroundColor: '#334155' }} />
          <h1 style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '0.02em' }}>
            Git & GitHub Masterclass Certificate Studio (A4 Artboard Canvas)
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: '#FCD34D',
              padding: '4px 12px',
              borderRadius: '9999px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              fontWeight: 600,
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FCD34D' }} />
            1200 × 820 px Fixed Landscape
          </span>
        </div>
      </header>

      {/* Main Studio Workarea */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Left Side: Interactive Customization Editor */}
        <CertificateEditor
          data={data}
          onChange={setData}
          scale={scale}
          onScaleChange={setScale}
        />

        {/* Right Side: Scaled Artboard Canvas Preview Container */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#090D16',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {/* Helper toolbar above preview */}
          <div
            style={{
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: `${1200 * scale}px`,
              fontSize: '12px',
              color: '#94A3B8',
            }}
            className="no-print"
          >
            <span style={{ fontWeight: 700, color: '#CBD5E1' }}>
              Illustrator Artboard Preview ({Math.round(scale * 100)}% Display Scale)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>Canvas Ratio: 1200 × 820 px</span>
            </div>
          </div>

          {/* Canvas Artboard Box */}
          <div
            style={{
              backgroundColor: '#000000',
              padding: '8px',
              borderRadius: '24px',
              border: '1px solid #1E293B',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              position: 'relative',
              boxSizing: 'content-box',
            }}
          >
            <div
              style={{
                width: 1200 * scale,
                height: 820 * scale,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px',
              }}
            >
              <div
                style={{
                  width: 1200,
                  height: 820,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              >
                <CertificateCanvas data={data} scale={1} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
