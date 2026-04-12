import { Grid } from "antd";

export function useResponsive() {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  return { isMobile, screens };
}
