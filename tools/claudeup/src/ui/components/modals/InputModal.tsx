import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface InputModalProps {
  /** Modal title */
  title: string;
  /** Input label */
  label: string;
  /** Default input value */
  defaultValue?: string;
  /** Callback when submitted */
  onSubmit: (value: string) => void;
  /** Callback when cancelled */
  onCancel: () => void;
}

export function InputModal({
  title,
  label,
  defaultValue = '',
  onSubmit,
  onCancel,
}: InputModalProps): React.ReactElement {
  const [value, setValue] = useState(defaultValue);

  useInput((input, key) => {
    if (key.return) {
      onSubmit(value);
    } else if (key.escape) {
      onCancel();
    } else if (key.backspace || key.delete) {
      setValue((prev) => prev.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setValue((prev) => prev + input);
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      width={60}
    >
      <Text bold>{title}</Text>

      <Box marginY={1}>
        <Text>{label}</Text>
      </Box>

      <Box
        borderStyle="single"
        borderColor="green"
        paddingX={1}
        width={56}
      >
        <Text>
          {value}
          <Text inverse> </Text>
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color="gray">Enter to confirm • Escape to cancel</Text>
      </Box>
    </Box>
  );
}

export default InputModal;
