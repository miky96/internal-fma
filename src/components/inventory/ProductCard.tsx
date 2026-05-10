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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (opened) setDraft(todayQuantity ?? '');
  }, [opened, todayQuantity]);

  const handleClose = () => {
    if (!saving) onOpenChange(false);
  };

  const handleToggle = () => {
    if (saving) return;
    onOpenChange(!opened);
  };

  const handleSave = async () => {
    if (draft === '' || draft === null || draft === undefined) return;
    setSaving(true);
    try {
      await onSave(Number(draft));
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
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
              disabled={saving}
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
            <Button variant="default" onClick={handleClose} disabled={saving}>
              Cancel·la
            </Button>
            <Button color="indigo" onClick={handleSave} loading={saving}>
              Guarda
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

export default ProductCard;
