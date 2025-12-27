import React from 'react';
import { Box, Text, useInput } from 'ink';

interface MessageModalProps {
  /** Modal title */
  title: string;
  /** Modal message */
  message: string;
  /** Message variant */
  variant: 'info' | 'success' | 'error';
  /** Callback when dismissed */
  onDismiss: () => void;
}

const variantConfig = {
  info: { icon: 'ℹ', color: 'cyan' },
  success: { icon: '✓', color: 'green' },
  error: { icon: '✗', color: 'red' },
} as const;

export function MessageModal({
  title,
  message,
  variant,
  onDismiss,
}: MessageModalProps): React.ReactElement {
  const config = variantConfig[variant];

  useInput(() => {
    // Any key dismisses
    onDismiss();
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={config.color}
      paddingX={2}
      paddingY={1}
      width={60}
    >
      <Box>
        <Text color={config.color}>{config.icon}</Text>
        <Text bold> {title}</Text>
      </Box>

      <Box marginY={1}>
        <Text>{message}</Text>
      </Box>

      <Box>
        <Text color="gray">Press any key to continue</Text>
      </Box>
    </Box>
  );
}

export default MessageModal;
