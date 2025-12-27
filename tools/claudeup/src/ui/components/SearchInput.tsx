import React from 'react';
import { Box, Text, useInput } from 'ink';

interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Called when value changes */
  onChange: (value: string) => void;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Whether the input is focused/active */
  isActive: boolean;
  /** Called when user presses escape to exit search */
  onExit?: () => void;
  /** Called when user presses enter */
  onSubmit?: () => void;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  isActive,
  onExit,
  onSubmit,
}: SearchInputProps): React.ReactElement {
  useInput(
    (input, key) => {
      if (!isActive) return;

      if (key.escape) {
        onExit?.();
        return;
      }

      if (key.return) {
        onSubmit?.();
        return;
      }

      if (key.backspace || key.delete) {
        onChange(value.slice(0, -1));
        return;
      }

      // Only accept printable characters
      if (input && !key.ctrl && !key.meta) {
        onChange(value + input);
      }
    },
    { isActive }
  );

  const displayValue = value || (isActive ? '' : placeholder);
  const showCursor = isActive;
  const textColor = value ? 'white' : 'gray';

  return (
    <Box>
      <Text color="cyan">❯ </Text>
      <Text color={textColor}>{displayValue}</Text>
      {showCursor && <Text color="cyan">▋</Text>}
    </Box>
  );
}

export default SearchInput;
