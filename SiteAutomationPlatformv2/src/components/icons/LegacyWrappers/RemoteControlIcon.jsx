
import IconFactory from '../IconFactory';
import { ICON_TYPES } from '../IconRegistry';

const RemoteControlIcon = ({ style = {}, ...props }) => (
  <IconFactory 
    type={ICON_TYPES.REMOTE_CONTROL} 
    variant="visual"
    width={24}
    height={24}
    style={style}
    {...props}
  />
);

export default RemoteControlIcon;