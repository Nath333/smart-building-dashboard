
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_circle = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.CIRCLE} 
    variant="visual"
    width={24}
    height={24}
    style={style}
    {...props}
  />
);

export default Icon_circle;