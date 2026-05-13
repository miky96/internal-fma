import React, { useEffect, useState } from 'react';
import {
  Paper, Stack, Text, NumberInput, Button, Group, Popover, Box, Anchor,
} from '@mantine/core';
import { IconPencil, IconClock, IconCircleCheck } from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { ca } from 'date-fns/locale';

interface ProductCardProps {
  productName: string;
  todayQuantity: number | null;
  lastUpdatedAt?: Date | null;
  opened: boolean;
  onOpenChange: (opened: boolean) => void;
  onSave: (qty: number) => Promise<void>;
  onEditName: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  productName, todayQuantity, lastUpdatedAt, opened, onOpenChange, onSave, onEditName,
}) => {
  const [draft, setDraft] = useState<number | string>(todayQuantity ?? '');

  // Nomes reinicialitzem el draft quan el popover s'obre. Si depenem tambe de
  // todayQuantity, el re-render del pare durant el guardat (que actualitza
  // todayByProduct) fa que aquest effect dispari un setDraft mentre el
  // Popover encara esta visible, causant flickers d'animacio.
  useEffect(() => {
    if (opened) setDraft(todayQuantity ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleToggle = () => {
    onOpenChange(!opened);
  };

  // Tanquem el popover immediatament (abans de l'await) per evitar que els
  // re-renders provocats per setEntries al pare reobrin/repintin el Popover
  // mentre s'esta animant el tancament. Si la crida falla, el pare ja mostra
  // una notificacio d'error; l'usuari pot tornar a clicar la card per reintentar.
  const handleSave = () => {
    if (draft === '' || draft === null || draft === undefined) return;
    const qty = Number(draft);
    onOpenChange(false);
    onSave(qty).catch(() => { /* error ja notificat pel pare */ });
  };

  const handleEditName = () => {
    onOpenChange(false);
    onEditName();
  };

  const hasToday = todayQuantity !== null;
  const accent = hasToday ? 'var(--mantine-color-indigo-5)' : 'var(--mantine-color-gray-3)';
  const bg = hasToday ? 'var(--mantine-color-indigo-0)' : 'var(--mantine-color-white)';

  return (
    <Popover
      opened={opened}
      onClose={handleClose}
      withArrow
      trapFocus
      position="bottom"
      shadow="md"
      width={240}
      withinPortal
    >
      <Popover.Target>
        <Paper
          withBorder
          radius="md"
          p="sm"
          onClick={handleToggle}
          style={{
            cursor: 'pointer',
            borderColor: accent,
            background: bg,
            minHeight: 118,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 80ms ease, box-shadow 120ms ease',
          }}
          role="button"
          aria-label={`Edita quantitat de ${productName}`}
        >
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap={6}>
            <Text size="sm" fw={600} lineClamp={2} style={{ lineHeight: 1.2 }}>
              {productName}
            </Text>
            {hasToday ? (
              <IconCircleCheck size={16} color="var(--mantine-color-indigo-6)" />
            ) : (
              <IconPencil size={16} style={{ opacity: 0.45 }} />
            )}
          </Group>

          <Box>
            <Text
              fw={800}
              size="32px"
              c={hasToday ? 'indigo.7' : 'dimmed'}
              style={{ lineHeight: 1, letterSpacing: '-0.02em' }}
            >
              {hasToday ? todayQuantity : '—'}
            </Text>
            {lastUpdatedAt ? (
              <Group gap={4} mt={6} wrap="nowrap">
                <IconClock size={12} style={{ opacity: 0.6 }} />
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {formatDistanceToNow(lastUpdatedAt, { addSuffix: true, locale: ca })}
                </Text>
              </Group>
            ) : (
              <Text size="xs" c="dimmed" mt={6}>Sense actualitzar avui</Text>
            )}
          </Box>
        </Paper>
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap="xs">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text size="sm" fw={600} lineClamp={1}>{productName}</Text>
            <Anchor
              component="button"
              type="button"
              size="xs"
              onClick={handleEditName}
            >
              Edita nom
            </Anchor>
          </Group>
          <NumberInput
            value={draft}
            onChange={(v) => setDraft(v ?? '')}
            min={0}
            data-autofocus
            inputMode="numeric"
            size="md"
            placeholder="Quantitat avui"
            hideControls={false}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
          <Group grow>
            <Button variant="default" onClick={handleClose}>
              Cancel·la
            </Button>
            <Button color="indigo" onClick={handleSave}>
              Guarda
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

export default ProductCard;
