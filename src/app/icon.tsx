import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
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

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 7,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 42%, #4f46e5 100%)',
        }}
      >
        <svg width="23" height="23" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#ffffff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
            {markPaths.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
