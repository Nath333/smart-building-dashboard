
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_sondesPresentes = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.SONDES_PRESENTES} 
    variant="gtb"
    width={24}
    height={24}
    style={style}
    {...props}
  />
);

export default Icon_sondesPresentes;