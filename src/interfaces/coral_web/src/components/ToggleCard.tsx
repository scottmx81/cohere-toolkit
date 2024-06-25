import React from 'react';

import { Icon, IconName, Input, Switch, Text } from '@/components/Shared';

type Props = {
  checked: boolean;
  disabled: boolean;
  icon: IconName;
  label: string;
  description: string;
  onToggle: (checked: boolean) => void;
  errorMessage?: string | null;
  inputOptions?: {
    label: string;
    placeholder: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    description?: string;
    testId?: string;
    disabled?: boolean;
  };
};

/**
 * @description Styled card for displaying information about a tool/connector with a toggle.
 */
export const ToggleCard: React.FC<Props> = ({
  checked,
  disabled,
  icon,
  label,
  description,
  inputOptions,
  errorMessage,
  onToggle,
}) => {
  return (
    <div className="flex flex-col gap-y-2 rounded-md border border-marble-400 bg-marble-200 p-3">
      <div className="flex items-start gap-x-6">
        <div className="flex flex-grow flex-col gap-y-2">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded bg-secondary-500/25">
            <Icon name={icon} kind="outline" size="sm" className="text-p text-secondary-600" />
          </div>
          <Text styleAs="label" as="span" className="font-medium">
            {label}
          </Text>
          <Text styleAs="p-sm">{description}</Text>
          {errorMessage && (
            <Text styleAs="p-sm" className="text-danger-500">
              Error: {errorMessage}
            </Text>
          )}
        </div>
        {!disabled && (
          <Switch
            displayChecked
            checked={checked}
            onChange={onToggle}
            className="flex-shrink-0 gap-0"
          />
        )}
      </div>
      {inputOptions && (
        <Input
          label="Site (Optional)"
          placeholder="Ground on 1 domain e.g. wikipedia.org"
          data-testid={inputOptions.testId}
          value={inputOptions.value}
          description={inputOptions.description}
          onChange={inputOptions.onChange}
          disabled={inputOptions.disabled || disabled}
        />
      )}
    </div>
  );
};
