import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Image metadata
export const alt = 'Manga on Animy'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let manga: any = null
  try {
    const res = await fetch(`${API_URL}/manga/${id}/full`, { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      manga = json.data
    }
  } catch (error) {
    console.error('Failed to fetch manga for OG image:', error)
  }

  if (!manga) {
    return new ImageResponse(
      (
        <div style={{ background: '#0a0a0a', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: 'white', fontSize: 60 }}>Animy</h1>
        </div>
      ),
      { ...size }
    )
  }

  const imageUrl = manga.images?.jpg?.large_image_url || manga.images?.webp?.large_image_url

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '60px',
          background: '#0a0a0a',
          position: 'relative',
        }}
      >
        {/* Background Image with blur */}
        {imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.3,
            }}
          />
        )}
        
        {/* Content Overlay */}
        <div style={{ display: 'flex', flexDirection: 'column', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ background: '#ec4899', padding: '8px 16px', borderRadius: '8px', color: 'white', fontSize: 24, fontWeight: 'bold', marginRight: '16px' }}>
              ⭐ {manga.score || 'N/A'}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', color: '#e5e7eb', fontSize: 24, fontWeight: 'bold' }}>
              MANGA
            </div>
          </div>
          
          <h1
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.1,
              marginBottom: '20px',
              maxWidth: '900px',
              textShadow: '0 4px 20px rgba(0,0,0,0.8)'
            }}
          >
            {manga.title}
          </h1>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px' }}>
            {manga.genres?.slice(0, 3).map((g: any, i: number) => (
              <span key={i} style={{ color: '#f472b6', fontSize: 28, fontWeight: 'bold' }}>
                {i > 0 ? '• ' : ''}{g.name}
              </span>
            ))}
          </div>
        </div>

        {/* Brand */}
        <div style={{ position: 'absolute', top: '40px', right: '60px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '2px' }}>ANIMY</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
