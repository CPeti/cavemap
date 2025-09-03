import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import MapSidebar from '../components/MapSidebar';

export default {
  title: 'Components/MapSidebar',
  component: MapSidebar,
};

const Template = (args) => (
  <MemoryRouter>
    <div className="relative w-full h-screen bg-gray-100">
      <MapSidebar {...args} />
    </div>
  </MemoryRouter>
);

export const Default = Template.bind({});
Default.args = {
  isOpen: true,
  selectedCave: {
    id: '1',
    name: 'Crystal Cavern',
    code: 'CC-001',
    depth: 450,
    length: 1200,
    description:
      'A spectacular cave system with stunning crystal formations and underground rivers. This is mock data for Storybook testing.',
    lat: 42.42,
    lng: 18.76,
  },
  onClose: () => alert('Sidebar closed'),
};

export const Closed = Template.bind({});
Closed.args = {
  ...Default.args,
  isOpen: false,
};

export const WithoutDescription = Template.bind({});
WithoutDescription.args = {
  ...Default.args,
  selectedCave: {
    id: '2',
    name: 'Echo Cave',
    code: 'EC-002',
    depth: 200,
    length: 600,
    lat: 42.41,
    lng: 18.77,
  },
};
