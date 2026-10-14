import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStudyProgress, StudyState } from "../endpoints/study-progress_GET.schema";
import { postStudyProgress } from "../endpoints/study-progress_POST.schema";
import { useAuth } from "./useAuth";

const EMPTY_STATE: StudyState = { version: 1, minutes: 0, daily: {}, words: {}, mistakes: [] };

export function useStudyProgress() {
  const { authState } = useAuth();
  const userId = authState.type === "authenticated" ? authState.user.id : null;
  const queryClient = useQueryClient();
  const queryKey = ["study-progress", userId];
  const lock = useRef(false);
  const mutation = useMutation({
    mutationFn: ({ state, revision }: { state: StudyState; revision: number }) => postStudyProgress({ state, revision }),
    onMutate: async () => { await queryClient.cancelQueries({ queryKey }); },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(queryKey, { state: variables.state, revision: result.revision });
    },
    onError: async () => { await queryClient.invalidateQueries({ queryKey }); },
  });
  const query = useQuery({
    queryKey, queryFn: getStudyProgress, enabled: userId !== null,
    retry: 1,
    refetchOnWindowFocus: !mutation.isPending,
    refetchInterval: mutation.isPending ? false : 30000,
  });
  const saveAsync = async (state: StudyState) => {
    if (lock.current) throw new Error("上一条记录正在保存，请稍候。");
    if (!query.data || query.isError) throw new Error("请先重新读取云端进度。");
    lock.current = true;
    try { await mutation.mutateAsync({ state, revision: query.data.revision }); }
    finally { lock.current = false; }
  };
  const save = (state: StudyState) => { void saveAsync(state).catch(() => {}); };
  return { ...query, state: query.data?.state ?? EMPTY_STATE, save, saveAsync, saving: mutation.isPending, saveError: mutation.error };
}

