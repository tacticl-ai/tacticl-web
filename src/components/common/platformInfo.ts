import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import MailIcon from '@mui/icons-material/Mail';
import XIcon from '@mui/icons-material/X';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import GitHubIcon from '@mui/icons-material/GitHub';
import { createElement } from 'react';

export interface PlatformInfo {
  key: string;
  name: string;
  icon: React.ReactElement;
  color: string;
}

export const platforms: PlatformInfo[] = [
  { key: 'youtube', name: 'YouTube', icon: createElement(YouTubeIcon), color: '#FF0000' },
  { key: 'instagram', name: 'Instagram', icon: createElement(InstagramIcon), color: '#E4405F' },
  { key: 'gmail', name: 'Gmail', icon: createElement(MailIcon), color: '#D14836' },
  { key: 'twitter', name: 'X (Twitter)', icon: createElement(XIcon), color: '#000000' },
  { key: 'tiktok', name: 'TikTok', icon: createElement(VideoLibraryIcon), color: '#010101' },
  { key: 'linkedin', name: 'LinkedIn', icon: createElement(LinkedInIcon), color: '#0A66C2' },
  { key: 'facebook', name: 'Facebook', icon: createElement(FacebookIcon), color: '#1877F2' },
  { key: 'github', name: 'GitHub', icon: createElement(GitHubIcon), color: '#181717' },
];

export function getPlatformInfo(key: string): PlatformInfo | undefined {
  return platforms.find(
    (p) => p.key === key.toLowerCase() || (key.toLowerCase() === 'x' && p.key === 'twitter'),
  );
}
