import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sparksApi } from '../api/sparks';
import type { CreateSparkRequest, UpdateSparkRequest } from '../api/types';

export function useSparks(params?: { status?: string }) {
  return useQuery({
    queryKey: ['sparks', params],
    queryFn: () => sparksApi.list(params),
    refetchInterval: 10_000,
  });
}

export function useSpark(id: string) {
  return useQuery({
    queryKey: ['sparks', id],
    queryFn: () => sparksApi.get(id),
    refetchInterval: 5_000,
  });
}

export function useSparkTactics(sparkId: string) {
  return useQuery({
    queryKey: ['sparks', sparkId, 'tactics'],
    queryFn: () => sparksApi.tactics(sparkId),
    refetchInterval: 5_000,
  });
}

export function useSparkLogs(sparkId: string) {
  return useQuery({
    queryKey: ['sparks', sparkId, 'logs'],
    queryFn: () => sparksApi.logs(sparkId),
  });
}

export function useCreateSpark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSparkRequest) => sparksApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sparks'] }),
  });
}

export function useUpdateSpark(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSparkRequest) => sparksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sparks'] }),
  });
}

export function useCancelSpark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sparksApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sparks'] }),
  });
}

export function useRunSpark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sparksApi.run(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sparks'] }),
  });
}
