interface IndexStatus {
  indexed: boolean;
  symbolCount?: string;
}

function parseIndexStatus(status: string | null): IndexStatus {
  if (!status) return { indexed: false };

  if (/^exists[\t ]*=[\t ]*false[\t ]*$/imu.test(status)) {
    return { indexed: false };
  }

  const positionalMatch = status.match(/\b(\d+)[\t ]+(chunks|symbols)\b/iu);
  if (positionalMatch) {
    return {
      indexed: true,
      symbolCount: `${positionalMatch[1]} ${positionalMatch[2].toLowerCase()}`,
    };
  }

  const keyValueMatch = status.match(
    /^(chunks|symbols)[\t ]*=[\t ]*(\d+)[\t ]*$/imu
  );
  if (keyValueMatch) {
    return {
      indexed: true,
      symbolCount: `${keyValueMatch[2]} ${keyValueMatch[1]}`,
    };
  }

  return { indexed: false };
}

export { parseIndexStatus };
export type { IndexStatus };
