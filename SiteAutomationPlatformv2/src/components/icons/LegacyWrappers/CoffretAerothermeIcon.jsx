
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_coffret_aerotherme = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.COFFRET_AEROTHERME} 
    variant="visual"
    width={24}
    height={24}
    style={style}
    {...props}
  />
);

export default Icon_coffret_aerotherme;