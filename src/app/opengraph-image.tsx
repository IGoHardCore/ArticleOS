import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const markPaths = [
  'M64 24v80',
  'M55 33c-13-8-24-8-34-2',
  'M55 46c-13-8-24-8-34-2',
  'M55 59c-13-8-24-8-34-2',
  'M55 72c-13-8-24-8-34-2',
  'M55 85c-13-8-24-8-34-2',
  'M73 33c13-8 24-8 34-2',
  'M73 46c13-8 24-8 34-2',
  'M73 59c13-8 24-8 34-2',
  'M73 72c13-8 24-8 34-2',
  'M73 85c13-8 24-8 34-2',
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 42%, #4f46e5 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <div
            style={{
              display: 'flex',
              width: 144,
              height: 144,
              borderRadius: 32,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.35)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="104" height="104" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g stroke="#ffffff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
                {markPaths.map((d) => (
                  <path key={d} d={d} />
                ))}
              </g>
            </svg>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: -1,
              color: '#ffffff',
            }}
          >
            ArticleOS
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 34,
            color: 'rgba(255,255,255,0.88)',
          }}
        >
          Your personal pharmacy &amp; medicine news OS
        </div>
      </div>
    ),
    { ...size }
  );
}
