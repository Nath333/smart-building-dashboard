
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_comptage_eclairage = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.COMPTAGE_ECLAIRAGE} 
    variant="gtb"
    width={24}
    height={24}
    style={style}
    {...props}
  />
);

export default Icon_comptage_eclairage;