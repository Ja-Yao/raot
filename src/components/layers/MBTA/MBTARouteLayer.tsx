import { Layer, Source } from 'react-map-gl/mapbox';
import type { LineStringCollection } from 'types';

interface Props {
  shapes: LineStringCollection;
}

function MBTARouteLayer({ shapes }: Props) {

  return (
    <Source id='shape-source' type='geojson' data={shapes}>
      <Layer
        id='shape-layer'
        type='line'
        source='shape-source'
        slot='middle'
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 2, 40, 8],
          'line-color': ['case', ['has', 'color'], ['get', 'color'], 'transparent'],
          'line-emissive-strength': 0.75,
        }}
        minzoom={9}
      />
    </Source>
  );
}

export default MBTARouteLayer;
