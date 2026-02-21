import Card from './Card'

export default function MusicCard({ activeFilters, locked }) {
    return (
        <Card
            className="music-card"
            tags={['Music']}
            activeFilters={activeFilters}
            locked={locked}
            accent="green"
        >
            <div
                className="music-cover"
                style={{
                    background:
                        'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    height: '180px',
                }}
            >
                🎵
            </div>
            <div className="music-info">
                <div className="music-status">
                    <span className="music-status-dot" />
                    Now Playing
                </div>
                <div className="music-track">I Don't Belong</div>
                <div className="music-artist">Fontaines D.C.</div>
                <div className="music-progress">
                    <div className="music-progress-bar" />
                </div>
            </div>
        </Card>
    )
}
