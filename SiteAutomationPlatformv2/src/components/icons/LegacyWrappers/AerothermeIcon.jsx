
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_aerotherme = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.AEROTHERME} 
    variant="visual"
    width={54}
    height={54}
    style={style}
    {...props}
  />
);

export default Icon_aerotherme;