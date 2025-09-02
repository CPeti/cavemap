import React from 'react';
import NavLink from '../components/NavLink';

export default {
  title: 'Components/NavLink',
  component: NavLink,
  argTypes: {
    current: { control: 'boolean' },
    isMobile: { control: 'boolean' },
    href: { control: 'text' },
    children: { control: 'text' },
  },
};

const Template = (args) => <NavLink {...args} />;

export const Default = Template.bind({});
Default.args = {
  href: '#',
  children: 'Home',
  current: false,
  isMobile: false,
};

export const Current = Template.bind({});
Current.args = {
  href: '#',
  children: 'Home',
  current: true,
  isMobile: false,
};

export const MobileDefault = Template.bind({});
MobileDefault.args = {
  href: '#',
  children: 'Home',
  current: false,
  isMobile: true,
};

export const MobileCurrent = Template.bind({});
MobileCurrent.args = {
  href: '#',
  children: 'Home',
  current: true,
  isMobile: true,
};
