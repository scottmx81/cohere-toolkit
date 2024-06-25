import { Transition } from '@headlessui/react';
import Link from 'next/link';

import { IconButton } from '@/components/IconButton';
import { Button, Icon, IconProps, Logo, Tooltip } from '@/components/Shared';
import { env } from '@/env.mjs';
import { useIsDesktop } from '@/hooks/breakpoint';
import { useAgentsStore, useSettingsStore } from '@/stores';
import { cn } from '@/utils';

/**
 * @description This component renders the agents side panel.
 * It contains the logo and a button to expand or collapse the panel.
 * It also renders the children components that are passed to it.
 */
export const AgentsSidePanel: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { setSettings, setIsConvListPanelOpen } = useSettingsStore();
  const {
    agents: { isAgentsSidePanelOpen },
    setAgentsSidePanelOpen,
  } = useAgentsStore();
  const isDesktop = useIsDesktop();
  const isMobile = !isDesktop;

  const handleToggleAgentsSidePanel = () => {
    setIsConvListPanelOpen(false);
    setSettings({ isConfigDrawerOpen: false });
    setAgentsSidePanelOpen(!isAgentsSidePanelOpen);
  };

  const navigationItems: {
    label: string;
    icon: IconProps['name'];
    href?: string;
    onClick?: () => void;
  }[] = [
    { label: 'Create Assistant ', icon: 'add', href: '/agents/new' },
    { label: 'Discover', icon: 'compass', href: '/agents/discover' },
  ];

  return (
    <Transition
      show={isAgentsSidePanelOpen || isDesktop}
      as="div"
      className={cn('absolute bottom-0 left-0 top-0 z-30 lg:static', {
        'right-1/4': isAgentsSidePanelOpen,
      })}
      enter="transition-all transform ease-in-out duration-500"
      enterFrom="-translate-x-full"
      enterTo="translate-x-0"
      leave="transition-all transform ease-in-out duration-500"
      leaveFrom="translate-x-0 opacity-100"
      leaveTo="-translate-x-full opacity-0"
    >
      <div
        className={cn(
          'h-full px-4 py-6',
          'flex flex-grow flex-col gap-y-8 rounded-lg border',
          'border-marble-400 bg-marble-100',
          'transition-[min-width,max-width]',
          {
            'min-w-agents-panel-collapsed max-w-agents-panel-collapsed': !isAgentsSidePanelOpen,
            'min-w-agents-panel-expanded max-w-agents-panel-expanded lg:min-w-agents-panel-expanded-lg lg:max-w-agents-panel-expanded-lg':
              isAgentsSidePanelOpen,
          }
        )}
      >
        <div
          className={cn('flex flex-shrink-0 items-center', {
            'justify-between gap-x-3': isAgentsSidePanelOpen || isMobile,
            'justify-center': !isAgentsSidePanelOpen && isDesktop,
          })}
        >
          <Transition
            show={isAgentsSidePanelOpen || isMobile}
            as="div"
            enter="transition-all transform ease-in-out duration-200"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
          >
            <Link href="/" shallow>
              <div className="mr-3 flex items-baseline">
                <Logo hasCustomLogo={env.NEXT_PUBLIC_HAS_CUSTOM_LOGO === 'true'} />
              </div>
            </Link>
          </Transition>

          <IconButton
            iconName="close-drawer"
            onClick={handleToggleAgentsSidePanel}
            className={cn('transition delay-100 duration-200 ease-in-out', {
              'rotate-180 transform text-secondary-700': isAgentsSidePanelOpen || isMobile,
            })}
          />
        </div>
        <div className="flex-grow overflow-y-auto">{children}</div>
        {isAgentsSidePanelOpen || isMobile ? (
          <div className="flex flex-shrink-0 flex-col gap-y-4">
            {navigationItems.map(({ label, icon, href, onClick }) => (
              <Button
                key={label}
                kind="secondary"
                className="truncate text-secondary-900"
                startIcon={<Icon name={icon} kind="outline" className="text-secondary-900" />}
                label={label}
                href={href}
                shallow
                onClick={onClick}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-shrink-0 flex-col gap-y-4">
            {navigationItems.map(({ label, icon, href, onClick }) => (
              <Tooltip key={label} label={label} hover placement="right">
                <IconButton
                  iconName={icon}
                  iconClassName="text-secondary-900"
                  shallow
                  onClick={onClick}
                  href={href}
                  className="w-full text-secondary-900"
                />
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </Transition>
  );
};
