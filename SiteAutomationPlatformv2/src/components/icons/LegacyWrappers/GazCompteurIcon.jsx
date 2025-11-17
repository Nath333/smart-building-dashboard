
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const Icon_gazCompteur = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.GAZ_COMPTEUR} 
    variant="gtb"
    width={24}
    height={24}
    style={style}
    {...props}
  />
);

export default Icon_gazCompteur;