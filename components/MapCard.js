export default function MapCard({ isFiltered }) {
  return (
    <div className={`card map-card${isFiltered ? ' filtered-out' : ''}`}>
      <div className="card-inner">
        <div className="map-wrapper">
          <img
            src="/images/map-brazil.png"
            alt="Map showing São Paulo, Brazil"
            className="map-image"
            draggable={false}
          />
          <img
            src="/images/photo.jpg"
            alt="Location pin"
            className="map-pin"
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}
