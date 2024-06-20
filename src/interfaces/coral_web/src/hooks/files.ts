import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { useMemo } from 'react';

import { File as CohereFile, FILE_TOOL_CATEGORY, ListFile, useCohereClient } from '@/cohere-client';
import { ACCEPTED_FILE_TYPES } from '@/constants';
import { useNotify } from '@/hooks/toast';
import { useListTools } from '@/hooks/tools';
import { useConversationStore, useFilesStore, useParamsStore } from '@/stores';
import { UploadingFile } from '@/stores/slices/filesSlice';
import { MessageType } from '@/types/message';
import { getFileExtension, isDefaultFileLoaderTool } from '@/utils';

class FileUploadError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export const useListFiles = (conversationId?: string, options?: { enabled?: boolean }) => {
  const cohereClient = useCohereClient();
  return useQuery<ListFile[], Error>({
    queryKey: ['listFiles', conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation ID not found');
      try {
        return await cohereClient.listFiles({ conversationId });
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFilesInConversation = () => {
  const {
    conversation: { messages },
  } = useConversationStore();
  const files = useMemo<CohereFile[]>(() => {
    return messages.reduce<CohereFile[]>((filesInConversation, msg) => {
      if (msg.type === MessageType.USER && msg.files) {
        filesInConversation.push(...msg.files);
      }
      return filesInConversation;
    }, []);
  }, [messages.length]);

  return { files };
};

export const useUploadFile = () => {
  const cohereClient = useCohereClient();

  return useMutation({
    mutationFn: async ({ file, conversationId }: { file: File; conversationId?: string }) => {
      try {
        return await cohereClient.uploadFile({ file, conversationId });
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
  });
};

export const useDeleteUploadedFile = () => {
  const cohereClient = useCohereClient();
  const queryClient = useQueryClient();

  return useMutation<void, void, { conversationId: string; fileId: string }>({
    mutationFn: async ({ conversationId, fileId }: { conversationId: string; fileId: string }) => {
      try {
        await cohereClient.deletefile({ conversationId, fileId });
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['listFiles'] });
    },
  });
};

export const useFileActions = () => {
  const {
    files: { uploadingFiles, composerFiles },
    addUploadingFile,
    addComposerFile,
    deleteUploadingFile,
    deleteComposerFile,
    clearComposerFiles,
    updateUploadingFileError,
  } = useFilesStore();
  const {
    params: { fileIds },
    setParams,
  } = useParamsStore();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutateAsync: deleteFile } = useDeleteUploadedFile();
  const { error } = useNotify();
  const { setConversation } = useConversationStore();

  const handleUploadFile = async (file?: File, conversationId?: string) => {
    if (!file) return;

    const uploadingFileId = new Date().valueOf().toString();
    const newUploadingFile: UploadingFile = {
      id: uploadingFileId,
      file,
      error: '',
      progress: 0,
    };

    const fileExtension = getFileExtension(file.name);
    const isAcceptedExtension = ACCEPTED_FILE_TYPES.some(
      (acceptedFile) => file.type === acceptedFile
    );
    if (!isAcceptedExtension) {
      newUploadingFile.error = `File type not supported (${fileExtension?.toUpperCase()})`;
      addUploadingFile(newUploadingFile);
      return;
    }

    addUploadingFile(newUploadingFile);

    try {
      const uploadedFile = await uploadFile({ file: newUploadingFile.file, conversationId });

      if (!uploadedFile?.id) {
        throw new FileUploadError('File ID not found');
      }

      deleteUploadingFile(uploadingFileId);
      const uploadedFileId = uploadedFile.id;
      const newFileIds = [...(fileIds ?? []), uploadedFileId];
      setParams({ fileIds: newFileIds });
      addComposerFile(uploadedFile);
      if (!conversationId) {
        setConversation({ id: uploadedFile.conversation_id });
      }

      return newFileIds;
    } catch (e: any) {
      updateUploadingFileError(newUploadingFile, e.message);
    }
  };

  const deleteUploadedFile = async ({
    conversationId,
    fileId,
  }: {
    conversationId: string;
    fileId: string;
  }) => {
    try {
      await deleteFile({ conversationId, fileId });
    } catch (e) {
      error('Unable to delete file');
    }
  };

  return {
    uploadingFiles,
    composerFiles,
    uploadFile: handleUploadFile,
    deleteFile: deleteUploadedFile,
    deleteUploadingFile,
    deleteComposerFile,
    clearComposerFiles,
  };
};

/**
 * @description Hook to fetch and enable the default file loader tool.
 * This tool must be on for files to work in the conversation.
 */
export const useDefaultFileLoaderTool = () => {
  const { data: tools } = useListTools();
  const { params, setParams } = useParamsStore();
  // Returns the first visible file loader tool from tools list
  const defaultFileLoaderTool = useMemo(
    () => tools?.find(isDefaultFileLoaderTool),
    [tools?.length]
  );

  const enableDefaultFileLoaderTool = () => {
    if (!defaultFileLoaderTool) return;
    const visibleFileToolNames = tools?.filter(isDefaultFileLoaderTool).map((t) => t.name) ?? [];

    const isDefaultFileLoaderToolEnabled = visibleFileToolNames.some((name) =>
      params.tools?.some((tool) => tool.name === name)
    );
    if (isDefaultFileLoaderToolEnabled) return;

    const newTools = uniqBy([...(params.tools ?? []), defaultFileLoaderTool], 'name');
    setParams({ tools: newTools });
  };

  return { defaultFileLoaderTool, enableDefaultFileLoaderTool };
};
