import React from 'react';
import { Box, Text, useInput } from 'ink';

interface ConfirmModalProps {
  /** Modal title */
  title: string;
  /** Modal message */
  message: string;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Callback when cancelled */
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps): React.ReactElement {
  useInput((input, key) => {
    if (input === 'y' || input === 'Y') {
      onConfirm();
    } else if (input === 'n' || input === 'N' || key.escape) {
      onCancel();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      paddingX={2}
      paddingY={1}
      width={60}
    >
      <Text bold>{title}</Text>
      <Box marginY={1}>
        <Text>{message}</Text>
      </Box>
      <Box>
        <Text color="green">[Y]</Text>
        <Text>es </Text>
        <Text color="red">[N]</Text>
        <Text>o</Text>
      </Box>
    </Box>
  );
}

export default ConfirmModal;
