import { getCenterOfLineStringCollection } from '@/helpers/linestrings';
import { useMemo, useState } from 'react';
import { useFilter, type Key } from 'react-aria-components';
import { useMap } from 'react-map-gl/mapbox';
import { supportedSystems, type LineStringCollection, type SupportedSystemId, type SupportedSystemName, type TransitOption } from '../../types';
import { ComboBox } from './ui/combo-box';

interface TransitSelectorProps {
  shapes: LineStringCollection[];
}

function TransitSelector({ shapes }: TransitSelectorProps) {
  const { current: map } = useMap();
  const [selectedKey, setSelectedKey] = useState<Key | null>(null);
  const [inputValue, setInputValue] = useState('');

  const SupportedSystemLocations = {
    [supportedSystems.mbta as string]: getCenterOfLineStringCollection(shapes[0]),
  } as const;

  const items: TransitOption[] = (Object.entries(supportedSystems) as [SupportedSystemId, SupportedSystemName][]).map(
    ([id, name]) => ({ id, name })
  );

  const { contains } = useFilter({ sensitivity: 'base' });
  let filteredItems = useMemo(() => items.filter((item) => contains(item.name, inputValue)), [items, inputValue]);

  return (
    <div className='absolute top-4 left-2 z-1 min-w-[376px]'>
      <ComboBox
        placeholder='Select a transit network...'
        aria-label='transit-networks'
        menuTrigger='focus'
        items={filteredItems}
        selectedKey={selectedKey}
        inputValue={inputValue}
        onSelectionChange={(key) => {
          setSelectedKey(key as SupportedSystemId); // cast needed here
          const selectedItem = items.find((item) => item.id === key);
          if (selectedItem) {
            setInputValue(selectedItem.name);
            map?.flyTo({
              center: [
                SupportedSystemLocations[selectedItem.name].lng,
                SupportedSystemLocations[selectedItem.name].lat,
              ],
              curve: 1.42,
              zoom: 12,
              essential: true,
            });
          }
        }}
        onInputChange={(value) => {
          setInputValue(value);
          setSelectedKey(null);
        }}
      >
        <ComboBox.Input />
        <ComboBox.List>
          {(item: TransitOption) => (
            <ComboBox.Option id={item.id} textValue={item.name}>
              <ComboBox.Label>{item.name}</ComboBox.Label>
            </ComboBox.Option>
          )}
        </ComboBox.List>
      </ComboBox>
    </div>
  );
}

export default TransitSelector;
