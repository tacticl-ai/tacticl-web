import { useState, useRef, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Drawer from '@mui/material/Drawer';
import Badge from '@mui/material/Badge';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HistoryIcon from '@mui/icons-material/History';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { formatDistanceToNow } from 'date-fns';
import { conversationsApi } from '../api/conversations';
import type { AgentAsk, SparkType, AgentAction, ConversationStatus } from '../api/types';
import { useAgentHistory, useAgentActivity, useAgentModels, useConfirmAction, usePendingAsks, useCancelAsk } from '../hooks/useAgent';
import TopBar from '../components/layout/TopBar';
import TacticlLogo from '../components/TacticlLogo';
import Alert from '@mui/material/Alert';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import MuiLink from '@mui/material/Link';
import { useSparkProgressStore } from '../hooks/useSparkProgress';
import { useHandleOAuthCallback, validateOAuthState } from '../hooks/useConnections';
import ActionCard from '../components/chat/ActionCard';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  toolsInvoked?: string[];
  sparkId?: string;
  sparkStatus?: string;
  conversationStatus?: ConversationStatus;
  confirmationId?: string;
  confirmationHandled?: boolean;
  loading?: boolean;
  delegated?: boolean;
  deviceName?: string;
  actions?: AgentAction[];
  completedActions?: Set<number>;
  originalCommand?: string;
  resumed?: boolean;
}

const SUGGESTIONS = [
  'Add a /health endpoint to the API',
  'Audit cloud costs and find savings',
  'Review open PRs and summarize changes',
  'Run security scan on all repos',
];

const PENDING_ACTION_KEY = 'tacticl_chat_pending_action';

interface PendingActionState {
  originalCommand: string;
  sessionId: string;
  sparkType?: SparkType | '';
  model?: string;
}

