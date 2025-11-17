
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_izit = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.IZIT} 
    variant="gtb"
    width={24}
    height={24}
    style={style}
    {...props}
  />
);

export default Icon_izit;