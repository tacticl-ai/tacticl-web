import { createElement } from 'react';
import type { ReactElement } from 'react';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import MailIcon from '@mui/icons-material/Mail';
import XIcon from '@mui/icons-material/X';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import GitHubIcon from '@mui/icons-material/GitHub';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

export type ConnectionCategory = 'social' | 'media' | 'developer' | 'productivity';

export interface PlatformInfo {
  key: string;
  name: string;
  icon: ReactElement;
  color: string;
  category: ConnectionCategory;
}

export const platforms: PlatformInfo[] = [
  // Social
  { key: 'twitter', name: 'X (Twitter)', icon: createElement(XIcon), color: '#000000', category: 'social' },
  { key: 'instagram', name: 'Instagram', icon: createElement(InstagramIcon), color: '#E4405F', category: 'social' },
  { key: 'linkedin', name: 'LinkedIn', icon: createElement(LinkedInIcon), color: '#0A66C2', category: 'social' },
  { key: 'facebook', name: 'Facebook', icon: createElement(FacebookIcon), color: '#1877F2', category: 'social' },
  { key: 'tiktok', name: 'TikTok', icon: createElement(VideoLibraryIcon), color: '#010101', category: 'social' },
  // Media
  { key: 'google_photos', name: 'Google Photos', icon: createElement(PhotoLibraryIcon), color: '#4285F4', category: 'media' },
  { key: 'youtube', name: 'YouTube', icon: createElement(YouTubeIcon), color: '#FF0000', category: 'media' },
  // Developer
  { key: 'github', name: 'GitHub', icon: createElement(GitHubIcon), color: '#181717', category: 'developer' },
  { key: 'gmail', name: 'Gmail', icon: createElement(MailIcon), color: '#D14836', category: 'developer' },
];

export const categoryLabels: Record<ConnectionCategory, string> = {
  social: 'Social',
  media: 'Media',
  developer: 'Developer',
  productivity: 'Productivity',
};

export const categoryDescriptions: Record<ConnectionCategory, string> = {
  social: 'Publish and manage content across social platforms',
  media: 'Access photos and videos from media services',
  developer: 'Connect developer tools and email',
  productivity: 'Integrate with productivity and collaboration tools',
};

export function getPlatformsByCategory(category: ConnectionCategory): PlatformInfo[] {
  return platforms.filter((p) => p.category === category);
}

export function getPlatformInfo(key: string): PlatformInfo | undefined {
  return platforms.find(
    (p) => p.key === key.toLowerCase() || (key.toLowerCase() === 'x' && p.key === 'twitter'),
  );
}

export function getConnectionForPlatform<T extends { platform: string }>(
  connections: T[],
  platformKey: string,
): T | undefined {
  return connections.find(
    (c) =>
      c.platform.toLowerCase() === platformKey ||
      (platformKey === 'twitter' && c.platform.toLowerCase() === 'x'),
  );
}
