
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_clim_ir = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.CLIM_IR} 
    variant="visual"
    width={24}
    height={24}
    style={{ fill: '#000', ...style }}
    {...props}
  />
);

export default Icon_clim_ir;