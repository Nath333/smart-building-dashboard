
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_aerogaz = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.AERO_GAZ} 
    variant="gtb"
    width={24}
    height={24}
    style={style}
    {...props}
  />
);

export default Icon_aerogaz;