import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TelegramIcon from '@mui/icons-material/Telegram';
import TopBar from '../components/layout/TopBar';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import {
  useTelegramStatus,
  useIssueTelegramLink,
  useUnlinkTelegram,
} from '../hooks/useTelegram';

export default function TelegramLinkPage() {
  const { data: status, isLoading, isError, refetch } = useTelegramStatus();
  const issueLink = useIssueTelegramLink();
  const unlink = useUnlinkTelegram();
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const linked = status?.linked ?? [];
  const token = issueLink.data?.token;
  const botUrl = issueLink.data?.botUrl;

  return (
    <>
      <TopBar
        title="Telegram"
        actions={
          <Button
            variant="contained"
            startIcon={<LinkIcon />}
            size="small"
            onClick={() => issueLink.mutate()}
            disabled={issueLink.isPending}
          >
            {issueLink.isPending ? 'Generating…' : 'Generate link token'}
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading Telegram link status…" />
      ) : isError ? (
        <ErrorState message="Couldn't load Telegram status." onRetry={refetch} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Active token panel — only shown right after Generate */}
          {token && botUrl && (
            <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <TelegramIcon color="primary" />
                  <Typography variant="h6">Your link token is ready</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Valid for 15 minutes. Open Telegram, DM the bot, and send{' '}
                  <code>/start &lt;token&gt;</code> to complete the link.
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <code
                    style={{
                      padding: '6px 10px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)',
                      fontSize: 13,
                      flex: 1,
                      overflowX: 'auto',
                    }}
                  >
                    /start {token}
                  </code>
                  <Tooltip title={copied ? 'Copied!' : 'Copy /start command'}>
                    <IconButton size="small" onClick={() => handleCopy(`/start ${token}`)}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Button
                  href={botUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  color="primary"
                  startIcon={<OpenInNewIcon />}
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Open Telegram
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                  The "Open Telegram" button uses a deep link that pre-fills the /start
                  command — easiest path on mobile.
                </Typography>
              </CardContent>
            </Card>
          )}

          {issueLink.isError && (
            <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
              <CardContent>
                <Typography color="error">Failed to generate token. Try again.</Typography>
              </CardContent>
            </Card>
          )}

          {/* Linked chats list */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Linked Telegram accounts
              </Typography>
              {linked.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No Telegram chats linked yet. Generate a token above and redeem it in a
                  DM with the bot.
                </Typography>
              ) : (
                <Stack divider={<Divider flexItem />} spacing={1}>
                  {linked.map((chat) => (
                    <Stack
                      key={chat.chatId}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ py: 1 }}
                    >
                      <Box>
                        <Typography variant="body1">
                          {chat.username ? `@${chat.username}` : `chat ${chat.chatId}`}
                        </Typography>
                        {chat.linkedAt && (
                          <Typography variant="caption" color="text.secondary">
                            Linked {new Date(chat.linkedAt).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip size="small" label="Active" color="success" />
                        <Tooltip title="Unlink">
                          <IconButton
                            size="small"
                            onClick={() => unlink.mutate(chat.chatId)}
                            disabled={unlink.isPending}
                          >
                            <LinkOffIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </>
  );
}
