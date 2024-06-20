import { uniq } from 'lodash';
import React from 'react';

import { Tool } from '@/cohere-client';
import { FilesSection } from '@/components/Configuration/Files';
import { ToolsInfoBox } from '@/components/Configuration/ToolsInfoBox';
import { Checkbox, Switch, Text, Tooltip } from '@/components/Shared';
import { WelcomeGuideTooltip } from '@/components/WelcomeGuideTooltip';
import { useFilesInConversation } from '@/hooks/files';
import { useListTools } from '@/hooks/tools';
import { useConversationStore, useParamsStore } from '@/stores';
import { cn } from '@/utils';

/**
 * @description Tools tab content that shows a list of available tools and files
 */
export const Tools: React.FC<{ className?: string }> = ({ className = '' }) => {
  const {
    conversation: { id: conversationId },
  } = useConversationStore();
  const { files } = useFilesInConversation();
  return (
    <article className={cn('flex flex-col pb-10', className)}>
      <ToolSection />

      {/* File upload is not supported for conversarions without an id */}
      {conversationId && files.length > 0 && (
        <>
          <hr className="my-6 border-t border-marble-400" />
          <FilesSection />
        </>
      )}
    </article>
  );
};

/**
 * @description List of available tools.
 */
const ToolSection = () => {
  const { params, setParams } = useParamsStore();
  const { data } = useListTools();
  const { tools: paramTools } = params;
  const tools = data?.filter((t) => t.is_visible) ?? [];
  const enabledTools = paramTools ?? [];
  const name = `select-all-tools`;

  const checked = tools.every((tool) =>
    enabledTools.some((enabledTool) => enabledTool.name === tool.name)
  );

  const updateEnabledTools = (newTools: Tool[]) => {
    setParams({ tools: newTools });
  };

  const onSelectAllToggle = (checked: boolean) => {
    let updatedTools = [];
    if (checked) {
      updatedTools = uniq(enabledTools.concat(tools));
    } else {
      updatedTools = enabledTools.filter(
        (enabledTool) => !tools.find((tool) => tool.name === enabledTool.name)
      );
    }
    updateEnabledTools(updatedTools);
  };

  const handleToolToggle = (name: string, checked: boolean) => {
    const updatedTools = checked
      ? [...enabledTools, { name }]
      : enabledTools.filter((enabledTool) => enabledTool.name !== name);
    updateEnabledTools(updatedTools);
  };

  return (
    <section className="relative flex flex-col gap-y-5 px-5">
      <ToolsInfoBox />
      {tools.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <header className="flex items-center gap-1">
              <Text styleAs="label" className="font-medium">
                Tools
              </Text>
            </header>
            <Switch
              name={name}
              checked={checked}
              onChange={onSelectAllToggle}
              dataTestId={name}
              labelPosition="left"
              label="Select all"
              className="gap-x-3 text-volcanic-700"
              styleAs="p"
            />
          </div>
          <div className="flex flex-col gap-y-5">
            {tools.map(({ name, display_name, is_available, description, error_message }) => {
              const enabledTool = enabledTools.find(
                (enabledTool) => enabledTool.name.toLocaleLowerCase() === name.toLocaleLowerCase()
              );
              const checked = !!enabledTool;
              const disabled = !is_available;

              return (
                <div key={name} className="flex items-center gap-x-1">
                  <Checkbox
                    checked={checked}
                    onChange={(e) => {
                      handleToolToggle(name, e.target.checked);
                    }}
                    label={display_name}
                    name={name}
                    theme="secondary"
                    dataTestId={`checkbox-tool-${name}`}
                    labelClassName={cn({
                      'text-volcanic-500': disabled,
                    })}
                    disabled={disabled}
                  />
                  {(description || error_message) && (
                    <Tooltip
                      label={
                        <div className="flex flex-col gap-y-2">
                          {description && <Text>{description}</Text>}
                          {error_message && (
                            <Text className="text-danger-500">Error: {error_message}</Text>
                          )}
                        </div>
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      <WelcomeGuideTooltip step={2} className="fixed right-0 mr-3 mt-12 md:right-full md:mt-0" />
    </section>
  );
};
