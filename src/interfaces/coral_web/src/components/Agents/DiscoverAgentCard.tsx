import { Button, CoralLogo, Icon, Text } from '@/components/Shared';
import { cn } from '@/utils';
import { getCohereColor } from '@/utils/getCohereColor';

type Props = {
  name: string;
  description?: string;
  isBaseAgent?: boolean;
  id?: string;
};

/**
 * @description renders a card for an agent with the agent's name, description
 */
export const DiscoverAgentCard: React.FC<Props> = ({ id, name, description, isBaseAgent }) => {
  return (
    <article className="flex overflow-x-hidden rounded-lg border border-marble-400 bg-marble-200 p-4">
      <div className="flex h-full flex-grow flex-col items-start gap-y-2 overflow-x-hidden">
        <div className="flex w-full items-center gap-x-2">
          <div
            className={cn(
              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded duration-300',
              'truncate',
              id && getCohereColor(id),
              {
                'bg-secondary-400': isBaseAgent,
              }
            )}
          >
            {isBaseAgent ? (
              <CoralLogo style="secondary" />
            ) : (
              <Text className="uppercase text-white" styleAs="p-lg">
                {name[0]}
              </Text>
            )}
          </div>
          <Text as="h5" className="truncate">
            {name}
          </Text>
        </div>
        <Text className="line-clamp-2 flex-grow break-all text-left">{description}</Text>
        <Button
          className="ml-auto"
          href={isBaseAgent ? '/agents' : `/agents/${id}`}
          label={<Text className="text-green-700">Try now</Text>}
          kind="secondary"
          endIcon={<Icon name="arrow-up-right" className="text-green-700" />}
        />
      </div>
    </article>
  );
};