function loadPendingAction(): PendingActionState | null {
  const raw = sessionStorage.getItem(PENDING_ACTION_KEY);
  sessionStorage.removeItem(PENDING_ACTION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

const SPARK_TYPES: Array<{ value: SparkType | ''; label: string }> = [
  { value: '', label: 'Auto' },
  { value: 'code', label: 'Code' },
  { value: 'social', label: 'Social' },
  { value: 'research', label: 'Research' },
  { value: 'devops', label: 'DevOps' },
  { value: 'creative', label: 'Creative' },
  { value: 'data', label: 'Data' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [sparkType, setSparkType] = useState<SparkType | ''>('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: history = [], isLoading: historyLoading } = useAgentHistory();
  const { data: activity } = useAgentActivity();
  const { data: models = [] } = useAgentModels();
  const { data: pendingAsks = [] } = usePendingAsks();
  const confirmAction = useConfirmAction();
  const cancelAsk = useCancelAsk();

  // Get live checkpoint messages from WebSocket to show inline notifications
  const allSparkProgress = useSparkProgressStore((s) => s.sparkProgress);
  const checkpointAlerts: Array<{ sparkId: string; message: string }> = [];
  for (const [sparkId, msgs] of Object.entries(allSparkProgress)) {
    for (const m of msgs) {
      if (m.type === 'checkpoint') {
        checkpointAlerts.push({ sparkId, message: m.message });
      }
    }
  }

  const activeAskCount = pendingAsks.length;

  const [searchParams, setSearchParams] = useSearchParams();
  const handleOAuthCallback = useHandleOAuthCallback();

  useEffect(() => {
    const code = searchParams.get('code');
    const platform = searchParams.get('platform');
    const state = searchParams.get('state');
    const codeVerifier = searchParams.get('code_verifier') || undefined;

    if (code && platform) {
      if (!validateOAuthState(state)) {
        setSearchParams({});
        return;
      }
      const redirectUri = window.location.origin + '/chat';
      handleOAuthCallback.mutate(
        { platform, code, redirectUri, codeVerifier },
        {
          onSettled: () => setSearchParams({}),
          onSuccess: () => {
            const pending = loadPendingAction();
            if (pending) {
              sendMessage(pending.originalCommand);
            }
          },
        },
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Watch for spark completion/failure from WebSocket to update delegated chat messages
  useEffect(() => {
    setMessages((prev) => {
      let changed = false;
      const updated = prev.map((m) => {
        if (!m.sparkId || !m.delegated || !m.loading) return m;
        const progress = allSparkProgress[m.sparkId];
        if (!progress) return m;

        const completed = progress.find((p) => p.type === 'completed');
        if (completed) {
          changed = true;
          const res = completed.result as Record<string, unknown> | undefined;
          const responseText = res?.responseText
            ? String(res.responseText)
            : res?.summary
              ? String(res.summary)
              : 'Spark completed on ' + (m.deviceName || 'device');
          return { ...m, text: responseText, loading: false, sparkStatus: 'COMPLETED' };
        }

        const failed = progress.find((p) => p.type === 'failed');
        if (failed) {
          changed = true;
          const res = failed.result as Record<string, unknown> | undefined;
          const errorText = res?.error ? String(res.error) : failed.message || 'Spark failed';
          return { ...m, text: errorText, loading: false, sparkStatus: 'FAILED' };
        }

        // Update status from latest progress message
        const latest = progress[progress.length - 1];
        if (latest && latest.message !== m.sparkStatus) {
          changed = true;
          return { ...m, sparkStatus: latest.message };
        }

        return m;
      });
      return changed ? updated : prev;
    });
  }, [allSparkProgress]);

  const handleConfirm = (messageId: string, confirmationId: string, approved: boolean) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, confirmationHandled: true } : m,
      ),
    );
    confirmAction.mutate({ confirmationId, approved });
  };

  const handleActionComplete = useCallback((messageId: string, actionIndex: number) => {
    setMessages((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== messageId || !m.actions) return m;
        const newCompleted = new Set(m.completedActions);
        newCompleted.add(actionIndex);

        const allDone = m.actions.length === newCompleted.size;

        if (allDone && m.originalCommand && !m.resumed) {
          setTimeout(() => sendMessage(m.originalCommand), 500);
          return { ...m, completedActions: newCompleted, resumed: true };
        }

        return { ...m, completedActions: newCompleted };
      });
      return updated;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: msg,
    };
    const loadingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'agent',
      text: '',
      loading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput('');
    setSending(true);

    try {
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const session = await conversationsApi.create(msg);
        currentConversationId = session.id;
        setConversationId(session.id);
      }

      const response = await conversationsApi.sendMessage(currentConversationId, msg);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                text: response.content,
                sparkId: response.sparkId,
                sparkStatus: response.sparkId ? response.sessionStatus : undefined,
                conversationStatus: response.sessionStatus,
                loading: false,
              }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                text: "I couldn't process that right now. The backend may be starting up — try again in a moment.",
                loading: false,
              }
            : m,
        ),
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleHistoryClick = (commandText: string) => {
    setInput(commandText);
    setHistoryOpen(false);
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  const topBarActions = (
    <>
      {activeAskCount > 0 ? (
        <Badge badgeContent={activeAskCount} color="primary">
          <PendingActionsIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </Badge>
      ) : null}
      <IconButton size="small" title="History" onClick={() => setHistoryOpen(true)}>
        <HistoryIcon fontSize="small" />
      </IconButton>
    </>
  );

  return (
    <>
    <TopBar title="Chat" actions={topBarActions} />
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, mx: -3, mb: -3 }}>
      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 3,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Activity stats */}
        {activity && (
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
            {[
              { label: 'Recent Sparks', value: activity.recentAsks?.length ?? 0 },
              { label: 'Active', value: activity.activeAsks?.length ?? 0 },
            ].map((stat) => (
              <Box
                key={stat.label}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(108, 99, 255, 0.08)',
                  border: '1px solid rgba(108, 99, 255, 0.15)',
                  minWidth: 100,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {stat.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.2 }}>
                  {stat.value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Pending asks */}
        {pendingAsks.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {pendingAsks.map((ask: AgentAsk) => (
              <Box
                key={ask.id}
                sx={{
                  p: 2,
                  mb: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 152, 0, 0.08)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {ask.question}
                </Typography>
                {ask.options.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                    Options: {ask.options.join(' · ')}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => confirmAction.mutate({ confirmationId: ask.id, approved: true })}
                    sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: 2 }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => cancelAsk.mutate(ask.id)}
                    sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: 2 }}
                  >
                    Dismiss
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Checkpoint notifications from WebSocket */}
        {checkpointAlerts.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {checkpointAlerts.map((alert, idx) => (
              <Alert
                key={`${alert.sparkId}-${idx}`}
                severity="warning"
                sx={{ mb: 1 }}
                action={
                  <MuiLink
                    component={RouterLink}
                    to={`/sparks/${alert.sparkId}`}
                    sx={{ fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    View Checkpoint
                  </MuiLink>
                }
              >
                {alert.message}
              </Alert>
            ))}
          </Box>
        )}

        {isEmpty ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            <TacticlLogo size={80} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              What can I help you with?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480, textAlign: 'center' }}>
              Describe what you need done in plain English. I'll create a Spark, route it to the right
              device, and get it done.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1 }}>
              {SUGGESTIONS.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  variant="outlined"
                  onClick={() => sendMessage(s)}
                  sx={{
                    borderColor: 'rgba(108, 99, 255, 0.3)',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(108, 99, 255, 0.08)' },
                  }}
                />
              ))}
            </Box>
          </Box>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onConfirm={handleConfirm}
                onActionComplete={handleActionComplete}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </Box>

      {/* Input area */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 800, mx: 'auto', mb: 1 }}>
          {SPARK_TYPES.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              size="small"
              variant={sparkType === t.value ? 'filled' : 'outlined'}
              color={sparkType === t.value ? 'primary' : 'default'}
              onClick={() => setSparkType(t.value)}
              sx={{ height: 26, fontSize: '0.75rem' }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', maxWidth: 800, mx: 'auto' }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="Describe what you need done..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'background.default',
              },
            }}
          />
          {models.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: 3,
                  bgcolor: 'background.default',
                  fontSize: '0.75rem',
                  height: 44,
                  '& .MuiSelect-select': { py: 1 },
                }}
              >
                <MenuItem value="">
                  <Typography variant="caption" color="text.secondary">Auto</Typography>
                </MenuItem>
                {models.map((model) => (
                  <MenuItem key={model} value={model}>
                    <Typography variant="caption">{model}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <IconButton
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: 44,
              height: 44,
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': { bgcolor: 'rgba(108, 99, 255, 0.3)', color: 'rgba(255,255,255,0.3)' },
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>

    {/* History Drawer */}
    <Drawer
      anchor="right"
      open={historyOpen}
      onClose={() => setHistoryOpen(false)}
      PaperProps={{
        sx: { width: 360, bgcolor: 'background.paper' },
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          History
        </Typography>
      </Box>
      {historyLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : history.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No commands yet
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {history.map((entry, idx) => (
            <Box key={entry.id}>
              <ListItemButton onClick={() => handleHistoryClick(entry.commandText)} sx={{ py: 1.5, px: 2 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }} noWrap>
                      {entry.commandText}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {entry.responseText}
                      </Typography>
                      {entry.toolsInvoked.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {entry.toolsInvoked.map((tool) => (
                            <Chip
                              key={tool}
                              label={tool}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.6rem',
                                bgcolor: '#1A1A1A',
                                color: 'text.secondary',
                              }}
                            />
                          ))}
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        {entry.executionTimeMs > 0 && (
                          <Typography variant="caption" color="text.disabled">
                            {(entry.executionTimeMs / 1000).toFixed(1)}s
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.disabled">
                          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItemButton>
              {idx < history.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Drawer>
    </>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  onConfirm: (messageId: string, confirmationId: string, approved: boolean) => void;
  onActionComplete: (messageId: string, actionIndex: number) => void;
}

function MessageBubble({ message, onConfirm, onActionComplete }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const showConfirmation = !isUser && message.confirmationId && !message.confirmationHandled;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
        maxWidth: '100%',
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          px: 2,
          py: 1.5,
          borderRadius: '16px',
          borderBottomRightRadius: isUser ? '4px' : '16px',
          borderBottomLeftRadius: isUser ? '16px' : '4px',
          bgcolor: isUser ? 'primary.main' : '#2C2C2C',
          color: '#FFFFFF',
        }}
      >
        {message.loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
            <CircularProgress size={16} sx={{ color: 'primary.main' }} />
            <Typography variant="body2" color="text.secondary">
              {message.delegated
                ? `Routing to ${message.deviceName || 'device'}...`
                : 'Thinking...'}
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ fontSize: '0.9375rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {message.text}
            </Typography>
            {message.toolsInvoked && message.toolsInvoked.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {message.toolsInvoked.map((tool) => (
                  <Chip
                    key={tool}
                    label={tool}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.625rem',
                      bgcolor: '#1A1A1A',
                      color: 'text.secondary',
                    }}
                  />
                ))}
              </Box>
            )}
            {message.sparkId && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                  label={`Spark: ${message.sparkStatus || 'created'}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 24, fontSize: '0.6875rem' }}
                />
              </Box>
            )}
            {!message.sparkId && message.conversationStatus === 'PROPOSING' && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                  label="Plan ready — reply to approve"
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ height: 24, fontSize: '0.6875rem' }}
                />
              </Box>
            )}
            {message.actions && message.actions.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                {message.actions.map((action, idx) => (
                  <ActionCard
                    key={idx}
                    action={action}
                    onComplete={() => onActionComplete(message.id, idx)}
                  />
                ))}
              </Box>
            )}
            {showConfirmation && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onConfirm(message.id, message.confirmationId!, true)}
                  sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: 2, py: 0.5 }}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onConfirm(message.id, message.confirmationId!, false)}
                  sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: 2, py: 0.5 }}
                >
                  Reject
                </Button>
              </Box>
            )}
            {message.confirmationHandled && (
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                Decision submitted
              </Typography>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
