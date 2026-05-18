import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { telegramApi } from '../api/telegram';

export function useTelegramStatus() {
  return useQuery({
    queryKey: ['telegram', 'status'],
    queryFn: () => telegramApi.status(),
  });
}

export function useIssueTelegramLink() {
  return useMutation({
    mutationFn: () => telegramApi.issueLink(),
  });
}

export function useUnlinkTelegram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: number) => telegramApi.unlink(chatId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['telegram', 'status'] }),
  });
}
