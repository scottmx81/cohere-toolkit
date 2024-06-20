import { Transition } from '@headlessui/react';
import { useRouter } from 'next/router';

import { IconButton } from '@/components/IconButton';
import { KebabMenu, KebabMenuItem } from '@/components/KebabMenu';
import { Text } from '@/components/Shared';
import { WelcomeGuideTooltip } from '@/components/WelcomeGuideTooltip';
import { useAgent } from '@/hooks/agents';
import { useIsDesktop } from '@/hooks/breakpoint';
import { WelcomeGuideStep, useWelcomeGuideState } from '@/hooks/ftux';
import { useSession } from '@/hooks/session';
import {
  useCitationsStore,
  useConversationStore,
  useParamsStore,
  useSettingsStore,
} from '@/stores';
import { cn } from '@/utils';

const useHeaderMenu = ({
  conversationId,
  agentId,
}: {
  conversationId?: string;
  agentId?: string;
}) => {
  const { resetConversation } = useConversationStore();
  const { resetCitations } = useCitationsStore();
  const { userId } = useSession();
  const { data: agent } = useAgent({ agentId });
  const isAgentCreator = userId === agent?.user_id;

  const {
    settings: { isEditAgentPanelOpen },
    setSettings,
  } = useSettingsStore();
  const { resetFileParams } = useParamsStore();
  const router = useRouter();
  const { welcomeGuideState, progressWelcomeGuideStep, finishWelcomeGuide } =
    useWelcomeGuideState();

  const handleNewChat = () => {
    const assistantId = router.query.assistantId;

    const url = assistantId ? `/agents/?assistantId=${assistantId}` : '/agents';
    router.push(url, undefined, { shallow: true });
    resetConversation();
    resetCitations();
    resetFileParams();
  };

  const handleOpenSettings = () => {
    setSettings({ isConfigDrawerOpen: true });

    if (welcomeGuideState === WelcomeGuideStep.ONE && router.pathname === '/') {
      progressWelcomeGuideStep();
    } else if (welcomeGuideState !== WelcomeGuideStep.DONE) {
      finishWelcomeGuide();
    }
  };

  const handleOpenAgentDrawer = () => {
    setSettings({ isEditAgentPanelOpen: !isEditAgentPanelOpen });
  };

  const menuItems: KebabMenuItem[] = [
    ...(!!agent
      ? [
          {
            label: isAgentCreator ? 'Edit assistant' : 'About assistant',
            iconName: isAgentCreator ? 'edit' : 'information',
            onClick: handleOpenAgentDrawer,
          } as KebabMenuItem,
        ]
      : []),
    {
      label: 'Settings',
      iconName: 'settings',
      onClick: handleOpenSettings,
    },
    {
      label: 'New chat',
      iconName: 'new-message',
      onClick: handleNewChat,
    },
  ];

  return { menuItems, isAgentCreator, handleNewChat, handleOpenSettings, handleOpenAgentDrawer };
};

type Props = {
  isStreaming?: boolean;
  conversationId?: string;
  agentId?: string;
};

export const Header: React.FC<Props> = ({ isStreaming, agentId }) => {
  const {
    conversation: { id, name },
  } = useConversationStore();
  const {
    settings: { isConvListPanelOpen },
    setSettings,
    setIsConvListPanelOpen,
  } = useSettingsStore();

  const { welcomeGuideState } = useWelcomeGuideState();

  const isDesktop = useIsDesktop();
  const isMobile = !isDesktop;
  const { menuItems, isAgentCreator, handleNewChat, handleOpenSettings, handleOpenAgentDrawer } =
    useHeaderMenu({
      conversationId: id,
      agentId,
    });

  return (
    <div className={cn('flex h-header w-full min-w-0 items-center border-b', 'border-marble-400')}>
      <div
        className={cn('flex w-full flex-1 items-center justify-between px-5', { truncate: !!id })}
      >
        <span
          className={cn(
            'relative flex min-w-0 flex-grow items-center gap-x-1 overflow-hidden py-4'
          )}
        >
          {(isMobile || !isConvListPanelOpen) && (
            <Transition
              show={true}
              appear
              enter="delay-300 transition ease-in-out duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="delay-300 transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
              as="div"
            >
              <IconButton
                iconName="side-panel"
                onClick={() => {
                  setSettings({ isConfigDrawerOpen: false, isAgentsSidePanelOpen: false });
                  setIsConvListPanelOpen(true);
                }}
              />
            </Transition>
          )}

          <Text className="truncate" styleAs="p-lg" as="span">
            {name}
          </Text>
        </span>
        <span className="flex items-center gap-x-2 py-4 pl-4 md:pl-0">
          <KebabMenu className="md:hidden" items={menuItems} anchor="left start" />
          <IconButton
            tooltip={{ label: 'New chat', placement: 'bottom-end', size: 'md' }}
            className="hidden md:flex"
            iconName="new-message"
            onClick={handleNewChat}
          />
          <div className="relative">
            <IconButton
              tooltip={{ label: 'Settings', placement: 'bottom-end', size: 'md' }}
              className="hidden md:flex"
              onClick={handleOpenSettings}
              iconName="settings"
              disabled={isStreaming}
            />
            <WelcomeGuideTooltip
              step={1}
              className={cn('right-0 top-full mt-9', {
                'delay-1000': !welcomeGuideState || welcomeGuideState === WelcomeGuideStep.ONE,
              })}
            />
          </div>
          <IconButton
            tooltip={{
              label: isAgentCreator ? 'Edit assistant' : 'About assistant',
              placement: 'bottom-end',
              size: 'md',
            }}
            iconName={isAgentCreator ? 'edit' : 'information'}
            onClick={handleOpenAgentDrawer}
            className={cn('hidden', { 'md:flex': !!agentId })}
          />
        </span>
      </div>
    </div>
  );
};
