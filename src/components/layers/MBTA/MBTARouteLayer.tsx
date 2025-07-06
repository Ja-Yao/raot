import * as turf from '@turf/turf';
import { useEffect } from 'react';
import { Layer, Source, useMap } from 'react-map-gl/mapbox';
import type { LineStringCollection } from 'types';

interface Props {
  shapes: LineStringCollection;
  setIsMBTAVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

function MBTARouteLayer({ shapes, setIsMBTAVisible }: Props) {
  const { current: map } = useMap();

  useEffect(() => {
    const checkVisibility = () => {
      const mapBounds = map?.getCenter().toArray();
      const bufferedBBox = turf.buffer(turf.bboxPolygon(turf.bbox(shapes)), 15, { units: 'kilometers' });
      const shapesBBox = turf.bboxPolygon(turf.bbox(bufferedBBox!));

      if (turf.booleanPointInPolygon(turf.getCoord(turf.point(mapBounds as number[])), shapesBBox)) {
        setIsMBTAVisible(true);
      } else {
        setIsMBTAVisible(false);
      }
    };

    checkVisibility();
  });

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
