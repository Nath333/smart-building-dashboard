
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_rooftop = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.ROOFTOP} 
    variant="visual"
    width={24}
    height={24}
    style={style}
    {...props}
  />
);

export default Icon_rooftop;