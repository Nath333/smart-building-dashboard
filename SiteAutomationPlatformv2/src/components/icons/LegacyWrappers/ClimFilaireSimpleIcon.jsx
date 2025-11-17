
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_clim_filaire_simple = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.CLIM_FILAIRE_SIMPLE} 
    variant="gtb"
    width={24}
    height={24}
    style={style}
    {...props}
  />
);

export default Icon_clim_filaire_simple;