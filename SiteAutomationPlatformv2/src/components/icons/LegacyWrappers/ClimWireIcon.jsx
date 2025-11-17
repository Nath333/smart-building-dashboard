
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_clim_wire = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.CLIM_WIRE} 
    variant="visual"
    width={24}
    height={24}
    style={style}
    {...props}
  />
);

export default Icon_clim_wire;