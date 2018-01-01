import { currentScript } from './utils';
import { __extensions } from '../variables';
const extend = c => __extensions[ currentScript().getAttribute( 'data-src' ) ] = c;
export default extend;
