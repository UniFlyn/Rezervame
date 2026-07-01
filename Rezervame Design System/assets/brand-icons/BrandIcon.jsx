import { brandIcons } from './icon-data.js';

export function BrandIcon({ name, size, ...rest }) {
  const d = brandIcons[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox={d.viewBox}
      fill="none"
      dangerouslySetInnerHTML={{ __html: d.body }}
      {...rest}
    />
  );
}
export default BrandIcon;
