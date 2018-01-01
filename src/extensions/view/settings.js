import { escapeReg } from '../../core/utils';

export const leftDelimiter = '{{';
export const rightDelimiter = '}}';
export const leftDelimiterReg = escapeReg( leftDelimiter );
export const rightDelimiterReg = escapeReg( rightDelimiter );
