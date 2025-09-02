import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default {
  title: 'Components/Navbar',
  component: Navbar,
};

const Template = (args) => (
  <MemoryRouter initialEntries={[args.initialPath || '/']}>
    <Navbar />
  </MemoryRouter>
);

export const Default = Template.bind({});
Default.args = {
  initialPath: '/', // Start at Home
};

export const MapPage = Template.bind({});
MapPage.args = {
  initialPath: '/map',
};

export const CavesPage = Template.bind({});
CavesPage.args = {
  initialPath: '/caves',
};

export const UploadPage = Template.bind({});
UploadPage.args = {
  initialPath: '/upload',
};
