
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_eclairage_gtb = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.ECLAIRAGE} 
    variant="gtb"
    width={24}
    height={24}
    style={style}
    {...props}
  />
);

export default Icon_eclairage_gtb;