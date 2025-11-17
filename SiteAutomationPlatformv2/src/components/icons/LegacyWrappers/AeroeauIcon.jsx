
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_aeroeau = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.AERO_EAU} 
    variant="gtb"
    width={24}
    height={24}
    style={style}
    {...props}
  />
);

export default Icon_aeroeau;