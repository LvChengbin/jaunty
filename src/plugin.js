import { currentScript } from './utils';
import { __plugins } from './variables';
const plugin = c => __plugins[ currentScript().getAttribute( 'data-src' ) ] = c;
export default plugin;
