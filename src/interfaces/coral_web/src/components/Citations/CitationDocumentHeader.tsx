import { IconButton } from '@/components/IconButton';
import { DocumentIcon, Icon, IconName, Text } from '@/components/Shared';
import { TOOL_FALLBACK_ICON, TOOL_ID_TO_DISPLAY_INFO, TOOL_INTERNET_SEARCH_ID } from '@/constants';
import { cn, getSafeUrl, getWebDomain } from '@/utils';

const getWebSourceName = (toolId?: string) => {
  if (!toolId) {
    return '';
  } else if (toolId === TOOL_INTERNET_SEARCH_ID) {
    return 'from the web';
  }
  return `from ${toolId}`;
};

type Props = {
  isExpandable: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  url: string;
  title: string | undefined;
  onToggleSnippet: VoidFunction;
  toolId?: string;
};

/**
 * @description Renders the document metadata of a citation. This includes the
 * icon, title, and url.
 *
 * If the citation has a web url, we prioritize showing the domain name and favicon.
 * This includes any connectors or the internet search tool.
 * If the citation is a file or tool, we show the file or tool name and icon.
 */
export const CitationDocumentHeader: React.FC<Props> = ({
  toolId,
  isExpandable,
  isSelected,
  isExpanded,
  url,
  title,
  onToggleSnippet,
}) => {
  // If the citation has a url we always show the favicon, domain name, and link.
  // This is the case for most connectors or the internet search tool.
  const hasUrl = url !== '';
  const safeUrl = hasUrl ? getSafeUrl(url) : undefined;

  const isFile = !toolId && !hasUrl && title;
  const isTool = !!toolId && !hasUrl && !!TOOL_ID_TO_DISPLAY_INFO[toolId];
  const toolDisplayInfo = toolId ? TOOL_ID_TO_DISPLAY_INFO[toolId] : undefined;
  // The title field is provided for web search documents and files, but not for tools.
  const displayTitle = (title || toolDisplayInfo?.name) ?? toolId;
  const icon: IconName | undefined = hasUrl
    ? undefined
    : isFile
    ? 'file'
    : isTool
    ? toolDisplayInfo?.icon ?? TOOL_FALLBACK_ICON
    : undefined;

  return (
    <div className="flex items-center justify-between gap-x-3">
      <a
        href={safeUrl}
        target="_blank"
        data-connectorid={toolId}
        className={cn('group flex w-full cursor-pointer gap-x-2 overflow-hidden', {
          'cursor-default': !safeUrl,
        })}
      >
        <DocumentIcon
          url={safeUrl ?? ''}
          icon={icon}
          iconKind={isSelected ? 'default' : 'outline'}
          className={cn(
            'bg-primary-500/[0.16] text-primary-800/80 transition-colors duration-200 ease-in-out',
            {
              'bg-secondary-700/20 text-secondary-800': !isSelected,
            }
          )}
        />
        <div className="flex min-w-0 flex-grow flex-col justify-center">
          {hasUrl ? (
            <div className={cn('flex font-medium', 'flex-wrap items-baseline gap-x-1')}>
              <Text
                as="span"
                styleAs="label-sm"
                className={cn(
                  'truncate',
                  'transition-colors duration-200 ease-in-out',
                  'text-primary-800',
                  {
                    'text-secondary-700': !isSelected,
                  }
                )}
              >
                {getWebDomain(safeUrl)}
              </Text>
              <Text
                as="span"
                styleAs="label-sm"
                className={cn('text-primary-800/80', 'hidden', {
                  flex: isSelected,
                })}
              >
                {getWebSourceName(toolId)}
              </Text>
            </div>
          ) : (
            <Text
              as="span"
              styleAs="label-sm"
              className={cn(
                'font-medium',
                'transition-colors duration-200 ease-in-out',
                'text-primary-800',
                {
                  'text-secondary-700': !isSelected,
                }
              )}
            >
              {isFile ? 'File' : 'Tool'}
            </Text>
          )}

          <div className={cn('flex text-primary-900', { 'group-hover:text-primary-600': safeUrl })}>
            <Text
              as="span"
              styleAs="label"
              className={cn('truncate font-medium transition-colors duration-200 ease-in-out', {
                'text-secondary-800': !isSelected,
              })}
            >
              {displayTitle}
            </Text>
            <Icon
              name="arrow-up-right"
              className={cn('ml-1 hidden', 'transition-colors duration-200 ease-in-out', {
                'text-secondary-800': !isSelected,
                'group-hover:block': safeUrl,
              })}
            />
          </div>
        </div>
      </a>
      {isExpandable && (
        <IconButton
          iconName="chevron-down"
          iconClassName={cn(
            'text-primary-800 transition duration-200 delay-75 ease-in-out group-hover:text-primary-900',
            'hidden lg:flex',
            {
              'rotate-180': isExpanded,
            }
          )}
          onClick={onToggleSnippet}
        />
      )}
    </div>
  );
};
